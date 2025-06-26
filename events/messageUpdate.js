const { asyncQuery } = require("../database");
const { existsSync, mkdirSync } = require("fs");
const downloadAttachment = require("../util/downloadAttachment");

module.exports = {
	name: "messageUpdate",

	/**@param {import("discord.js").Message} message  */
	async execute(oldMessage, newMessage) {
		if (oldMessage.author.bot || oldMessage.author.system) return;

		if (newMessage.client.tickets.get(oldMessage.channelId)) {
			const dbMessage = await asyncQuery(
				"SELECT * FROM `ticketMessages` WHERE `channel_id` = ? AND `message_id` = ?",
				"return",
				[newMessage.channelId, newMessage.id]
			);

			if (dbMessage.length) {
				await asyncQuery(
					"UPDATE `ticketMessages` SET `message` = ?, `status` = ? WHERE `channel_id` = ? AND `message_id` = ?",
					"run",
					[newMessage.content, 1, newMessage.channelId, newMessage.id]
				);
			}
		}

		return;
	},
};
