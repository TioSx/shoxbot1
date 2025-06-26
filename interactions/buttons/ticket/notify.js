const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	PermissionFlagsBits,
} = require("discord.js");
const Ticket = require(`${process.cwd()}/database/models/ticketActions.js`);

module.exports = {
	id: "ticket-notify",

	async execute(interaction, args) {
		if (!interaction.member.permissions.has(PermissionFlagsBits.MoveMembers))
			return interaction.reply({
				content: "❌ | Você não tem permissão para usar este botão.",
				ephemeral: true
			});

		const ticket = await Ticket.findOne({ channel_id: interaction.channel.id });

		if (!ticket)
			return interaction.reply({
				content: "❌ | Este canal não é um ticket.",
				ephemeral: true,
			});

		const member = await interaction.guild.members.fetch(ticket.members[0]).catch(() => {});

		if (!member)
			return interaction.reply({
				content: "❌ | O usuário deste ticket não está no servidor.",
				ephemeral: true,
			});

		await interaction.deferReply({ ephemeral: true });

		const res = await member.send({
			content: `🎫 | ${interaction.user} te mandou uma notificação sobre o ticket ${interaction.channel}.`,
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setLabel("Ir para o ticket")
						.setURL(interaction.channel.url)
						.setEmoji("🎫")
				),
			],
		}).catch(() => null);

		if (!res)
			return interaction.editReply({
				content: `❌ | Não foi possível enviar a notificação para ${member}, provavelmente o usuário está com a DM bloqueada.`,
			});
		else
			return interaction.editReply({
				content: `✅ | Notificação enviada para ${member}.`,
			});
	},
};
