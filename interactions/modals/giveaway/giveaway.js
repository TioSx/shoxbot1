const { asyncQuery } = require("../../../database");
const { EmbedBuilder } = require("discord.js");

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */
module.exports = {
	id: "giveaway",

	/**
	 * @param {import("discord.js").ModalSubmitInteraction} interaction
	 */
	async execute(interaction, args) {
		if (args.type === "reroll") {
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

			const rerolls = parseInt(
				interaction.fields.getTextInputValue("quantity")
			);

			if (isNaN(rerolls) || rerolls < 1 || rerolls > giveaway[0].winners) {
				await interaction.reply({
					content: "❌ | Quantidade inválida",
					ephemeral: true,
				});
				return;
			}

			const entries = await asyncQuery(
				"SELECT * FROM giveawayEntries WHERE giveaway_id = ?",
				"return",
				[giveaway[0].id]
			);

			if (!entries.length) {
				await interaction.reply({
					content: "❌ | Esse sorteio não possui participantes",
					ephemeral: true,
				});
				return;
			}

			const winners = [];

			for (let x = 0; x < rerolls; x++) {
				const index = Math.floor(Math.random() * entries.length);
				const winner = entries[index];

				if (!winner) break;

				winners.push(winner.user_id);

				entries.splice(index, 1);
			}

			await interaction.reply({
				content: `🔔 ${winners.map((winner) => `<@${winner}>`).join(" ")}`,
				embeds: [
					new EmbedBuilder()
						.setTitle(`🎲 Reroll - ${giveaway[0].title}`)
						.setFields(
							{
								name: "🎁 Prêmio",
								value: `> ${giveaway[0].prize}`,
								inline: true,
							},
							{
								name: `👑 Vencedor${winners.length > 1 ? "es" : ""}`,
								value: `${winners.map((winner) => `<@${winner}>`).join(" ")}`,
								inline: true,
							}
						)
						.setColor("Orange")
						.setTimestamp()
						.setFooter({
							text: `Brasil Play Shox`,
							iconURL: interaction.channel.guild.iconURL({ dynamic: true }),
						}),
				],
			});
		}
	},
};
