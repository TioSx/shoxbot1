/**
 * @file Ready Event File.
 * @author Naman Vrati
 * @since 1.0.0
 * @version 3.2.2
 */

const autoMessagesDeploy = require("../util/autoMessagesDeploy");
const checkGiveaways = require("../util/checkGiveaways");
const serverTracker = require("../util/serverTracker");
const checkExpiredMutes = require('../util/checkExpiredMutes.js');

module.exports = {
	name: "ready",
	once: true,

	/**
	 * @description Executes when client is ready (bot initialization).
	 * @param {import('../typings').Client} client Main Application Client.
	 */
	async execute(client) {
		console.log(`Online! ${client.user.tag}`);

		serverTracker(client);

		autoMessagesDeploy(client);

		checkGiveaways(client);

		checkExpiredMutes(client);

		setInterval(() => {
			serverTracker(client);
			checkGiveaways(client);
			checkExpiredMutes(client);
		}, 6e4);
	},
};
