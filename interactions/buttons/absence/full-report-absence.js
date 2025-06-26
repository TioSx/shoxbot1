const {
	ActionRowBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
    ComponentType,
} = require("discord.js");
const { PaginationWrapper } = require("djs-button-pages");
const { NextPageButton, PreviousPageButton } = require('@djs-button-pages/presets');
const { asyncQuery } = require("../../../database");

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "full-report-absence",

	/**@param {import("discord.js").ButtonInteraction} interaction  */
	async execute(interaction, args) {
        const { user } = args

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

		const message = await interaction.update({ content: "**Selecione se você quer as ausências deste mês ou todas.**", components: [row], embeds: [] })

		const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, max: 1, time: 300000  }); // 300000 = 5 minutes

		collector.on('collect', async i => {
			await i.deferUpdate()

            const allAbsences = await asyncQuery(
                "SELECT * FROM `absence` WHERE `user_id` = ?",
                "return",
                [user.id]
            );

            const currentDate = new Date()
            const currentMonth = currentDate.getMonth()

            const absencesThisMonth = allAbsences.filter(absence => {
                const absenceDate = new Date(absence.date)
                return absenceDate.getMonth() === currentMonth
            })
    
            const logs = i.values[0] === "total" ? allAbsences.map(({ shift, close_reports, date, reason, possible_time }) => {
                const absenceDate = new Date(date).toLocaleString("pt-BR")
                
                return `\`\`\`Data: ${absenceDate}\nTurno: ${shift === "morning" ? "Manhã" : shift === "afternoon" ? "Tarde": "Noite"}\nFechou denuncias: ${close_reports === 1 ? "Sim" : "Não"}\nMotivo: ${reason}\nPossível horário de login: ${possible_time}\`\`\`\n`
            }) : absencesThisMonth.map(({ shift, close_reports, date, reason, possible_time }) => {
                const absenceDate = new Date(date).toLocaleString("pt-BR")
                
                return `\`\`\`Data: ${absenceDate}\nTurno: ${shift === "morning" ? "Manhã" : shift === "afternoon" ? "Tarde": "Noite"}\nFechou denuncias: ${close_reports === 1 ? "Sim" : "Não"}\nMotivo: ${reason}\nPossível horário de login: ${possible_time}\`\`\`\n`
            })
    
            let description = ""
            const embeds = []

            const defaultEmbed = {
                color: 3447003,
                title: `🕒 | Ausências ${i.values[0] === "total" ? "Totais" : "Mensal"} de ${user.tag} (${user.id})`,
                thumbnail: { url: "https://cdn.discordapp.com/icons/656244004609851455/a_2c72393a0f972c7970c5871150704a62.gif" },
                footer: {
                    iconURL: "https://cdn.discordapp.com/icons/656244004609851455/a_2c72393a0f972c7970c5871150704a62.gif",
                    text: "Brasil Play Shox"
                }
            };
    
            for (const log of logs) {
                if (description.length + log.length > 2048) {
                    const embed = { ...defaultEmbed, description };
                    embeds.push(embed)
                    description = "";
                }
    
                description += log
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
	},
};
