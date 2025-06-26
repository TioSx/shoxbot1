const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	PermissionFlagsBits,
	UserSelectMenuBuilder,
	EmbedBuilder,
	Client,
} = require("discord.js");
const { asyncQuery } = require("../../../database");
const humanizeDuration = require("humanize-duration");
const config = require("../../../config.json");

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "checkout",

	/**@param {import("discord.js").ButtonInteraction} interaction  */
	async execute(interaction, args) {
		if (!args.type) {
			await interaction.deferReply({ ephemeral: true });
			const data = await asyncQuery(
				"SELECT * FROM `checkout` WHERE `user_id` = ? ORDER BY `createdAt` DESC LIMIT 5",
				"return",
				[interaction.user.id]
			);

			const embed = new EmbedBuilder()
				.setTitle(`📅 Bate-ponto - ${interaction.user.username} ⏳`)
				.setDescription(
					`Seu últimos horários: ${data.length ? "" : "⛔ Nenhum"}`
				)
				.addFields(
					data?.map((d) => ({
						name: `${new Date(d.createdAt * 1e3).toLocaleDateString("pt-BR")}`,
						value: `📥 **Entrada:** <t:${d.started}>\n${
							d.finished
								? `📤 **Saída:** <t:${
										d.finished
								  }>\n⏳ **Duração:** \`${humanizeDuration(
										(d.finished - d.started) * 1e3,
										{ language: "pt" }
								  )}\``
								: ` ❗** Não finalizado**`
						}`,
						inline: true,
					})) || []
				)
				.setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 512 }))
				.setColor("Purple");

			const isInCheckout = Boolean(!(data?.[0] ? data[0].finished : true));

			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(
						JSON.stringify({
							id: "checkout",
							type: isInCheckout ? "end" : "start",
						})
					)
					.setLabel(isInCheckout ? "Finalizar Turno" : "Iniciar Turno")
					.setStyle(isInCheckout ? ButtonStyle.Secondary : ButtonStyle.Success)
					.setEmoji(isInCheckout ? "📤" : "📥")
			);

			if (isInCheckout) {
				row.addComponents(
					new ButtonBuilder()
						.setCustomId(JSON.stringify({ id: "checkout", type: "cancel" }))
						.setLabel("Cancelar Turno")
						.setStyle(ButtonStyle.Danger)
						.setEmoji("❌")
				);
			}

			return await interaction.editReply({
				embeds: [embed],
				components: [row],
			});
		} else if (args.type === "start") {
			const data = await asyncQuery(
				"SELECT * FROM `checkout` WHERE `user_id` = ? AND `finished` IS NULL ORDER BY `createdAt` DESC LIMIT 1",
				"return",
				[interaction.user.id]
			);

			if (data?.[0]) {
				return await interaction.reply({
					content: "❌ Você já está em um turno!",
					ephemeral: true,
				});
			}

			const role = interaction.member.roles.cache.find((r) =>
				config.checkout.find((c) => c.role_id === r.id)
			);

			if (!role) {
				return await interaction.reply({
					content: "❌ Você não tem permissão para iniciar um turno!",
					ephemeral: true,
				});
			}

			const started = Math.floor(interaction.createdAt.valueOf() / 1e3);

			await asyncQuery(
				"INSERT INTO `checkout` (`user_id`, `started`, `createdAt`) VALUES (?, ?, ?)",
				"run",
				[interaction.user.id, started, started]
			);

			await sendLogs(
				interaction.user.id,
				interaction.client,
				role,
				"started",
				started
			);

			await interaction.update({
				embeds: [
					new EmbedBuilder(interaction.message.embeds[0].toJSON())
						.setDescription("Seus últimos horários:")
						.setFields(
							[
								{
									name: `${interaction.createdAt.toLocaleDateString("pt-BR")}`,
									value: `📥 **Entrada:** <t:${started}>\n❗ **Não finalizado**`,
									inline: true,
								},
							].concat(interaction.message.embeds[0].fields.slice(0, 5))
						),
				],
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId(
								JSON.stringify({
									id: "checkout",
									type: "end",
								})
							)
							.setLabel("Finalizar Turno")
							.setStyle(ButtonStyle.Secondary)
							.setEmoji("📤"),
						new ButtonBuilder()
							.setCustomId(
								JSON.stringify({
									id: "checkout",
									type: "cancel",
								})
							)
							.setLabel("Cancelar Turno")
							.setStyle(ButtonStyle.Danger)
							.setEmoji("❌")
					),
				],
			});

			await interaction.followUp({
				content:
					"✅ Turno iniciado com sucesso!\n\n❗ **Lembre-se de finalizar o turno quando terminar**",
				components: [],
				ephemeral: true,
			});
		} else if (args.type === "end") {
			const data = await asyncQuery(
				"SELECT * FROM `checkout` WHERE `user_id` = ? AND `finished` IS NULL ORDER BY `createdAt` DESC LIMIT 1",
				"return",
				[interaction.user.id]
			);

			if (!data?.[0]) {
				return await interaction.reply({
					content: "❌ Você não está em um turno!",
					ephemeral: true,
				});
			}

			const role = interaction.member.roles.cache.find((r) =>
				config.checkout.find((c) => c.role_id === r.id)
			);

			if (!role) {
				return await interaction.reply({
					content: "❌ Você não tem permissão para iniciar um turno!",
					ephemeral: true,
				});
			}

			const finished = Math.floor(interaction.createdAt.valueOf() / 1e3);

			await asyncQuery(
				"UPDATE `checkout` SET `finished` = ? WHERE `user_id` = ? AND `started` = ?",
				"run",
				[finished, interaction.user.id, data[0].started]
			);

			await sendLogs(
				interaction.user.id,
				interaction.client,
				role,
				"finished",
				data[0].started,
				finished,
				data[0].message_id
			);

			await interaction.update({
				embeds: [
					new EmbedBuilder(interaction.message.embeds[0].toJSON())
						.setDescription("Seus últimos horários:")
						.setFields(
							[
								{
									name: `${interaction.createdAt.toLocaleDateString("pt-BR")}`,
									value: `📥 **Entrada:** <t:${
										data[0].started
									}>\n📤 **Saída:** <t:${finished}>\n⏳ **Duração:** \`${humanizeDuration(
										(finished - data[0].started) * 1e3,
										{ language: "pt" }
									)}\``,
									inline: true,
								},
							].concat(interaction.message.embeds[0].fields.slice(0, 5))
						),
				],
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId(
								JSON.stringify({
									id: "checkout",
									type: "start",
								})
							)
							.setLabel("Iniciar Turno")
							.setStyle(ButtonStyle.Success)
							.setEmoji("📥")
					),
				],
			});

			await interaction.followUp({
				content: `✅ Turno finalizado com sucesso!\n⏳ **Duração:** \`${humanizeDuration(
					(finished - data[0].started) * 1e3,
					{ language: "pt" }
				)}\``,
				components: [],
				ephemeral: true,
			});
		} else if (args.type === "cancel") {
			const data = await asyncQuery(
				"SELECT * FROM `checkout` WHERE `user_id` = ? AND `finished` IS NULL ORDER BY `createdAt` DESC LIMIT 1",
				"return",
				[interaction.user.id]
			);

			if (!data?.[0]) {
				return await interaction.reply({
					content: "❌ Você não está em um turno!",
					ephemeral: true,
				});
			}

			const role = interaction.member.roles.cache.find((r) =>
				config.checkout.find((c) => c.role_id === r.id)
			);

			await interaction.update({
				embeds: [],
				content:
					"❓ Você realmente deseja cancelar seu turno? Não há como desfazer",
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId("yes")
							.setLabel("Sim")
							.setStyle(ButtonStyle.Success)
							.setEmoji("✅"),
						new ButtonBuilder()
							.setCustomId("no")
							.setLabel("Não")
							.setStyle(ButtonStyle.Secondary)
							.setEmoji("❌")
					),
				],
			});

			const buttonInteraction = await interaction.channel
				.awaitMessageComponent({
					filter: (i) => i.user.id === interaction.user.id,
					time: 3e4,
				})
				.catch(() => null);

			if (!buttonInteraction || buttonInteraction.customId === "no") {
				return await interaction.editReply({
					content: "❌ Ação cancelada!",
					components: [],
				});
			}

			const finished = Math.floor(interaction.createdAt.valueOf() / 1e3);

			await asyncQuery(
				"DELETE FROM `checkout` WHERE `user_id` = ? AND `started` = ?",
				"run",
				[interaction.user.id, data[0].started]
			);

			await sendLogs(
				interaction.user.id,
				interaction.client,
				role,
				"canceled",
				data[0].started,
				finished,
				data[0].message_id
			);

			await interaction.editReply({
				content: "✅ Turno cancelado com sucesso!",
				components: [],
			});
		}

		return;
	},
};

