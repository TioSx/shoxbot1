const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle
} = require("discord.js");
const { asyncQuery } = require("../../../database");
const humanizeDuration = require("humanize-duration");
const config = require("../../../config.json");

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "painel-turno",
	/** @param {import("discord.js").ButtonInteraction} interaction */
	async execute(interaction, args) {
		// PAINEL PRINCIPAL
		if (!args.type) {
			await interaction.deferReply({ ephemeral: true });

			const role = interaction.member.roles.cache.find((r) =>
				config.checkout.find((c) => c.role_id === r.id)
			);

			if (!role) {
				return await interaction.editReply({
					content: "❌ Você não tem permissão para usar este painel!",
				});
			}

			const data = await asyncQuery(
				"SELECT * FROM `checkout` WHERE `user_id` = ? ORDER BY `createdAt` DESC LIMIT 3",
				"return",
				[interaction.user.id]
			);

			const embed = new EmbedBuilder()
				.setTitle(`📋 Painel de Turno - ${interaction.user.username} 🕐`)
				.setDescription(`Bem-vindo ao painel de gerenciamento de turno!\n\nSeus últimos turnos: ${data.length ? "" : "⛔ Nenhum"}`)
				.addFields(
					data.map((d) => ({
						name: `${new Date(d.createdAt * 1e3).toLocaleDateString("pt-BR")}`,
						value: `📥 **Entrada:** <t:${d.started}>\n` +
							(d.finished
								? `📤 **Saída:** <t:${d.finished}>\n⏳ **Duração:** \`${humanizeDuration((d.finished - d.started) * 1e3, { language: "pt" })}\``
								: (d.paused_at && !d.resumed_at)
									? `⏸️ **Pausado:** <t:${d.paused_at}>\n❗ **Turno pausado**`
									: `❗ **Não finalizado**`
							),
						inline: true,
					}))
				)
				.setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 512 }))
				.setColor("Purple")
				.setFooter({ text: "Selecione uma opção abaixo" });

			// Status do turno atual
			const current = data[0] || {};
			const isInCheckout = current && !current.finished;
			const isPaused = isInCheckout && current.paused_at && !current.resumed_at;

			const row = new ActionRowBuilder();

			if (!isInCheckout) {
				row.addComponents(
					new ButtonBuilder()
						.setCustomId(JSON.stringify({ id: "painel-turno", type: "iniciar-turno" }))
						.setLabel("Iniciar turno")
						.setStyle(ButtonStyle.Success)
						.setEmoji("🟢"),
					new ButtonBuilder()
						.setCustomId(JSON.stringify({ id: "painel-turno", type: "solicitar-ausencia" }))
						.setLabel("Solicitar ausência")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("📝")
				);
			} else if (isInCheckout && !isPaused) {
				row.addComponents(
					new ButtonBuilder()
						.setCustomId(JSON.stringify({ id: "painel-turno", type: "encerrar-turno" }))
						.setLabel("Encerrar turno")
						.setStyle(ButtonStyle.Primary)
						.setEmoji("🔴"),
					new ButtonBuilder()
						.setCustomId(JSON.stringify({ id: "painel-turno", type: "cancelar-turno" }))
						.setLabel("Cancelar turno")
						.setStyle(ButtonStyle.Danger)
						.setEmoji("❌"),
					new ButtonBuilder()
						.setCustomId(JSON.stringify({ id: "painel-turno", type: "pausar-turno" }))
						.setLabel("Pausar turno")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("⏸️")
				);
			} else if (isPaused) {
				row.addComponents(
					new ButtonBuilder()
						.setCustomId(JSON.stringify({ id: "painel-turno", type: "retomar-turno" }))
						.setLabel("Retomar turno")
						.setStyle(ButtonStyle.Success)
						.setEmoji("▶️"),
					new ButtonBuilder()
						.setCustomId(JSON.stringify({ id: "painel-turno", type: "encerrar-turno" }))
						.setLabel("Encerrar turno")
						.setStyle(ButtonStyle.Primary)
						.setEmoji("🔴"),
					new ButtonBuilder()
						.setCustomId(JSON.stringify({ id: "painel-turno", type: "cancelar-turno" }))
						.setLabel("Cancelar turno")
						.setStyle(ButtonStyle.Danger)
						.setEmoji("❌")
				);
			}

			return await interaction.editReply({
				embeds: [embed],
				components: [row],
			});
		}

		// TIPOS DE INTERAÇÃO
		const type = args.type;

		if (type === "iniciar-turno") {
			const data = await asyncQuery(
				"SELECT * FROM `checkout` WHERE `user_id` = ? AND `finished` IS NULL ORDER BY `createdAt` DESC LIMIT 1",
				"return",
				[interaction.user.id]
			);
			if (data[0]) {
				return await interaction.reply({
					content: "❌ Você já está em um turno ativo!",
					ephemeral: true,
				});
			}
			const started = Math.floor(Date.now() / 1e3);
			await asyncQuery(
				"INSERT INTO `checkout` (`user_id`, `started`, `createdAt`) VALUES (?, ?, ?)",
				"run",
				[interaction.user.id, started, started]
			);
			await sendTurnoLogs(interaction.user.id, interaction.client, getStaffRole(interaction), "started", started);

			return interaction.update({ content: "✅ Turno iniciado com sucesso!", embeds: [], components: [] });
		}

		if (type === "encerrar-turno") {
			const data = await asyncQuery(
				"SELECT * FROM `checkout` WHERE `user_id` = ? AND `finished` IS NULL ORDER BY `createdAt` DESC LIMIT 1",
				"return",
				[interaction.user.id]
			);
			if (!data[0]) {
				return await interaction.reply({
					content: "❌ Você não está em um turno ativo!",
					ephemeral: true,
				});
			}
			const finished = Math.floor(Date.now() / 1e3);
			await asyncQuery(
				"UPDATE `checkout` SET `finished` = ? WHERE `user_id` = ? AND `started` = ?",
				"run",
				[finished, interaction.user.id, data[0].started]
			);
			await sendTurnoLogs(interaction.user.id, interaction.client, getStaffRole(interaction), "finished", data[0].started, finished);
			return interaction.update({ content: "✅ Turno encerrado com sucesso!", embeds: [], components: [] });
		}

		if (type === "cancelar-turno") {
			const data = await asyncQuery(
				"SELECT * FROM `checkout` WHERE `user_id` = ? AND `finished` IS NULL ORDER BY `createdAt` DESC LIMIT 1",
				"return",
				[interaction.user.id]
			);
			if (!data[0]) {
				return await interaction.reply({
					content: "❌ Você não está em um turno ativo!",
					ephemeral: true,
				});
			}
			await asyncQuery(
				"DELETE FROM `checkout` WHERE `user_id` = ? AND `started` = ?",
				"run",
				[interaction.user.id, data[0].started]
			);
			await sendTurnoLogs(interaction.user.id, interaction.client, getStaffRole(interaction), "canceled", data[0].started, Math.floor(Date.now() / 1e3));
			return interaction.update({ content: "✅ Turno cancelado com sucesso!", embeds: [], components: [] });
		}

		if (type === "pausar-turno") {
			const data = await asyncQuery(
				"SELECT * FROM `checkout` WHERE `user_id` = ? AND `finished` IS NULL AND (`paused_at` IS NULL OR `resumed_at` IS NOT NULL) ORDER BY `createdAt` DESC LIMIT 1",
				"return",
				[interaction.user.id]
			);
			if (!data[0]) {
				return await interaction.reply({
					content: "❌ Você não está em um turno ativo ou já está pausado!",
					ephemeral: true,
				});
			}
			const pausedAt = Math.floor(Date.now() / 1e3);
			await asyncQuery(
				"UPDATE `checkout` SET `paused_at` = ?, `resumed_at` = NULL WHERE `user_id` = ? AND `started` = ?",
				"run",
				[pausedAt, interaction.user.id, data[0].started]
			);
			await sendTurnoLogs(interaction.user.id, interaction.client, getStaffRole(interaction), "paused", data[0].started, pausedAt);
			return interaction.update({ content: "⏸️ Turno pausado com sucesso!", embeds: [], components: [] });
		}

		if (type === "retomar-turno") {
			const data = await asyncQuery(
				"SELECT * FROM `checkout` WHERE `user_id` = ? AND `finished` IS NULL AND `paused_at` IS NOT NULL AND `resumed_at` IS NULL ORDER BY `createdAt` DESC LIMIT 1",
				"return",
				[interaction.user.id]
			);
			if (!data[0]) {
				return await interaction.reply({
					content: "❌ Você não está com um turno pausado!",
					ephemeral: true,
				});
			}
			const resumedAt = Math.floor(Date.now() / 1e3);
			await asyncQuery(
				"UPDATE `checkout` SET `resumed_at` = ? WHERE `user_id` = ? AND `started` = ?",
				"run",
				[resumedAt, interaction.user.id, data[0].started]
			);
			await sendTurnoLogs(interaction.user.id, interaction.client, getStaffRole(interaction), "resumed", data[0].started, resumedAt, data[0].paused_at);
			return interaction.update({ content: "▶️ Turno retomado com sucesso!", embeds: [], components: [] });
		}

		if (type === "solicitar-ausencia") {
			const modal = new ModalBuilder()
				.setCustomId(JSON.stringify({ id: "ausencia-turno" }))
				.setTitle("Solicitar Ausência de Turno");

			const horarioInput = new TextInputBuilder()
				.setCustomId("horario")
				.setLabel("Horário do seu turno")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("Ex: 14:00 às 18:00")
				.setRequired(true);

			const motivoInput = new TextInputBuilder()
				.setCustomId("motivo")
				.setLabel("Motivo da ausência")
				.setStyle(TextInputStyle.Paragraph)
				.setPlaceholder("Descreva o motivo da sua ausência...")
				.setRequired(true);

			modal.addComponents(
				new ActionRowBuilder().addComponents(horarioInput),
				new ActionRowBuilder().addComponents(motivoInput)
			);

			return await interaction.showModal(modal);
		}
	}
};

