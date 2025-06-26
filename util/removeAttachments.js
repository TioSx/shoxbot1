const { readdirSync, rmSync } = require("fs");
module.exports = (channel_id) => {
	try {
		const files = readdirSync(`./attachments/${channel_id}`);

		if (files.length)
			rmSync(`./attachments/${channel_id}`, { recursive: true });
	} catch (_) {}
};