/**
 * @param {Client} client
 */
async function sendLogs(
	user,
	client,
	role,
	type,
	started,
	finished,
	messageId
) {
	const finishChannel = await client.channels
		.fetch(
			config.checkout.find((c) => c.role_id === role.id).finishedChannel ??
				config.checkout[0].finishedChannel
		)
		.catch(() => null);
	const startChannel = await client.channels
		.fetch(
			config.checkout.find((c) => c.role_id === role.id).startedChannel ??
				config.checkout[0].startedChannel
		)
		.catch(() => null);

	if (type === "started") {
		if (!startChannel) return;

		const embed = new EmbedBuilder()
			.setTitle("Bate-ponto - Entrada")
			.setDescription(
				`👤 **Usuário:** <@${user}>\n⌚ **Horário de Início:** <t:${started}> <t:${started}:R>`
			)
			.setColor("Green")
			.setTimestamp()
			.setFooter({ text: `ID: ${user}` });

		const message = await startChannel
			.send({
				embeds: [embed],
			})
			.catch(() => null);

		if (message) {
			await asyncQuery(
				"UPDATE `checkout` SET `message_id` = ? WHERE `user_id` = ? AND `started` = ?",
				"run",
				[message.id, user, started]
			);
		}
	} else if (type === "finished") {
		if (!finishChannel) return;

		const embed = new EmbedBuilder()
			.setTitle("Bate-ponto - Saída")
			.setDescription(
				`👤 **Usuário:** <@${user}>\n⌚ **Horário de Início:** <t:${started}> <t:${started}:R>\n🚶 **Horário de Saída:** <t:${finished}> <t:${finished}:R>\n⏳ **Tempo do Turno:** \`${humanizeDuration(
					(finished - started) * 1e3,
					{ language: "pt" }
				)}\``
			)
			.setColor("Blue")
			.setTimestamp()
			.setFooter({ text: `ID: ${user}` });

		const startedMessage = messageId
			? await startChannel?.messages.fetch(messageId)
			: null;

		const message = await finishChannel
			.send({
				embeds: [embed],
				components: startedMessage
					? [
							new ActionRowBuilder().addComponents(
								new ButtonBuilder()
									.setURL(startedMessage.url)
									.setLabel("Mensagem Entrada")
									.setStyle(ButtonStyle.Link)
									.setEmoji("📥")
							),
					  ]
					: [],
			})
			.catch(() => null);

		if (message && startedMessage) {
			await startedMessage.edit({
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setURL(message.url)
							.setLabel("Finalizado")
							.setStyle(ButtonStyle.Link)
							.setEmoji("📤")
					),
				],
			});
		}
	} else if (type === "canceled") {
		let canceledMessage;
		let startedMessage;

		if (finishChannel) {
			const embed = new EmbedBuilder()
				.setTitle("Bate-ponto - Cancelamento")
				.setDescription(
					`👤 **Usuário:** <@${user}>\n⌚ **Horário de Início:** <t:${started}> <t:${started}:R>\n❌ **Horário do Cancelamento:** <t:${finished}> <t:${finished}:R>`
				)
				.setColor("Red")
				.setTimestamp()
				.setFooter({ text: `ID: ${user}` });

			startedMessage = messageId
				? await startChannel?.messages.fetch(messageId)
				: null;

			canceledMessage = await finishChannel
				.send({
					embeds: [embed],
					components: startedMessage
						? [
								new ActionRowBuilder().addComponents(
									new ButtonBuilder()
										.setURL(startedMessage.url)
										.setLabel("Mensagem Entrada")
										.setStyle(ButtonStyle.Link)
										.setEmoji("📥")
								),
						  ]
						: [],
				})
				.catch(() => null);
		}

		if (startedMessage) {
			await startedMessage.edit({
				embeds: [
					new EmbedBuilder(startedMessage.embeds[0].toJSON())
						.setDescription(
							`👤 **Usuário:** <@${user}>\n⌚ **Horário de Início:** <t:${started}> <t:${started}:R>\n\n❌ **Cancelado**`
						)
						.setColor("Red"),
				],
				components: canceledMessage
					? [
							new ActionRowBuilder().addComponents(
								new ButtonBuilder()
									.setURL(canceledMessage.url)
									.setLabel("Cancelamento")
									.setStyle(ButtonStyle.Link)
									.setEmoji("❌")
							),
					  ]
					: [],
			});
		}
	}
}