// Função utilitária para pegar role
function getStaffRole(interaction) {
	return interaction.member.roles.cache.find((r) =>
		config.checkout.find((c) => c.role_id === r.id)
	);
}

/**
 * Envia logs de turno
 */
async function sendTurnoLogs(user, client, role, type, started, finished, paused_at) {
	const logChannel = await client.channels.fetch("985588938397855814").catch(() => null);
	if (!logChannel) return;
	if (!role) return;

	let embed;
	const userObj = await client.users.fetch(user);

	if (type === "started") {
		embed = new EmbedBuilder()
			.setTitle("🟢 Turno Iniciado")
			.setThumbnail(userObj.displayAvatarURL())
			.setDescription(
				`👤 <@${user}> | 🏷️ **${role.name}**\n` +
				`🟢 **Início:** <t:${started}> (<t:${started}:R>)\n` +
				`📅 ${new Date(started * 1000).toLocaleDateString("pt-BR")}`
			)
			.setColor("Green")
			.setTimestamp()
			.setFooter({ text: `ID: ${user}` });

	} else if (type === "paused") {
		embed = new EmbedBuilder()
			.setTitle("⏸️ Turno Pausado")
			.setThumbnail(userObj.displayAvatarURL())
			.setDescription(
				`👤 <@${user}> | 🏷️ **${role.name}**\n` +
				`⏸️ **Pausado:** <t:${finished}> (<t:${finished}:R>)\n` +
				`📅 ${new Date(finished * 1000).toLocaleDateString("pt-BR")}`
			)
			.setColor("Orange")
			.setTimestamp()
			.setFooter({ text: `ID: ${user}` });

	} else if (type === "resumed") {
		const pauseDuration = finished - paused_at;
		embed = new EmbedBuilder()
			.setTitle("▶️ Turno Retomado")
			.setThumbnail(userObj.displayAvatarURL())
			.setDescription(
				`👤 <@${user}> | 🏷️ **${role.name}**\n` +
				`⏸️ **Pausado:** <t:${paused_at}> (<t:${paused_at}:R>)\n` +
				`▶️ **Retomado:** <t:${finished}> (<t:${finished}:R>)\n` +
				`⏱️ **Pausa:** ${humanizeDuration(pauseDuration * 1000, { language: "pt" })}\n` +
				`📅 ${new Date(finished * 1000).toLocaleDateString("pt-BR")}`
			)
			.setColor("Green")
			.setTimestamp()
			.setFooter({ text: `ID: ${user}` });

	} else if (type === "finished") {
		// Consulta o registro para verificar se teve pausa
		const checkout = await asyncQuery(
			"SELECT * FROM `checkout` WHERE `user_id` = ? AND `started` = ?",
			"return",
			[user, started]
		);
		let pausaInfo = '';
		let duracaoEfetiva = finished - started;

		if (checkout[0] && checkout[0].paused_at && checkout[0].resumed_at) {
			const duracaoPausa = checkout[0].resumed_at - checkout[0].paused_at;
			pausaInfo = `\n⏸️ **Pausa:** 1 vez (${humanizeDuration(duracaoPausa * 1000, { language: "pt" })})`;
			duracaoEfetiva = duracaoEfetiva - duracaoPausa;
		}

		embed = new EmbedBuilder()
			.setTitle("🔴 Turno Encerrado")
			.setThumbnail(userObj.displayAvatarURL())
			.setDescription(
				`👤 <@${user}> | 🏷️ **${role.name}**\n` +
				`🟢 **Início:** <t:${started}> (<t:${started}:R>)\n` +
				`🔴 **Encerramento:** <t:${finished}> (<t:${finished}:R>)\n` +
				`⏱️ **Duração total:** ${humanizeDuration((finished - started) * 1000, { language: "pt" })}` +
				pausaInfo +
				(pausaInfo ? `\n⏱️ **Duração efetiva:** ${humanizeDuration(duracaoEfetiva * 1000, { language: "pt" })}` : '') +
				`\n📅 ${new Date(finished * 1000).toLocaleDateString("pt-BR")}`
			)
			.setColor("Blue")
			.setTimestamp()
			.setFooter({ text: `ID: ${user}` });

	} else if (type === "canceled") {
		embed = new EmbedBuilder()
			.setTitle("❌ Turno Cancelado")
			.setThumbnail(userObj.displayAvatarURL())
			.setDescription(
				`👤 <@${user}> | 🏷️ **${role.name}**\n` +
				`🟢 **Início:** <t:${started}> (<t:${started}:R>)\n` +
				`❌ **Cancelado:** <t:${finished}> (<t:${finished}:R>)\n` +
				`📅 ${new Date(finished * 1000).toLocaleDateString("pt-BR")}`
			)
			.setColor("Red")
			.setTimestamp()
			.setFooter({ text: `ID: ${user}` });
	}
	if (embed) await logChannel.send({ embeds: [embed] }).catch(() => null);
}
