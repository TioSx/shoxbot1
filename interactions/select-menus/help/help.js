const {
	UserSelectMenuInteraction,
	PermissionFlagsBits,
	EmbedBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
} = require("discord.js");
const help = require("../../../help.json");

/**
 * @type {import('../../../typings').SelectInteractionCommand}
 */
module.exports = {
	id: "help",

	/**
	 *
	 * @param {UserSelectMenuInteraction} interaction
	 */
	async execute(interaction, args) {
		const type = help.find((item) => item.id === args.type);

		if (!type) {
			return interaction.reply({
				content: "❌ | Não encontrei a categoria solicitada",
				ephemeral: true,
			});
		}

		const selected = interaction.values[0];

		if (selected === "next") {
			interaction.update({
				components: [
					new ActionRowBuilder().addComponents(
						new StringSelectMenuBuilder()
							.setCustomId(
								JSON.stringify({
									id: "help",
									type: args.type,
									page: ++args.page,
								})
							)
							.setPlaceholder("Selecione uma opção")
							.addOptions(
								[
									{
										label: "Voltar",
										value: "back",
										emoji: "⬅️",
									},
								].concat(
									type.options
										.slice(args.page * 23, (args.page + 1) * 23)
										.map((item, i) => ({
											label: item.name,
											emoji: item.emoji,
											value: `${i}`,
										}))
										.concat(
											type.options.length > (args.page + 1) * 23
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
					),
				],
			});
		} else if (selected === "back") {
			await interaction.update({
				components: [
					new ActionRowBuilder().addComponents(
						new StringSelectMenuBuilder()
							.setCustomId(
								JSON.stringify({
									id: "help",
									type: args.type,
									page: --args.page,
								})
							)
							.setPlaceholder("Selecione uma opção")
							.addOptions(
								[
									...(args.page !== 0
										? [
												{
													label: "Voltar",
													value: "back",
													emoji: "⬅️",
												},
										  ]
										: []),
								].concat(
									type.options
										.slice(args.page * 23, (args.page + 1) * 23)
										.map((item, i) => ({
											label: item.name,
											emoji: item.emoji,
											value: `${i}`,
										}))
										.concat(
											type.options.length > (args.page + 1) * 23
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
					),
				],
			});
		} else {
			const res = type.options[parseInt(selected)];

			if (!res) {
				return interaction.reply({
					content: "❌ | Não encontrei a opção solicitada",
					ephemeral: true,
				});
			}

			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Purple")
						.setAuthor({
							name: `${res.name}`,
						})
						.setDescription(res.response),
				],
				ephemeral: true,
			});
		}
	},
};
