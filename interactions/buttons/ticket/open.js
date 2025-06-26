const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require("discord.js");
const Block = require(`${process.cwd()}/database/models/block.js`);

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
    id: "ticket",

    async execute(interaction, args) {

        if (!args.server) {
            serversEmbed = new EmbedBuilder()
                .setDescription(`🎫 | Escolha o servidor que deseja resolver sua dúvida/seu problema!`)
                .setColor('Purple')

            await interaction.reply({
                embeds: [serversEmbed],
                ephemeral: true,
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(JSON.stringify({ id: "ticket", server: 1 }))
                            .setLabel("Servidor 1")
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(JSON.stringify({ id: "ticket", server: 2 }))
                            .setLabel("Servidor 2")
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(JSON.stringify({ id: "ticket", server: 3 }))
                            .setLabel("Servidor 3")
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(JSON.stringify({ id: "ticket", server: 4 }))
                            .setLabel("Servidor 4")
                            .setStyle(ButtonStyle.Secondary)
                    ),
                ],
            });
            return;
        } else {

            const customIdData = JSON.parse(interaction.customId);
            const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
            if (customIdData.id === 'ticket' && customIdData.server) {
                const server = customIdData.server;
                switch (server) {
                    case 1:
                        blockedRoleId = '1273427584545329244';
                        break;
                    case 2:
                        blockedRoleId = '1273427832290152620';
                        break;
                    case 3:
                        blockedRoleId = '1273427886489075784';
                        break;
                    case 4:
                        blockedRoleId = '1273427925479325736';
                        break;
                    default:
                        await interaction.reply({ content: 'Servidor não reconhecido.', ephemeral: true });
                        return;
                }
    
                if (member.roles.cache.has(blockedRoleId)) {
                    const muteRecord = await Block.findOne({ userId: interaction.user.id, roleId: blockedRoleId }).exec();
                    
                    let reason = 'Motivo não registrado.';
                    if (muteRecord) {
                        reason = muteRecord.reason || 'Motivo não registrado.';
                    }

                    const blockedEmbed = new EmbedBuilder()
                        .setTitle('Você está bloqueado!')
                        .setDescription(`Você está temporariamente bloqueado de abrir tickets no **Servidor ${server}**.\n**Motivo:** ${reason}`)
                        .setColor('Red')
                        .setTimestamp();
    
                    return interaction.reply({
                        embeds: [blockedEmbed],
                        ephemeral: true
                    });
                }
            } else {
                return;
            }

            departmentEmbed = new EmbedBuilder()
                .setDescription(`👥 | Agora selecione o departamento que deseja abrir`)
                .setColor('Purple')

            await interaction.update({
                embeds: [departmentEmbed],
                components: [
                    new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(
                                JSON.stringify({ id: "ticket", server: args.server })
                            )
                            .setPlaceholder("Selecione um departamento")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .addOptions([
                                {
                                    label: "Jogo",
                                    value: "jogo",
                                    emoji: "🎮",
                                },
                                {
                                    label: "Departamento de Denúncias",
                                    value: "denúncia",
                                    emoji: "🚨",
                                },
                                {
                                    label: "Departamento de Líderes",
                                    value: "lideres",
                                    emoji: "👑",
                                },
                                {
                                    label: "Departamento de Eventos",
                                    value: "eventos",
                                    emoji: "🎉",
                                },
                                {
                                    label: "Departamento de Famílias",
                                    value: "família",
                                    emoji: "👪",
                                },
                                {
                                    label: "Discord",
                                    value: "discord",
                                    emoji: "📞",
                                },
                            ])
                    ),
                ],
            });

            return;
        }
    },
};
