const {
	UserSelectMenuInteraction,
	ActionRowBuilder,
	ModalBuilder,
	TextInputStyle,
	TextInputBuilder,
	ComponentType,
	StringSelectMenuBuilder,
} = require("discord.js");

/**
 * @type {import('../../../typings').SelectInteractionCommand}
 */
module.exports = {
	id: "absence",

	/**
	 *
	 * @param {UserSelectMenuInteraction} interaction
	 */
	async execute(interaction, args) {
		const row = new ActionRowBuilder().setComponents(
			new StringSelectMenuBuilder()
				.setCustomId(
					JSON.stringify({ id: "close-report-absence"})
				)
				.setPlaceholder("Você fechou as denúncias?")
				.addOptions(
					{
						value: "yes",
						label: "Sim",
						emoji: "✅",
					},
					{
						value: "no",
						label: "Não",
						emoji: "❌",
					}
				)
		)

		const message = await interaction.update({ components: [row] })

		const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, max: 1, time: 300000  }); // 300000 = 5 minutes

		collector.on('collect', async i => {
			i.showModal(
				new ModalBuilder()
					.setTitle("🕒 Solicitar Ausência")
					.setCustomId(
						JSON.stringify({
							id: "absence",
							shift: interaction.values[0],
							close_reports: i.values[0]
						})
					)
					.setComponents(
						new ActionRowBuilder().setComponents(
							new TextInputBuilder()
								.setCustomId("reason")
								.setLabel("Motivo:")
								.setPlaceholder("Ex: Tenho que salvar meu guaxinim")
								.setMinLength(5)
								.setStyle(TextInputStyle.Paragraph)
								.setRequired(true)
						),
						new ActionRowBuilder().setComponents(
							new TextInputBuilder()
								.setCustomId("possible_time")
								.setLabel("Tempo possível:")
								.setPlaceholder("Ex: 15/02/2024 às 15:00 até 18:00")
								.setMinLength(5)
								.setStyle(TextInputStyle.Paragraph)
								.setRequired(true)
						)
					)
			);
		});

		collector.on('end', (collected, reason) => {
			switch(reason) {
				case "time":
					return interaction.editReply({ content: "❌ | Está ação foi cancelada devido ao tempo limite.", components: [], embeds: [] })
				case "limit":
					return interaction.editReply({ content: "Aguardando motivo...", components: [], embeds: [] })
				default:
					return interaction.editReply({ content: "❌ | Está ação foi cancelada.", components: [], embeds: [] })
			}	
		});
	},
};
