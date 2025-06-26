const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	PermissionFlagsBits,
} = require("discord.js");

const help = require("../../../help.json");

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDMPermission(false)
		.setDescription("🎫 | Cria o painel de auto-ajuda")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	global: true,

	async execute(interaction) {
		const buttons = help.map((item) =>
			new ButtonBuilder()
				.setCustomId(JSON.stringify({ id: "help", type: item.id }))
				.setLabel(item.name)
				.setStyle(ButtonStyle.Primary)
				.setEmoji(item.emoji)
		);

		const actionRows = [];

		for (let i = 0; i < buttons.length; i += 5) {
			actionRows.push(
				new ActionRowBuilder().addComponents(buttons.slice(i, i + 5))
			);
		}

		await interaction.channel.send({
			embeds: [
				new EmbedBuilder()
					.setColor("Purple")
					.setAuthor({
						name: "❔ Precisa de ajuda? Está no local certo! Seja bem-vindo(a) ao sistema de auto-ajuda do Brasil Play Shox",
					})
					.setThumbnail(interaction.guild.iconURL({ dynamic: true }))
					.setFields(
						help.map((item) => ({
							name: `${item.emoji} ${item.name}`,
							value: item.description,
							inline: false,
						}))
					)
					.setFooter({ text: "Basta selecionar a opção desejada abaixo" }),
			],
			components: actionRows.slice(0, 5),
		});

		await interaction.reply({
			content: "🎫 | Painel de auto-ajuda criado com sucesso!",
			ephemeral: true,
		});
	},
};
