const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	PermissionFlagsBits,
	UserSelectMenuBuilder,
	EmbedBuilder,
} = require("discord.js");
const help = require("../../../help.json");

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "help",

	/**@param {import("discord.js").ButtonInteraction} interaction  */
	async execute(interaction, args) {
		await interaction.deferReply({ ephemeral: true });

		const find = help.find((item) => item.id === args.type);

		if (!find) {
			return interaction.editReply({
				content: "❌ | Não encontrei a categoria solicitada",
			});
		}

		if (find.response) {
			const components = [];

			if (find.options) {
				components.push(
					new ActionRowBuilder().addComponents(
						new StringSelectMenuBuilder()
							.setCustomId(
								JSON.stringify({ id: "help", type: args.type, page: 0 })
							)
							.setPlaceholder("Selecione uma opção")
							.addOptions(
								find.options
									.slice(0, 23)
									.map((item, i) => ({
										label: item.name,
										emoji: item.emoji,
										value: `${i}`,
									}))
									.concat(
										find.options.length > 23
											? [
													{
														label: "Próxima página",
														value: "next",
														emoji: "➡️",
													},
											  ]
											: []
									)
							)
					)
				);
			}

			return await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor("Purple")
						.setAuthor({
							name: `${find.emoji} ${find.name}`,
						})
						.setDescription(find.response),
				],
				components,
			});
		}
	},
};
