const {
	ActionRowBuilder,
	StringSelectMenuBuilder,
} = require("@discordjs/builders");
const {
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} = require("discord.js");
const { asyncQuery } = require("../../../database");

module.exports = {
	id: "autoMessages",

	/**@param {import("discord.js").StringSelectMenuInteraction} interaction  */
	async execute(interaction, args) {
		if (args.action === "type") {
			const option = interaction.values[0];

			if (option === "add") {
				await interaction.showModal(
					new ModalBuilder()
						.setTitle("Adicionar mensagem automática")
						.setCustomId(JSON.stringify({ id: "autoMessages", action: "add" }))
						.setComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("title")
									.setLabel("Título (Apenas para identificação)")
									.setMaxLength(30)
									.setPlaceholder("Apenas para identificação")
									.setStyle(TextInputStyle.Short)
									.setRequired(true)
							)
						)
				);
			} else if (option === "remove") {
				const messages = await asyncQuery(
					"SELECT * FROM autoMessages",
					"return",
					[]
				);

				if (!messages.length) {
					return await interaction.reply({
						content: "Não há mensagens automáticas cadastradas",
						ephemeral: true,
					});
				}

				await interaction.update({
					components: [
						new ActionRowBuilder().addComponents(
							new StringSelectMenuBuilder()
								.setCustomId(
									JSON.stringify({
										id: "autoMessages",
										action: "remove",
										page: 0,
									})
								)
								.setPlaceholder("Selecione para remover")
								.addOptions([
									...messages.slice(0, 23).map((message) => {
										return {
											label: message.title,
											value: message.id.toString(),
										};
									}),
									...(messages.length > 24
										? [
												{
													label: "Próxima página",
													value: "next",
													emoji: "➡️",
												},
										  ]
										: []),
								])
						),
					],
				});
			}

			return;
		} else if (args.action === "remove") {
			const option = interaction.values[0];

			if (option === "next" || option === "previous") {
				const page = option.previous ? args.page - 1 : args.page + 1;

				const messages = await asyncQuery(
					"SELECT * FROM autoMessages",
					"return",
					[]
				);

				if (!messages.length) {
					return await interaction.reply({
						content: "Não há mensagens automáticas cadastradas",
						ephemeral: true,
					});
				}

				const slice = messages.slice(24 * page, 23 * (page + 1));

				await interaction.update({
					components: [
						new ActionRowBuilder().addComponents(
							new StringSelectMenuBuilder()
								.setCustomId(
									JSON.stringify({
										id: "autoMessages",
										action: "remove",
										page: page,
									})
								)
								.setPlaceholder("Selecione para remover")
								.addOptions([
									...(page > 0
										? [
												{
													label: "Página anterior",
													value: "previous",
													emoji: "⬅️",
												},
										  ]
										: []),
									...slice.map((message) => {
										return {
											label: message.title,
											value: message.id.toString(),
										};
									}),
									...(messages.length > 24 * (page + 1)
										? [
												{
													label: "Próxima página",
													value: "next",
													emoji: "➡️",
												},
										  ]
										: []),
								])
						),
					],
				});
			} else {
				await asyncQuery("DELETE FROM autoMessages WHERE id = ?", "run", [
					option,
				]);

				await interaction.update({
					content: "Mensagem removida com sucesso",
					components: [],
					embeds: [],
				});

				const autoMessageInterval = interaction.client.autoMessages.get(
					parseInt(option)
				);
				if (autoMessageInterval) {
					clearInterval(autoMessageInterval);
				}
			}
		}

		return;
	},
};
