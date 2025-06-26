const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonStyle } = require("discord.js");
const { asyncQuery } = require("../../../database");

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "giveaway",

	/**@param {import("discord.js").ButtonInteraction} interaction  */
	async execute(interaction, args) {

		const serverToChannelMapping = {
			'656244004609851455': '1273853472030199890',
			'1099040187251699785': '1273854773958934638',
			'1102616719123558402': '1273855522659106888',
			'1108183376118153307': '1273856252044378144',
			'1108184382298128475': '1273857134118965249'
		};

		if (args.type === "back") {
			interaction.update({
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
		} else if (args.type === "entry") {
			const giveaway = await asyncQuery(
				"SELECT * FROM giveaway WHERE id = ?",
				"return",
				[args.giveaway_id]
			);

			if (!giveaway.length) {
				await interaction.reply({
					content: "❌ | Esse sorteio não existe mais",
					ephemeral: true,
				});
				return;
			}

			const entry = await asyncQuery(
				"SELECT * FROM giveawayEntries WHERE giveaway_id = ? AND user_id = ?",
				"return",
				[args.giveaway_id, interaction.user.id]
			);

			if (entry.length) {
				await interaction.reply({
					content: "❌ | Você já está participando desse sorteio",
					ephemeral: true,
				});
				return;
			}

			if (giveaway[0].endsAt < Math.floor(Date.now() / 1e3)) {
				await interaction.reply({
					content: "❌ | Esse sorteio já foi finalizado",
					ephemeral: true,
				});
				return;
			}

			if (giveaway[0].required_roles) {
				const roles = JSON.parse(giveaway[0].required_roles);

				if (
					!interaction.member.roles.cache.some((role) =>
						roles.includes(role.id)
					)
				) {
					await interaction.reply({
						content:
							"❌ | Você não possui um dos cargos necessários para participar desse sorteio",
						ephemeral: true,
					});
					return;
				}
			}

			await asyncQuery(
				"INSERT INTO giveawayEntries (giveaway_id, user_id, createdAt) VALUES (?, ?, ?)",
				"run",
				[args.giveaway_id, interaction.user.id, Math.floor(Date.now() / 1e3)]
			);

			const totalEntries = await asyncQuery(
				"SELECT COUNT(*) as total FROM giveawayEntries WHERE giveaway_id = ?",
				"return",
				[args.giveaway_id]
			);

			const serverID = interaction.guild.id;
			const notificationChannelID = serverToChannelMapping[serverID];
			const channel = interaction.guild.channels.cache.get(notificationChannelID);

			if (channel && channel.isTextBased()) {
				const member = await interaction.guild.members.fetch(interaction.user.id);

				const embed = new EmbedBuilder()
					.setTitle('🎉 Novo usuário entrou no sorteio!')
					.setThumbnail(interaction.user.avatarURL())
					.addFields(
						{ name: 'Sorteio:', value: `${giveaway[0].title}`, inline: true },
						{ name: 'Usuário:', value: `<@${interaction.user.id}>`, inline: true },
						{ name: '\u200B', value: '\u200B' },
						{ name: 'Nickname:', value: `${member.nickname || interaction.user.globalName}`, inline: true },
						{ name: 'ID:', value: `${interaction.user.id}`, inline: true },
					)
					.setColor('#9c59b6')
					.setTimestamp();

				const removeButton = new ButtonBuilder()
					.setCustomId(
						JSON.stringify({
							id: "giveaway",
							type: "removeEntry",
							user_id: interaction.user.id,
							giveaway_id: args.giveaway_id
						})
					)
					.setLabel("Remover usuário")
					.setStyle(ButtonStyle.Danger)
					.setEmoji("🗑️");

				const row = new ActionRowBuilder().addComponents(removeButton);

				await channel.send({ embeds: [embed], components: [row] });
			}

			await interaction.update({
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder(interaction.component.toJSON()).setLabel(
							`Participar (${totalEntries[0].total})`
						),
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
			});

			await interaction.followUp({
				content: "✅ | Pronto, você agora está participando desse sorteio.",
				ephemeral: true,
			});

		} else if (args.type === "removeEntry") {
			const { user_id, giveaway_id } = args;

			const removedEmbed = new EmbedBuilder()
				.setTitle('Usuário Removido!')
				.setDescription(`<@${user_id}> foi removido do sorteio por <@${interaction.user.id}>.`)
				.setColor('Red')
				.setTimestamp();

			const entry = await asyncQuery(
				"SELECT * FROM giveawayEntries WHERE giveaway_id = ? AND user_id = ?",
				"return",
				[giveaway_id, user_id]
			);

			if (!entry.length) {
				await interaction.reply({
					content: "❌ | Esse usuário não está participando do sorteio.",
					ephemeral: true,
				});
				return;
			}

			const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
			if (!member.permissions.has('ManageChannels')) {
				await interaction.reply({
					content: "❌ | Você não tem permissão para remover usuários de sorteios.",
					ephemeral: true,
				});
				return;
			}

			await asyncQuery(
				"DELETE FROM giveawayEntries WHERE giveaway_id = ? AND user_id = ?",
				"run",
				[giveaway_id, user_id]
			);

			await interaction.update({
				embeds: [removedEmbed],
				components: [],
			});

		} else if (args.type === "reroll") {
			const giveaway = await asyncQuery(
				"SELECT * FROM giveaway WHERE id = ?",
				"return",
				[args.giveaway_id]
			);

			if (!giveaway.length) {
				await interaction.update({
					components: [],
				});

				await interaction.followUp({
					content: "❌ | Esse sorteio não existe mais",
					ephemeral: true,
				});
				return;
			}

			if (giveaway[0].creator_id !== interaction.user.id) {
				await interaction.reply({
					content: "❌ | Você não pode rerolar esse sorteio",
					ephemeral: true,
				});
				return;
			}

			if (giveaway[0].winners === 1) {
				await interaction.deferReply();

				const entries = await asyncQuery(
					"SELECT * FROM giveawayEntries WHERE giveaway_id = ?",
					"return",
					[args.giveaway_id]
				);

				if (!entries.length) {
					await interaction.message.update({
						components: [],
					});

					await interaction.editReply({
						content: "❌ | Não há participantes nesse sorteio",
						ephemeral: true,
					});
					return;
				}

				const index = Math.floor(Math.random() * entries.length);

				const winner = entries[index];

				await interaction.editReply({
					content: `🔔 <@${winner.user_id}>`,
					embeds: [
						new EmbedBuilder()
							.setTitle(`🎲 Reroll - ${giveaway[0].title}`)
							.setFields(
								{
									name: "🎁 Prêmio",
									value: `> ${giveaway[0].prize}`,
								},
								{
									name: `👑 Vencedor`,
									value: `<@${winner.user_id}>`,
								}
							)
							.setColor("Orange")
							.setTimestamp()
							.setFooter({
								text: `Brasil Play Shox`,
								iconURL: interaction.guild.iconURL({ dynamic: true }),
							}),
					],
				});
			} else {
				await interaction.showModal(
					new ModalBuilder()
						.setTitle("🎲 Reroll")
						.setCustomId(
							JSON.stringify({
								id: "giveaway",
								type: "reroll",
								giveaway_id: args.giveaway_id,
							})
						)
						.setComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("quantity")
									.setLabel("Número de entradas")
									.setPlaceholder("Digite o número de vencedores para rerrolar")
									.setStyle(TextInputStyle.Short)
									.setMinLength(1)
									.setMaxLength(2)
									.setRequired(true)
							)
						)
				);
			}
		} else if (args.type === "cancel") {
			const giveaway = await asyncQuery(
				"SELECT * FROM giveaway WHERE id = ?",
				"return",
				[args.giveaway_id]
			);

			if (interaction.user.id !== giveaway[0].creator_id) {
				return interaction.reply({
					content: "❌ | Você não pode cancelar esse sorteio",
					ephemeral: true
				});
			}

			if (!giveaway.length) {
				await interaction.followUp({
					content: "❌ | Esse sorteio não existe mais",
					ephemeral: true,
				});
				return;
			}

			await asyncQuery("UPDATE giveaway SET ended = ? WHERE id = ?", "run", [
				1,
				args.giveaway_id,
			]);

			const cancelEmbed = new EmbedBuilder()
				.setTitle('Sorteio Cancelado')
				.setDescription('Este sorteio foi cancelado.')
				.setColor('Red')
				.setFooter({
					text: `Brasil Play Shox`,
					iconURL: interaction.guild.iconURL({ dynamic: true }),
				})
				.setTimestamp();

			await interaction.update({
				components: [], embeds: [cancelEmbed],
			});

			await interaction.followUp({
				content: "✅ | O sorteio foi cancelado com sucesso.",
				ephemeral: true,
			});
		}
	},
};
