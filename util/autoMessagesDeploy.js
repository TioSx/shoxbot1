const { asyncQuery } = require("../database");
const autoMessagesInterval = require("./autoMessagesInterval");

module.exports = async (client) => {
	const autoMessages = await asyncQuery(
		"SELECT * FROM autoMessages",
		"return",
		[]
	);

	for (const autoMessage of autoMessages) {
		autoMessagesInterval(
			client,
			autoMessage.channel_id,
			autoMessage.id,
			autoMessage.interval,
			autoMessage.message
		);
	}

	return;
};
