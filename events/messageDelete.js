const { asyncQuery } = require("../database");
const { existsSync, mkdirSync } = require("fs");
const downloadAttachment = require("../util/downloadAttachment");

module.exports = {
	name: "messageDelete",

	/**@param {import("discord.js").Message} message  */
	async execute(message) {
		if (message.author.bot || message.author.system) return;

		if (message.client.tickets.get(message.channelId)) {
			const dbMessage = await asyncQuery(
				"SELECT * FROM `ticketMessages` WHERE `channel_id` = ? AND `message_id` = ?",
				"return",
				[message.channelId, message.id]
			);

			if (dbMessage.length) {
				await asyncQuery(
					"UPDATE `ticketMessages` SET `message` = ?, `status` = ? WHERE `channel_id` = ? AND `message_id` = ?",
					"run",
					[message.content, 2, message.channelId, message.id]
				);
			}
		}

		return;
	},
};
