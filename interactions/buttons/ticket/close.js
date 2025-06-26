const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    EmbedBuilder,
    codeBlock,
} = require("discord.js");
const Ticket = require(`${process.cwd()}/database/models/ticketActions.js`);
const ticketLogs = require("../../../util/ticketLogs");
const { createTranscript } = require('discord-html-transcripts');

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
    id: "ticket-close",

    /** @param {import('discord.js').ButtonInteraction} interaction  */
    async execute(interaction, args) {
        try {
            const ticket = await Ticket.findOne({ channel_id: interaction.channel.id });

            if (!ticket)
                return interaction.reply({
                    content: "❌ | Este ticket não está cadastrado na database",
                    ephemeral: true,
                });

            if (ticket.closed) {
                await interaction.update({ components: [] });
                return interaction.followUp({
                    content: "❌ | Este ticket já está fechado",
                    ephemeral: true,
                });
            }

            const timestamp = Date.now();
            const date = new Date(timestamp);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

            if (!interaction.member.permissions.has(PermissionFlagsBits.MoveMembers)) {
                if (ticket.members[0] === interaction.user.id) {
                    if (ticket.createdAt < formattedDate) {
                        return interaction.reply({
                            content: "❌ | Você não pode mais encerrar esse ticket.",
                            ephemeral: true,
                        });
                    }
                    return interaction.channel.delete();
                } else {
                    return interaction.reply({
                        content: "❌ | Você não tem permissão para encerrar este ticket.",
                        ephemeral: true,
                    });
                }
            }

            await interaction.update({
                components: interaction.message.components.map((row) => {
                    return new ActionRowBuilder().addComponents(
                        row.components.map((component) =>
                            ButtonBuilder.from(component).setDisabled(true)
                        )
                    );
                }),
            });

            const closeEmbed = new EmbedBuilder()
                .setDescription(`⚠️ | Você tem certeza que deseja encerrar este ticket?`)
                .setColor('Purple');

            const checkMessage = await interaction.followUp({
                embeds: [closeEmbed],
                fetchReply: true,
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("yes")
                            .setLabel("Sim")
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId("no")
                            .setLabel("Não")
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
                ephemeral: true,
            });

            const checkInteraction = await checkMessage
                .awaitMessageComponent({
                    filter: (i) => i.user.id === interaction.user.id,
                    time: 30000,
                })
                .catch(() => null);

            if (!checkInteraction || checkInteraction.customId === "no") {
                await checkMessage.delete().catch(() => null);

                // Re-enable all buttons in all action rows
                await interaction.editReply({
                    components: interaction.message.components.map((row) => {
                        return new ActionRowBuilder().addComponents(
                            row.components.map((component) =>
                                ButtonBuilder.from(component).setDisabled(false)
                            )
                        );
                    }),
                });

                if (checkInteraction)
                    return checkInteraction.reply({
                        content: "❌ | Ação cancelada.",
                        ephemeral: true,
                    });
                else
                    return interaction.followUp({
                        content: "❌ | Ação cancelada.",
                        ephemeral: true,
                    });
            } else {
                await checkInteraction.deferUpdate();

                await checkMessage.delete().catch(() => null);

                // Remove all buttons after confirming
                await interaction.editReply({
                    components: [],
                });

                // PRIMEIRA atualização rápida de status:
                await Ticket.updateOne(
                    { channel_id: interaction.channel.id },
                    {
                        transcriptUrl: ticket.transcriptUrl, // pode ser null neste ponto
                        opened: false,
                        closedBy: interaction.user.id,
                        closedAt: new Date()
                    }
                );

                const overwrites = interaction.channel.permissionOverwrites.cache.clone();
                ticket.members.forEach((memberId) => {
                    overwrites.set(memberId, {
                        id: memberId,
                        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                        type: "member",
                    });
                });

                await interaction.channel.permissionOverwrites.set(
                    overwrites,
                    "Fechamento do ticket"
                );

                await interaction.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Purple")
                            .setDescription(`🔴 | Ticket encerrado por ${interaction.user}`)
                            .setTimestamp()
                            .setFooter({ text: "Brasil Play Shox" }),
                    ],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(JSON.stringify({ id: "ticket-delete" }))
                                .setLabel("Deletar Ticket")
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji("🗑️")
                        ),
                    ],
                });

                // -------- ADICIONA CAMPO ASSUMIDO POR --------
                const validStaff = (ticket.staff || []).filter(id => id && id !== "none");
                const assumedBy = validStaff.length
                    ? validStaff.map((id, i) => `${i + 1} - <@${id}>`).join("\n")
                    : "Nenhum responsável";
                // -------------------------------------------------

                let transcriptUrl = null;

                if (ticket.createdAt < formattedDate) {
                    const user = await interaction.client.users
                        .fetch(ticket.members[0])
                        .catch(() => null);

                    const { channel } = interaction;

                    const transcriptfile = await createTranscript(channel, {
                        limit: -1,
                        returnBuffer: false,
                        returnType: 'attachment',
                        saveImages: true,
                        poweredBy: false,
                        filename: `Ticket sv${ticket.server}-${ticket.department}-${ticket.id} - Brasil Play Shox.html`,
                        footerText: `Ticket Brasil Play Shox - Servidor: ${ticket.server}, Departamento: ${
                            ticket.department.charAt(0).toUpperCase() +
                            ticket.department.slice(1).toLowerCase()
                        }, Ticket: #${ticket.id}`,
                    });

                    user
                        ?.send({
                            content:
                                "Para visualizar o historico do seu ticket, baixe o arquivo `.html` e abra no seu navegador.",
                            files: [transcriptfile],
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("🔴 Ticket Encerrado")
                                    .setFields([
                                        { name: "👤 Usuário", value: `<@${ticket.members[0]}>` },
                                        { name: "🪪 ID", value: codeBlock(`${ticket.members[0]}`) },
                                        { name: "❌ Encerrado por", value: `${interaction.user}` },
                                        { name: "🪃 Assumido por", value: assumedBy },
                                        {
                                            name: "🎟 ticket",
                                            value: codeBlock(
                                                `sv${ticket.server}-${ticket.department}-${ticket.id}`
                                            ),
                                        },
                                        {
                                            name: "🖥 Servidor",
                                            value: codeBlock(`Servidor ${ticket.server}`),
                                        },
                                        {
                                            name: "📁 Departamento",
                                            value: codeBlock(ticket.department),
                                        },
                                    ])
                                    .setColor("Red")
                                    .setThumbnail(
                                        interaction.guild.iconURL({
                                            dynamic: true,
                                            size: 512,
                                        })
                                    )
                                    .setFooter({
                                        text: `ticket #${ticket.id} - Brasil Play Shox`,
                                    })
                                    .setTimestamp(),
                            ],
                        })
                        .catch(() => null);

                    // Envia no canal de logs e salva a URL DIRETA do anexo .html
                    const transcriptMsg = await ticketLogs(
                        interaction.guild,
                        {
                            content:
                                "Para visualizar o historico do seu ticket, baixe o arquivo `.html` e abra no seu navegador.",
                            files: [transcriptfile],
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("🔵 Transcript Ticket")
                                    .setFields([
                                        { name: "👤 Usuário", value: `<@${ticket.members[0]}>` },
                                        { name: "🪪 ID", value: codeBlock(`${ticket.members[0]}`) },
                                        { name: "🪃 Assumido por", value: assumedBy },
                                        {
                                            name: "🖥 Servidor",
                                            value: codeBlock(`Servidor ${ticket.server}`),
                                        },
                                        {
                                            name: "📁 Departamento",
                                            value: codeBlock(ticket.department),
                                        },
                                        {
                                            name: "🎟 Ticket",
                                            value: codeBlock(
                                                `sv${ticket.server}-${ticket.department}-${ticket.id}`
                                            ),
                                        },
                                    ])
                                    .setColor("Blue")
                                    .setThumbnail(
                                        interaction.guild.iconURL({
                                            dynamic: true,
                                            size: 512,
                                        })
                                    )
                                    .setFooter({
                                        text: `Ticket #${ticket.id} - Brasil Play Shox`,
                                    })
                                    .setTimestamp(),
                            ],
                        },
                        true
                    ).catch(() => null);

                    // Captura a URL DIRETA do arquivo .html
                    transcriptUrl = transcriptMsg?.attachments?.first()?.url || null;
                }

                // SEGUNDA atualização, agora já com a transcriptUrl, SEM esquecer a vírgula!
                await Ticket.updateOne(
                    { channel_id: interaction.channel.id },
                    {
                        transcriptUrl: transcriptUrl,
                        opened: false,
                        closedBy: interaction.user.id,
                        closedAt: new Date()
                    }
                );

                interaction.client.tickets.delete(interaction.channel.id);

                await ticketLogs(interaction.guild, {
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("🟠 Ticket Encerrado")
                            .setFields([
                                { name: "👤 Aberto por", value: `<@${ticket.members[0]}>` },
                                { name: "🪪 ID", value: codeBlock(`${ticket.members[0]}`) },
                                { name: "❌ Encerrado por", value: `${interaction.user}` },
                                { name: "🪃 Assumido por", value: assumedBy },
                                {
                                    name: "🖥 Servidor",
                                    value: codeBlock(`Servidor ${ticket.server}`),
                                },
                                {
                                    name: "📁 Departamento",
                                    value: codeBlock(ticket.department),
                                },
                            ])
                            .setColor("Orange")
                            .setThumbnail(
                                interaction.guild.iconURL({ dynamic: true, size: 512 })
                            )
                            .setFooter({
                                text: `Ticket #${ticket.id} - Brasil Play Shox`,
                            })
                            .setTimestamp(),
                    ],
                    components: transcriptUrl
                        ? [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setURL(transcriptUrl)
                                    .setLabel("Transcrição")
                                    .setStyle(ButtonStyle.Link)
                            ),
                        ]
                        : [],
                });

                // --- Envio da DM de feedback SEMPRE ---
                try {
                    const user = await interaction.client.users
                        .fetch(ticket.members[0])
                        .catch(() => null);

                    if (user) {
                        user.send({
                            embeds: [
                                {
                                    color: 0x00ff00,
                                    title: 'Como foi sua experiência com o nosso atendimento?',
                                    description:
                                        ':star: 1 - Muito insatisfeito\n:star: 5 - Muito satisfeito\n\nClique em uma das reações para avaliar o atendimento.',
                                },
                            ],
                            components: [
                                new ActionRowBuilder().addComponents(
                                    ...[1, 2, 3, 4, 5].map((star) =>
                                        new ButtonBuilder()
                                            .setCustomId(
                                                JSON.stringify({
                                                    id: 'fdbk',
                                                    s: star,
                                                    u: interaction.user.id,
                                                    p: interaction.channel.parentId,
                                                    c: interaction.channel.id,
                                                })
                                            )
                                            .setStyle(ButtonStyle.Primary)
                                            .setEmoji('⭐')
                                            .setLabel(`${star}`)
                                    )
                                ),
                            ],
                        }).catch(() => null);
                    }
                } catch (e) {
                    // erro ao enviar DM
                }
            }
        } catch (error) {
            console.error(error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp({
                        content: "Ocorreu um erro ao processar sua solicitação.",
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({
                        content: "Ocorreu um erro ao processar sua solicitação.",
                        ephemeral: true,
                    });
                }
            } catch (err) {
                console.error('Falha ao enviar resposta de erro:', err);
            }
        }
    },
};
