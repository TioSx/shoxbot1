const {
	ActionRowBuilder,
	StringSelectMenuBuilder,
} = require("discord.js");
const help = require("../../../help.json");

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "absence",

	/**@param {import("discord.js").ButtonInteraction} interaction  */
	async execute(interaction, args) {
		await interaction.deferReply({ ephemeral: true });

		const row = new ActionRowBuilder().setComponents(
			new StringSelectMenuBuilder()
				.setCustomId(
					JSON.stringify({ id: "absence", user: interaction.user.id })
				)
				.setPlaceholder("Selecione seu turno")
				.addOptions(
					{
						value: "morning",
						label: "Manhã",
						emoji: "🌅",
					},
					{
						value: "afternoon",
						label: "Tarde",
						emoji: "☀️",
					},
					{
						value: "evening",
						label: "Noite",
						emoji: "🌙",
					}
				)
		)

		await interaction.editReply({ components: [row] })
	},
};
