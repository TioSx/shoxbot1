const { EmbedBuilder } = require("discord.js");
const { asyncQuery } = require("../database");

module.exports = (client, channel_id, autoMessage_id, interval, message) => {
	const intervalObj = setInterval(async () => {
		const channel = await client.channels.fetch(channel_id).catch(() => {});

		if (!channel) {
			await asyncQuery("DELETE FROM autoMessages WHERE id = ?", "run", [
				autoMessage_id,
			]);

			return clearInterval(intervalObj);
		}

		await channel
			.send({
				embeds: [new EmbedBuilder().setColor("Purple").setDescription(message)],
			})
			.catch(() => {
				clearInterval(intervalId);
			});
	}, interval * 6e4);

	client.autoMessages.set(autoMessage_id, intervalObj);

	return;
};
