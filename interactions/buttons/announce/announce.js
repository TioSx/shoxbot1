const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "announce-send",

	async execute(interaction, args) {
		if (args.action === "cancel") {
			const components = [...interaction.message.components];

			components.pop();
			components.pop();

			await interaction.update({
				components: [
					...components,
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
					),
				],
			});
		}
		return;
	},
};
