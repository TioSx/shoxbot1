const {
	ActionRowBuilder,
	PermissionFlagsBits,
	UserSelectMenuBuilder,
} = require("discord.js");

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "ticket-add",

	/**@param {import("discord.js").ButtonInteraction} interaction  */
	async execute(interaction, args) {
		if (!interaction.member.permissions.has(PermissionFlagsBits.MoveMembers))
			return interaction.reply({
				content: "❌ | Você não tem permissão de adicionar membros nesse ticket! Peça a um administrador",
				ephemeral: true,
			});

		return interaction.reply({
			content: "👤 | Selecione o(s) usuário(s) para adicionar ao ticket",
			ephemeral: true,
			components: [
				new ActionRowBuilder().addComponents(
					new UserSelectMenuBuilder()
						.setCustomId(JSON.stringify({ id: "ticket-add" }))
						.setPlaceholder("Selecione o(s) usuário(s)")
						.setMinValues(1)
						.setMaxValues(10)
				),
			],
		});
	},
};
