const config = require("../config.json");

module.exports = async (guild, message, transcript) => {
	let channel = null;

	if (transcript) {
		let channelId = config["ticket-log-transcripts"] || config["ticket-logs"];

		if (!channelId) return console.error("Não foi encontrado canal de logs");
		channel = await guild.channels.fetch(channelId).catch(() => null);
	} else {
		channel = await guild.channels
			.fetch(config["ticket-logs"])
			.catch(() => null);
	}

	if (!channel) return console.error("Não foi encontrado canal de logs");

	return channel.send(message);
};
