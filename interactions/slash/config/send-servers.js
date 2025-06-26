const {
	SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits,
} = require("discord.js");
const fetchServers = require("../../../util/fetchServers");
const serverTracker = require("../../../util/serverTracker");
const { asyncQuery } = require("../../../database");

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("servers")
		.setDMPermission(false)
		.setDescription("🎫 | Envia os servidores do Brasil Play Shox")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	global: true,

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const servers = await fetchServers();
		const messages = [];

		for (const i in servers) {
			const message = await interaction.channel.send({
				embeds: [
					new EmbedBuilder()
						.setColor("Purple")
						.setTitle(`Brasil Play Shox - Servidor ${parseInt(i) + 1}`)
						.setDescription(servers[i].description)
						.setURL(servers[i].inviteLink)
						.setThumbnail(servers[i].iconURL),
				],
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setURL(servers[i].playLink)
							.setStyle(ButtonStyle.Link)
							.setLabel("Jogue Agora!")
							.setEmoji("🎮"),
						new ButtonBuilder()
							.setURL(servers[i].forumLink)
							.setStyle(ButtonStyle.Link)
							.setLabel("Fórum")
							.setEmoji("🔗"),
						new ButtonBuilder()
							.setURL(servers[i].inviteLink)
							.setStyle(ButtonStyle.Link)
							.setLabel("Discord")
							.setEmoji("🎫")
					),
				],
			});

			messages.push({
				id: message.id,
				server: parseInt(i),
			});
		}

		messages.forEach(async (v) => {
			await asyncQuery(
				"INSERT INTO serverTrack (server, channel_id, message_id, createdAt) VALUES (?, ?, ?, ?)",
				"run",
				[v.server, interaction.channel.id, v.id, Date.now()]
			);
		});

		setInterval(() => {
			serverTracker(interaction.client);
		}, 6e4);

		await interaction.editReply({
			content: "🎫 | Servidores enviados com sucesso!",
			ephemeral: true,
		});
	},
};
