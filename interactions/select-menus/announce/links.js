const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	PermissionFlagsBits,
	UserSelectMenuBuilder,
	EmbedBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} = require("discord.js");

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "announce-links",

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
			return interaction.update({
				components,
			});
		} else if (selected === "add") {
			if (
				interaction.message.components.length > 1 &&
				interaction.message.components[0].components.length === 5
			) {
				return interaction.reply({
					content: "❌ | Você já atingiu o limite de botões!",
					ephemeral: true,
				});
			}

			await interaction.showModal(
				new ModalBuilder()
					.setTitle("Botão link")
					.setCustomId(
						JSON.stringify({
							id: "announce-links",
							user: interaction.user.id,
							action: "add",
						})
					)
					.setComponents(
						new ActionRowBuilder().setComponents(
							new TextInputBuilder()
								.setCustomId("label")
								.setLabel("Nome do botão")
								.setPlaceholder("Ex: Site")
								.setMinLength(1)
								.setMaxLength(80)
								.setStyle(TextInputStyle.Short)
								.setRequired(true)
						),
						new ActionRowBuilder().setComponents(
							new TextInputBuilder()
								.setCustomId("url")
								.setLabel("URL do botão")
								.setPlaceholder("Ex: https://google.com")
								.setMinLength(1)
								.setMaxLength(512)
								.setStyle(TextInputStyle.Short)
								.setRequired(true)
						)
					)
			);

			return interaction.message.edit({
				components: interaction.message.components,
			});
		} else {
			if (interaction.message.components.length < 2) {
				return interaction.reply({
					content: "❌ | Opção inválida",
					ephemeral: true,
				});
			}

			const option =
				interaction.message.components[0].components[Number(selected)];

			if (!option) {
				return interaction.reply({
					content: "❌ | Opção inválida",
					ephemeral: true,
				});
			}

			interaction.message.components[0].components.splice(Number(selected), 1);

			const options = [];

			if (interaction.message.components[0].components.length === 0) {
				interaction.message.components.splice(0, 1);
			} else {
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

			interaction.message.components[
				interaction.message.components.length > 1 ? 1 : 0
			].components = [
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
				components: interaction.message.components,
			});

			return interaction.reply({
				content: `✅ | Botão \`${option.label}\` removido com sucesso!`,
				ephemeral: true,
			});
		}
	},
};
