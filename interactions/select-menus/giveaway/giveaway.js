const { PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, RoleSelectMenuBuilder, ButtonStyle, StringSelectMenuBuilder, ButtonBuilder, ChannelSelectMenuBuilder, ChannelType, } = require("discord.js");
const { asyncQuery } = require("../../../database");

/**
 * @type {import('../../../typings').SelectInteractionCommand}
 */
module.exports = {
	id: "giveaway",

	/**
	 *
	 * @param {import("discord.js").AnySelectMenuInteraction} interaction
	 */
	async execute(interaction, args) {
		if (!args.type) {
			const selected = interaction.values[0];

			if (selected === "addRoles") {
				await interaction.update({
					components: [
						new ActionRowBuilder().addComponents(
							new RoleSelectMenuBuilder()
								.setCustomId(
									JSON.stringify({
										id: "giveaway",
										type: "roles",
										giveaway_id: args.giveaway_id,
									})
								)
								.setPlaceholder("Selecione os cargos")
								.setMaxValues(10)
								.setMinValues(0)
						),
						new ActionRowBuilder().addComponents(
							new ButtonBuilder()
								.setCustomId(JSON.stringify({ id: "giveaway", type: "back" }))
								.setLabel("Voltar")
								.setStyle(ButtonStyle.Secondary)
						),
					],
				});
			} else if (selected === "sendMessage") {
				await interaction.update({
					components: [
						new ActionRowBuilder().addComponents(
							new ChannelSelectMenuBuilder()
								.setCustomId(
									JSON.stringify({
										id: "giveaway",
										type: "channel",
										giveaway_id: args.giveaway_id,
									})
								)
								.setPlaceholder("Selecione o canal para enviar o sorteio")
								.setChannelTypes(
									ChannelType.GuildText,
									ChannelType.GuildAnnouncement
								)
								.setMaxValues(1)
						),
						new ActionRowBuilder().addComponents(
							new ButtonBuilder()
								.setCustomId(JSON.stringify({ id: "giveaway", type: "back" }))
								.setLabel("Voltar")
								.setStyle(ButtonStyle.Secondary)
						),
					],
				});
			}
		} else if (args.type === "roles" && interaction.isRoleSelectMenu()) {
			const roles = [[], []];

			for (const [_, role] of interaction.roles) {
				if (role.managed) {
					roles[1].push(role.id);
				} else {
					roles[0].push(role.id);
				}
			}

			await asyncQuery(
				"UPDATE `giveaway` SET `required_roles` = ? WHERE `id` = ?",
				"run",
				[JSON.stringify(roles[0]), args.giveaway_id]
			);

			await interaction.update({
				embeds: [
					new EmbedBuilder(interaction.message.embeds[0].toJSON()).setFields(
						interaction.message.embeds[0].fields
							.filter((field) => !field.name.match(/cargos/gi))
							.concat(
								roles[0].length
									? [
											{
												name: "✅ Cargos Permitidos",
												value: roles[0].map((role) => `<@&${role}>`).join(" "),
												inline: true,
											},
									  ]
									: []
							)
					),
				],
				components: [
					new ActionRowBuilder().addComponents(
						new StringSelectMenuBuilder()
							.setCustomId(
								JSON.stringify({
									id: "giveaway",
									giveaway_id: args.giveaway_id,
								})
							)
							.setPlaceholder("Selecione uma opção")
							.addOptions([
								{
									label: "Adicionar cargos para participar",
									value: "addRoles",
								},
								{
									label: "Enviar mensagem do sorteio",
									value: "sendMessage",
								},
							])
					),
				],
			});

			await interaction.followUp({
				content: roles[1].length
					? `❌ | Os cargos ${roles[1]
							.map((role) => `<@&${role}>`)
							.join(
								", "
							)} não foram adicionados pois são gerenciados pelo sistema.`
					: "✅ | Cargos adicionados com sucesso.",
				ephemeral: true,
			});
		} else if (args.type === "channel" && interaction.isChannelSelectMenu()) {
			await interaction.deferUpdate();

			const message = await interaction.channels
				.first()
				.send({
					embeds: [interaction.message.embeds[0]],
					components: [
						new ActionRowBuilder().addComponents(
							new ButtonBuilder()
								.setCustomId(
									JSON.stringify({
										id: "giveaway",
										type: "entry",
										giveaway_id: args.giveaway_id,
									})
								)
								.setLabel("Participar (0)")
								.setStyle(ButtonStyle.Success)
								.setEmoji("🎉"),
							new ButtonBuilder()
								.setCustomId(
									JSON.stringify({
										id: "giveaway",
										type: "cancel",
										giveaway_id: args.giveaway_id,
									})
								)
								.setLabel("Cancelar")
								.setStyle(ButtonStyle.Danger)
								.setEmoji("🗑️")
						),
					],
				})
				.catch(() => null);

			if (!message) {
				return interaction.followUp({
					content: "❌ | Não foi possível enviar a mensagem do sorteio.",
					ephemeral: true,
				});
			}

			await asyncQuery(
				"UPDATE `giveaway` SET `channel_id` = ?, `message_id` = ?, `started` = 1 WHERE `id` = ?",
				"run",
				[message.channel.id, message.id, args.giveaway_id]
			);

			await interaction.editReply({
				embeds: [],
				components: [],
				content: "✅ | Sorteio iniciado com sucesso.",
			});
		}
	},
};
