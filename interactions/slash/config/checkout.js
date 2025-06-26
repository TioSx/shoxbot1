const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	PermissionFlagsBits,
} = require("discord.js");

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("checkout")
		.setDescription("⌚ | Envia o painel do sistema de bate-ponto para staff")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		interaction.channel.send({
			embeds: [
				new EmbedBuilder()
					.setTitle("📅 Bate-ponto ⏳")
					.setDescription(
						"⬇ Clique no botão abaixo para abrir o painel do sistema de bate-ponto\n\nAqui você ira gerir seu turno\n\n❗ *Deve ser utilizado somente para horário fixo*"
					)
					.setColor("Purple")
					.setThumbnail(
						interaction.guild.iconURL({ dynamic: true, size: 512 })
					),
			],
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(JSON.stringify({ id: "checkout" }))
						.setLabel("Abrir painel")
						.setStyle(ButtonStyle.Success)
						.setEmoji("⌚")
				),
			],
		});

		await interaction.editReply({
			content: "Painel enviado com sucesso!",
		});

		return;
	},
};
