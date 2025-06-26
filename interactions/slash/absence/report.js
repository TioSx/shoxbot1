const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType, PermissionFlagsBits } = require("discord.js");
const config = require("../../../config.json");
const { asyncQuery } = require("../../../database");
const { PaginationWrapper } = require("djs-button-pages");
const { NextPageButton, PreviousPageButton } = require('@djs-button-pages/presets');

/**
 * @type {import('../../../typings').SlashInteractionCommand}
*/
module.exports = {
	data: new SlashCommandBuilder()
		.setName("relatorio-ausencias")
		.setDescription(
			"🕒 | Vizualizar relatório ausências."
		)
        .addUserOption(option =>
            option.setName("user")
                .setDescription("Usuario que você deseja ver o relatório."))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    global: true,

	async execute(interaction) {
        await interaction.deferReply({ ephemeral: true })

        const user = interaction.options.getUser("user") // se avatar
        const avatar = user && user.avatarURL()

		if (user) {
            const allAbsences = await asyncQuery(
                "SELECT * FROM `absence` WHERE `user_id` = ?",
                "return",
                [user.id]
            );
            
            if (allAbsences.length <= 0) {
                return interaction.editReply({ content: `O usuário <@${user.id}> não possui nenhuma ausência registrada.`})
            }
    
            const currentDate = new Date()
            const currentMonth = currentDate.getMonth()
    
            const absencesThisMonth = allAbsences.filter(absence => {
                const absenceDate = new Date(absence.date)
                return absenceDate.getMonth() === currentMonth
            })
    
            const shiftsCount = allAbsences.reduce((count, obj) => {
                const { shift } = obj;
                count[shift] = (count[shift] || 0) + 1;
                return count;
            }, {});
              
            const mostRegisteredShift = Object.keys(shiftsCount).reduce((a, b) => shiftsCount[a] > shiftsCount[b] ? a : b);
    
            const closeReportsCount = allAbsences.reduce((count, obj) => {
                const { close_reports } = obj;
                count[close_reports] = (count[close_reports] || 0) + 1;
                return count;
            }, {});
    
            const components = [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(JSON.stringify({ id: "full-report-absence", user: { id: user.id, tag: user.tag } }))
                            .setLabel("Relatório Completo")
                            .setEmoji("🕒")
                            .setDisabled(!user)
                            .setStyle(ButtonStyle.Primary)
                    )
            ]

            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Blue")
                        .setAuthor({ name: user.tag, iconURL: avatar, url: `https://discord.com/users/${user.id}` })
                        .setTitle("🕒 | Relatório Ausências")
                        .setThumbnail(avatar || "https://cdn.discordapp.com/icons/656244004609851455/a_2c72393a0f972c7970c5871150704a62.gif")
                        .setFields(
                            { name: "Total de ausências:", value: `\`\`\`${allAbsences.length}\`\`\`` },
                            { name: "Ausências nesse mês:", value: `\`\`\`${absencesThisMonth.length}\`\`\`` },
                            { name: "Fechou as denúncias na maioria das vezes:", value: `\`\`\`${closeReportsCount["1"] > closeReportsCount["0"] ? "Sim" : "Não" }\`\`\`` },
                            { name: "Turno mais registrado:", value: `\`\`\`${mostRegisteredShift === "morning" ? "Manhã" : mostRegisteredShift === "afternoon" ? "Tarde": "Noite"}\`\`\`` },
                            { name: "Última ausência:", value: `\`\`\`${new Date(allAbsences[allAbsences.length - 1].date).toLocaleString("pt-BR")}\`\`\`` },
                        )
                        .setFooter({
                            iconURL: "https://cdn.discordapp.com/icons/656244004609851455/a_2c72393a0f972c7970c5871150704a62.gif",
                            text: `Brasil Play Shox`
                        })
                ],
                components
            });
        }

        if (!user) {
            const row = new ActionRowBuilder().setComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(
                        JSON.stringify({ id: "select-option-full-report-absence"})
                    )
                    .setPlaceholder("Selecione uma opção.")
                    .addOptions(
                        {
                            value: "month",
                            label: "Esse mês.",
                            emoji: "📅",
                        },
                        {
                            value: "total",
                            label: "Total.",
                            emoji: "🗓️",
                        }
                    )
            )
    
            const message = await interaction.editReply({ content: "**Selecione se você quer as ausências deste mês ou todas.**", components: [row], embeds: [] })
    
            const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, max: 1, time: 300000  }); // 300000 = 5 minutes
    
            collector.on('collect', async i => {
                await i.deferUpdate()

                let guildIdIsInConfiguration = false
                
                for (const key in config.config_absence) {
                    const config_absence = config.config_absence[key]

                    if (interaction.guild.id === config_absence.guild_id || "") {
                        guildIdIsInConfiguration = true
                        break
                    }
                }

                const allAbsences = await asyncQuery(
                    `SELECT * FROM \`absence\` ${guildIdIsInConfiguration ? `WHERE \`guild_id\` = ${interaction.guild.id}` : ""}`,
                    "return"
                );
    
                if (allAbsences.length <= 0) {
                    return i.editReply({ content: `Não há nenhum registro de ausência.`})
                }

                const currentDate = new Date()
                const currentMonth = currentDate.getMonth()

                const absencesThisMonth = allAbsences.filter(absence => {
                    const absenceDate = new Date(absence.date)
                    return absenceDate.getMonth() === currentMonth
                })
    
                const table = i.values[0] === "total" ? allAbsences.reduce((acc, { user_id }) => {
                    if (acc[user_id]) {
                      acc[user_id]++;
                    } else {
                      acc[user_id] = 1;
                    }
                    return acc;
                }, {}) : absencesThisMonth.reduce((acc, { user_id }) => {
                    if (acc[user_id]) {
                      acc[user_id]++;
                    } else {
                      acc[user_id] = 1;
                    }
                    return acc;
                }, {})
                  
                const sortedTable = Object.entries(table)
                    .sort((a, b) => b[1] - a[1])
                    .reduce((acc, [user_id, count], index) => {
                      acc.push({ rank: index + 1, user_id, count });
                      return acc;
                    }, []);
    
                const ranks = sortedTable.map(({ rank, user_id, count }) => `**Rank ${rank}**: *Usuário <@${user_id}>*\`\`\`${count} ausências\`\`\`\n\n`);
    
                let description = ""
                const embeds = []
    
                const defaultEmbed = {
                    color: 3447003,
                    title: `🕒 | Relatório ${i.values[0] === "total" ? "Total" : "Mensal"} Ausências`,
                    thumbnail: { url: "https://cdn.discordapp.com/icons/656244004609851455/a_2c72393a0f972c7970c5871150704a62.gif" },
                    footer: {
                        iconURL: "https://cdn.discordapp.com/icons/656244004609851455/a_2c72393a0f972c7970c5871150704a62.gif",
                        text: "Brasil Play Shox"
                    }
                };
        
                for (const rank of ranks) {
                    if (description.length + rank.length > 2048) {
                        const embed = { ...defaultEmbed, description };
                        embeds.push(embed)
                        description = "";
                    }
        
                    description += rank
                }
        
                if (description.length > 0) {
                    const embed = { ...defaultEmbed, description };
                    embeds.push(embed);
                }
    
                const buttons = [
                    new PreviousPageButton({custom_id: "prev_page", emoji: "◀", style: ButtonStyle.Secondary}),
                    new NextPageButton({custom_id: "next_page", emoji: "▶", style: ButtonStyle.Secondary}),
                ];
        
                const pagination = new PaginationWrapper()
                    .setButtons(buttons)
                    .setEmbeds(embeds)
                    .setTime(60000);
        
                await pagination.interactionReply(i)
            });
    
            collector.on('end', (collected, reason) => {
                switch(reason) {
                    case "time":
                        return interaction.editReply({ content: "❌ | Está ação foi cancelada devido ao tempo limite.", components: [], embeds: [] })
                    case "limit":
                        return interaction.editReply({ content: "" })
                    default:
                        return interaction.editReply({ content: "❌ | Está ação foi cancelada.", components: [], embeds: [] })
                }	
            });

            return
        }

        return;
	},
};
