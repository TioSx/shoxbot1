const {
	EmbedBuilder,
} = require("discord.js");
const config = require("../../../config.json");

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */
module.exports = {
	id: "ausencia-turno",

	/**@param {import("discord.js").ModalSubmitInteraction} interaction  */
	async execute(interaction, args) {
		await interaction.deferReply({ ephemeral: true });

		// Verificar se o usuário tem permissão
		const role = interaction.member.roles.cache.find((r) =>
			config.checkout.find((c) => c.role_id === r.id)
		);

		if (!role) {
			return await interaction.editReply({
				content: "❌ Você não tem permissão para solicitar ausência!",
			});
		}

		// Obter os dados do modal
		const horario = interaction.fields.getTextInputValue("horario");
		const motivo = interaction.fields.getTextInputValue("motivo");

		// Enviar log de ausência
		await sendAusenciaLog(
			interaction.user.id,
			interaction.client,
			role,
			horario,
			motivo,
			interaction.createdAt
		);

		await interaction.editReply({
			content: "✅ Solicitação de ausência enviada com sucesso!\n\nSua ausência foi registrada e a equipe foi notificada.",
		});

		return;
	},
};

/**
 * Função para enviar log de ausência
 */
async function sendAusenciaLog(userId, client, role, horario, motivo, timestamp) {
	// Canal fixo para logs de turno (ID fornecido pelo usuário)
	const logChannel = await client.channels
		.fetch("985588938397855814")
		.catch(() => null);

	if (!logChannel) return;

	const embed = new EmbedBuilder()
		.setTitle("📝 Solicitação de Ausência de Turno")
		.setDescription(
			`👤 **Usuário:** <@${userId}>\n🏷️ **Cargo:** ${role.name}\n⏰ **Horário do Turno:** ${horario}\n📝 **Motivo:** ${motivo}\n📅 **Data da Solicitação:** ${timestamp.toLocaleDateString("pt-BR")} às ${timestamp.toLocaleTimeString("pt-BR")}`
		)
		.setColor("Orange")
		.setTimestamp()
		.setFooter({ text: `ID: ${userId}` });

	await logChannel
		.send({
			embeds: [embed],
		})
		.catch(() => null);
}

