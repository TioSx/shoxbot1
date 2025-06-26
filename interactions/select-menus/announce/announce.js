const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	PermissionFlagsBits,
	UserSelectMenuBuilder,
	EmbedBuilder,
	ChannelSelectMenuBuilder,
	ChannelType,
} = require("discord.js");

/**
 * @type {import('../../../typings').SelectInteractionCommand}
 */
module.exports = {
	id: "announce",

	/**@param {import("discord.js").StringSelectMenuInteraction} interaction  */
	async execute(interaction, args) {
		if (interaction.user.id !== args.user)
			return interaction.reply({
				content: "❌ | Você não tem permissão para usar este menu!",
				ephemeral: true,
			});

		const selected = interaction.values[0];

		let components = [];

		if (interaction.message.components.length > 1) {
			components = [...interaction.message.components];
			components.pop();
		}

		if (selected === "send") {
			if (!interaction.message.content && !interaction.message.embeds.length)
				return interaction.reply({
					content: "❌ | Você não pode enviar uma mensagem vazia!",
					ephemeral: true,
				});

			components.push(
				new ActionRowBuilder().addComponents(
					new ChannelSelectMenuBuilder()
						.setCustomId(
							JSON.stringify({
								id: "announce-send",
								user: interaction.user.id,
							})
						)
						.setPlaceholder("Canal - Selecione um canal para enviar")
						.addChannelTypes(
							ChannelType.GuildText,
							ChannelType.GuildAnnouncement
						)
				),
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(
							JSON.stringify({
								id: "announce-send",
								user: interaction.user.id,
								action: "cancel",
							})
						)
						.setLabel("Cancelar")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("❌")
				)
			);
		} else if (selected === "message") {
			components.push(
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(
							JSON.stringify({
								id: "announce-message",
								user: interaction.user.id,
							})
						)
						.setPlaceholder("Mensagem - Selecione uma opção")
						.addOptions([
							{
								label: "Editar mensagem",
								value: "edit",
								description: "Edite a mensagem de anúncio",
								emoji: "📝",
							},
							{
								label: "Excluir mensagem",
								value: "delete",
								description: "Exclua a mensagem de anúncio",
								emoji: "🗑️",
							},
							{
								label: "Voltar",
								value: "back",
								description: "Volta para o menu anterior",
								emoji: "⬅️",
							},
						])
				)
			);
		} else if (selected === "embeds") {
			const options = [];

			for (let embed in interaction.message.embeds) {
				options.push({
					label: `Embed ${embed + 1}`,
					value: embed,
					description: interaction.message.embeds[embed].title,
					emoji: "📰",
				});
			}

			if (interaction.message.embeds.length < 5) {
				options.push({
					label: "Adicionar embed",
					value: "add",
					description: "Adicione uma nova embed",
					emoji: "➕",
				});
			}

			options.push({
				label: "Voltar",
				value: "back",
				description: "Volta para o menu anterior",
				emoji: "⬅️",
			});

			components.push(
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(
							JSON.stringify({
								id: "announce-embeds",
								user: interaction.user.id,
								action: "select",
							})
						)
						.setPlaceholder("Embeds - Selecione uma embed")
						.addOptions(options)
				)
			);
		} else if (selected === "links") {
			const options = [];

			if (interaction.message.components.length > 1) {
				const components = interaction.message.components[0].components;
				for (let button in components) {
					options.push({
						label: components[button].label,
						description: "Clique para remover",
						value: button,
						emoji: "❌",
					});
				}
			}

			if ((interaction.message.components[0]?.components.length ?? 0) < 5) {
				options.push({
					label: "Adicionar link",
					value: "add",
					description: "Adicione um novo botão com link",
					emoji: "➕",
				});
			}

			options.push({
				label: "Voltar",
				value: "back",
				description: "Volta para o menu anterior",
				emoji: "⬅️",
			});

			components.push(
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(
							JSON.stringify({
								id: "announce-links",
								user: interaction.user.id,
							})
						)
						.setPlaceholder("Links - Selecione uma ação")
						.addOptions(options)
				)
			);
		}

		return interaction.update({
			components,
		});
	},
};
