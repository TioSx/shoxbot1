const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	PermissionFlagsBits,
	UserSelectMenuBuilder,
	EmbedBuilder,
} = require("discord.js");

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "announce-send",

	/**@param {import("discord.js").ChannelSelectMenuInteraction} interaction  */
	async execute(interaction, args) {
		if (interaction.user.id !== args.user)
			return interaction.reply({
				content: "❌ | Você não tem permissão para usar este menu!",
				ephemeral: true,
			});

		const selected = interaction.channels.first();

		interaction.message.components.splice(-2, 2);

		await selected.send({
			content: interaction.message.content,
			embeds: interaction.message.embeds,
			components: interaction.message.components,
		});

		return interaction.update({
			content: "✅ | Mensagem enviada com sucesso!",
			components: [],
			embeds: [],
		});
	},
};
