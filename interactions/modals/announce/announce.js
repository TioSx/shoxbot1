const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	codeBlock,
	StringSelectMenuBuilder,
} = require("discord.js");

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */
module.exports = {
	id: "announce-links",

	/**
	 * @param {import("discord.js").ModalSubmitInteraction} interaction
	 */
	async execute(interaction, args) {
		if (args.action === "add") {
			const label = interaction.fields.getTextInputValue("label");
			const url = interaction.fields.getTextInputValue("url");

			const check =
				/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/.test(
					url
				);

			if (!check)
				return interaction.reply({
					content: "❌ | URL inválida!",
					ephemeral: true,
				});

			const components = interaction.message.components;
			const options = [];

			if (components.length > 1) {
				components[0].components.push(
					new ButtonBuilder()
						.setURL(url)
						.setLabel(label)
						.setStyle(ButtonStyle.Link)
				);

				for (let button in components[0].components) {
					options.push({
						label: components[0].components[button].data.label,
						description: "Clique para remover",
						value: button,
						emoji: "❌",
					});
				}
			} else {
				components.unshift(
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setURL(url)
							.setLabel(label)
							.setStyle(ButtonStyle.Link)
					)
				);
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

			components[components.length > 1 ? 1 : 0].components = [
				new StringSelectMenuBuilder()
					.setCustomId(
						JSON.stringify({
							id: "announce-links",
							user: interaction.user.id,
						})
					)
					.setPlaceholder("Links - Selecione uma ação")
					.addOptions(options),
			];

			await interaction.message.edit({
				components,
			});

			await interaction.reply({
				content: "✅ | Botão adicionado com sucesso!",
				ephemeral: true,
			});
		}
	},
};
