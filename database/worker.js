const { parentPort } = require("worker_threads");
const db = require("better-sqlite3")("main.db");

db.pragma("journal_mode = WAL");

db.prepare(
	"CREATE TABLE IF NOT EXISTS `absence` (`user_id` VARCHAR(50) NOT NULL, `shift` VARCHAR(10) NOT NULL, `close_reports` TINYINT(1) NOT NULL, `reason` TEXT NOT NULL, `date` MEDIUMTEXT NOT NULL)"
).run();

db.prepare(
	"CREATE TABLE IF NOT EXISTS `serverTrack` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `server` INTEGER NOT NULL, `channel_id` TEXT NOT NULL, `message_id` TEXT NOT NULL, `createdAt` INTEGER NOT NULL)"
).run();

db.prepare(
	"CREATE TABLE IF NOT EXISTS `autoMessages` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `title` TEXT NOT NULL, `channel_id` TEXT NOT NULL, `message` TEXT NOT NULL, `interval` INTEGER NOT NULL, `createdAt` INTEGER NOT NULL)"
).run();

db.prepare(
	"CREATE TABLE IF NOT EXISTS `checkout` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `user_id` TEXT NOT NULL, `started` INTEGER NOT NULL, `finished` INTEGER NULL, `message_id` TEXT NULL, `createdAt` INTEGER NOT NULL)"
).run();

db.prepare(
	"CREATE TABLE IF NOT EXISTS `giveaway` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `creator_id` TEXT NOT NULL, `message_id` TEXT NULL, `channel_id` TEXT NULL, `title` TEXT NOT NULL, `prize` TEXT NOT NULL, `required_roles` TEXT NULL, `winners` INTEGER NOT NULL, `endsAt` INTEGER NOT NULL, `started` INTEGER NOT NULL DEFAULT 0, `ended` INTEGER NOT NULL DEFAULT 0, `createdAt` INTEGER NOT NULL)"
).run();

db.prepare(
	"CREATE TABLE IF NOT EXISTS `giveawayEntries` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `giveaway_id` INTEGER NOT NULL, `user_id` TEXT NOT NULL, `createdAt` INTEGER NOT NULL)"
).run();

parentPort.on("message", ({ sql, parameters, type }) => {
	try {
		if (type === "run") {
			const result = db.prepare(sql).run(...parameters);
			parentPort.postMessage(result);
			return;
		} else {
			const result = db.prepare(sql).all(...parameters);
			parentPort.postMessage(result);
		}
	} catch (err) {
		console.log({ sql, parameters: JSON.stringify(parameters) });
		console.error(err);
	}
});
