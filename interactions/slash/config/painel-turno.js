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
		.setName("painel-turno")
		.setDescription("📋 | Envia o painel de gerenciamento de turno para staff")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		interaction.channel.send({
			embeds: [
				new EmbedBuilder()
					.setTitle("📋 Painel de Turno 🕐")
					.setDescription(
						"⬇ Clique no botão abaixo para abrir o painel de gerenciamento de turno\n\nAqui você poderá:\n• Iniciar e encerrar turnos\n• Solicitar ausências\n• Visualizar histórico\n\n❗ *Deve ser utilizado somente para horário fixo*"
					)
					.setColor("Purple")
					.setThumbnail(
						interaction.guild.iconURL({ dynamic: true, size: 512 })
					),
			],
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(JSON.stringify({ id: "painel-turno" }))
						.setLabel("Abrir painel")
						.setStyle(ButtonStyle.Primary)
						.setEmoji("📋")
				),
			],
		});

		await interaction.editReply({
			content: "Painel de turno enviado com sucesso!",
		});

		return;
	},
};

