const { SlashCommandBuilder } = require("discord.js");

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDMPermission(true)
		.setDescription("🏓 | Verifica o ping do bot"),
	global: true,

	async execute(interaction) {
		const now = Date.now();

		await interaction.deferReply();

		const ping = Date.now() - now;

		interaction.editReply({
			content: `🏓 **Pong**\nDiscord: \`${interaction.client.ws.ping} ms\`\nInteração: \`${ping} ms\``,
		});
	},
};
