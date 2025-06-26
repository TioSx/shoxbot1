const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	PermissionFlagsBits,
	UserSelectMenuBuilder,
	EmbedBuilder,
} = require("discord.js");

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "announce-message",

	/**@param {import("discord.js").StringSelectMenuInteraction} interaction  */
	async execute(interaction, args) {
		if (interaction.user.id !== args.user)
			return interaction.reply({
				content: "❌ | Você não tem permissão para usar este menu!",
				ephemeral: true,
			});

		const selected = interaction.values[0];

		if (selected === "back") {
			const components = interaction.message.components;

			components[components.length > 1 ? 1 : 0] =
				new ActionRowBuilder().setComponents(
					new StringSelectMenuBuilder()
						.setCustomId(
							JSON.stringify({ id: "announce", user: interaction.user.id })
						)
						.setPlaceholder("Selecione uma opção")
						.addOptions(
							{
								label: "Conteúdo da mensagem",
								value: "message",
								description: "Muda a mensagem, pode ser usada para marcações",
								emoji: "📝",
							},
							{
								label: "Embeds",
								value: "embeds",
								description: "Menu para gerenciar as embeds",
								emoji: "📰",
							},
							{
								label: "Links",
								value: "links",
								description: "Menu para gerenciar os botões de links",
								emoji: "🔗",
							},
							{
								label: "Enviar",
								value: "send",
								description: "Envia a mensagem",
								emoji: "✅",
							}
						)
				);

			await interaction.update({
				components,
			});
		} else if (selected === "edit") {
			await interaction.reply({
				content:
					"Envie a nova mensagem.\nPara marcar @everyone use `{everyone}`\nPara marcar @here use `{here}`\nPara marcar um usuário use `$ID`\nPara marcar um cargo use `&ID`.\n\n**Você tem 2 minutos**",
				ephemeral: true,
			});

			const messages = await interaction.channel
				.awaitMessages({
					filter: (m) => m.author.id === interaction.user.id,
					max: 1,
					time: 120000,
				})
				.catch(() => {});

			if (!messages || !messages.size)
				return interaction.editReply({
					content: "❌ | Você não enviou a mensagem a tempo!",
				});

			await messages
				.first()
				.delete()
				.catch(() => {});

			const text = messages
				.first()
				.content.replace("{everyone}", `@everyone`)
				.replace("{here}", `@here`)
				.replace(/\$(\d{17,19})/g, "<@$1>")
				.replace(/&(\d{17,19})/g, "<@&$1>");

			if (!text)
				return interaction.editReply({
					content: "❌ | Você não pode enviar uma mensagem vazia!",
				});

			await interaction.message.edit({
				content: text,
				allowedMentions: {
					roles: [],
					users: [],
				},
			});

			await interaction.editReply({
				content: "✅ | Mensagem editada com sucesso!",
			});
		} else if (selected === "delete") {
			if (!interaction.message.content)
				return interaction.reply({
					content: "❌ | Não há mensagem para retirar!",
					ephemeral: true,
				});

			await interaction.reply({
				content: "Você tem certeza que deseja retirar a mensagem?",
				ephemeral: true,
				components: [
					new ActionRowBuilder().setComponents(
						new ButtonBuilder()
							.setStyle(ButtonStyle.Danger)
							.setCustomId("yes")
							.setLabel("Sim")
							.setEmoji("✅"),
						new ButtonBuilder()
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("no")
							.setLabel("Não")
							.setEmoji("❌")
					),
				],
			});

			const button = await interaction.channel
				.awaitMessageComponent({
					filter: (m) => m.user.id === interaction.user.id,
					time: 30000,
				})
				.catch(() => {});

			if (!button || !button.isButton())
				return interaction.editReply({
					content: "❌ | Você não respondeu a tempo!",
					components: [],
				});

			if (button.customId === "yes") {
				await interaction.message
					.edit({
						content: null,
					})
					.catch(() => {});

				await button.update({
					content: "✅ | Mensagem retirada com sucesso!",
					components: [],
				});
			} else {
				await interaction.message.edit({
					components: interaction.message.components,
				});
				await button.update({
					content: "❌ | Você cancelou a ação!",
					components: [],
				});
			}
		}
	},
};
