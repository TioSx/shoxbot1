const fetchServers = require("./fetchServers");
const { asyncQuery } = require("../database");
const {
	ButtonStyle,
	ActionRowBuilder,
	ButtonBuilder,
	EmbedBuilder,
} = require("discord.js");

/**@param {import("discord.js").Client} client */
module.exports = async (client) => {
	const messages = await asyncQuery(
		"SELECT * FROM `serverTrack`",
		"return",
		[]
	).catch(() => null);

	if (!messages || !messages.length) return;

	const servers = await fetchServers().catch(() => null);

	if (!servers) return;

	for (const message of messages) {
		const channel = await client.channels
			.fetch(message.channel_id)
			.catch(() => null);

		if (!channel) {
			await asyncQuery("DELETE FROM `serverTrack` WHERE `id` = ?", "run", [
				message.id,
			]);
			continue;
		}

		const messageEdit = await channel.messages
			.fetch(message.message_id)
			.catch(() => null);

		if (!messageEdit) {
			await asyncQuery("DELETE FROM `serverTrack` WHERE `id` = ?", "run", [
				message.id,
			]);
			continue;
		}

		const server = servers[message.server];

		if (!server) return;

		await messageEdit
			.edit({
				embeds: [
					new EmbedBuilder()
						.setColor("Purple")
						.setTitle(`Brasil Play Shox - Servidor ${message.server + 1}`)
						.setDescription(server.description)
						.setURL(server.inviteLink)
						.setThumbnail(server.iconURL),
				],
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setURL(server.playLink)
							.setStyle(ButtonStyle.Link)
							.setLabel("Jogue Agora!")
							.setEmoji("🎮"),
						new ButtonBuilder()
							.setURL(server.forumLink)
							.setStyle(ButtonStyle.Link)
							.setLabel("Fórum")
							.setEmoji("🔗"),
						new ButtonBuilder()
							.setURL(server.inviteLink)
							.setStyle(ButtonStyle.Link)
							.setLabel("Discord")
							.setEmoji("🎫")
					),
				],
			})
			.catch(() => null);
	}

	return;
};
