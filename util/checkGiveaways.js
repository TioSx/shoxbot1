const {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const { asyncQuery } = require("../database");

module.exports = async (client) => {
	const giveaways = await asyncQuery(
		"SELECT * FROM giveaway WHERE endsAt < ? AND started = 1 AND ended = 0",
		"return",
		[Math.floor(Date.now() / 1e3)]
	);

	if (!giveaways.length) return;

	for (const giveaway of giveaways) {
		const entries = await asyncQuery(
			"SELECT * FROM giveawayEntries WHERE giveaway_id = ?",
			"return",
			[giveaway.id]
		);

		if (!entries.length) {
			await Promise.all([
				asyncQuery("DELETE FROM giveaway WHERE id = ?", "run", [giveaway.id]),

				asyncQuery("DELETE FROM giveawayEntries WHERE giveaway_id = ?", "run", [
					giveaway.id,
				]),
			]);

			return;
		}

		const winners = [];

		for (let x = 0; x < giveaway.winners; x++) {
			const index = Math.floor(Math.random() * entries.length);
			const winner = entries[index];

			if (!winner) break;

			winners.push(winner.user_id);

			entries.splice(index, 1);
		}

		const channel = await client.channels
			.fetch(giveaway.channel_id)
			.catch(() => { });

		if (!channel) {
			await Promise.all([
				asyncQuery("DELETE FROM giveaway WHERE id = ?", "run", [giveaway.id]),

				asyncQuery("DELETE FROM giveawayEntries WHERE giveaway_id = ?", "run", [
					giveaway.id,
				]),
			]);

			return;
		}

		const message = await channel.messages
			.fetch(giveaway.message_id)
			.catch(() => { });

		const data = {
			content: `🔔 <@${giveaway.creator_id}> ${winners
				.map((winner) => `<@${winner}>`)
				.join(" ")}`,
			embeds: [
				new EmbedBuilder()
					.setTitle(`🎉 Sorteio Finalizado - ${giveaway.title}`)
					.setColor("Green")
					.setFields(
						{
							name: "🎁 Prêmio",
							value: `> ${giveaway.prize}`,
							inline: true,
						},
						{
							name: `👑 Vencedor${winners.length > 1 ? "es" : ""}`,
							value: `${winners.map((winner) => `<@${winner}>`).join(" ")}`,
							inline: true,
						}
					)
					.setTimestamp()
					.setFooter({
						text: `Brasil Play Shox`,
						iconURL: channel.guild.iconURL({ dynamic: true }),
					}),
			],
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(
							JSON.stringify({
								id: "giveaway",
								type: "reroll",
								giveaway_id: giveaway.id,
							})
						)
						.setLabel("Reroll")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("🎲")
				),
			],
		};

		let finishMessage;

		if (message) {
			finishMessage = await message.reply(data).catch(() => { });
		} else {
			finishMessage = await channel.send(data).catch(() => { });
		}

		await message
			?.edit({
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder(
							message.components[0].components[0].toJSON()
						).setDisabled(true),
						...(finishMessage
							? [
								new ButtonBuilder()
									.setURL(finishMessage.url)
									.setLabel("Ir para o resultado")
									.setStyle(ButtonStyle.Link),
							]
							: [])
					),
				],
			})
			.catch(() => { });

		await asyncQuery("UPDATE giveaway SET ended = ? WHERE id = ?", "run", [
			1,
			giveaway.id,
		]);
	}
};
