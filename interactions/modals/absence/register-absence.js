const { asyncQuery } = require("../../../database");
const config = require("../../../config.json");
const {
	EmbedBuilder,
	WebhookClient,
} = require("discord.js");
// const ticketLogs = require("../../../util/ticketLogs");
// const autoMessagesInterval = require("../../../util/autoMessagesInterval");

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */
module.exports = {
	id: "absence",

	/**
	 * @param {import("discord.js").ModalSubmitInteraction} interaction
	 */
	async execute(interaction, args) {
		await interaction.deferReply({ ephemeral: true });

		const { client } = interaction;

        const { shift, close_reports } = args;
		const reason = interaction.fields.getTextInputValue("reason");
		const possibleTime = interaction.fields.getTextInputValue("possible_time");
		const user_id = interaction.user.id;

		const date = new Date()

		await asyncQuery(
			"INSERT INTO `absence` (`user_id`, `guild_id`, `shift`, `close_reports`, `reason`, `possible_time`, `date`) VALUES (?, ?, ?, ?, ?, ?, ?)",
			"run",
			[
				user_id,
				null,
				shift,
				close_reports === "yes" ? 1 : 0,
				reason,
				possibleTime,
				date.toString()
			]
		);

		const guild = await client.guilds.fetch(config.guild_admin_id)
		const member = await guild.members.fetch(user_id)
		const avatar = member.user.avatarURL()

		const embed = new EmbedBuilder()
			.setColor("Blue")
			.setTitle("🕒 | Ausência Solicitada")
			.setAuthor({
				name: member.user.tag,
				iconURL: avatar,
				url: `https://discord.com/users/${user_id}`
			})
			.setThumbnail(avatar || "https://cdn.discordapp.com/icons/656244004609851455/a_2c72393a0f972c7970c5871150704a62.gif")
			.addFields(
				{ name: "🔄 Turno:", value: `\`\`\`${shift === "morning" ? "Manhã" : shift === "afternoon" ? "Tarde": "Noite"}\`\`\`         ` },
				{ name: "⚠️ Fechou Denúncias:", value: `\`\`\`${close_reports === "yes" ? "Sim" : "Não"}\`\`\`` },
				{ name: "💬 Motivo:", value: `\`\`\`${reason}\`\`\`` },
				{ name: "🕒 Possível horário de login:", value: `\`\`\`${possibleTime}\`\`\`` },
				{ name: "📅 Data:", value: `\`\`\`${date.toLocaleString("pt-BR")}\`\`\`` },
			)
			.setFooter({
				iconURL: "https://cdn.discordapp.com/icons/656244004609851455/a_2c72393a0f972c7970c5871150704a62.gif",
				text: `Brasil Play Shox`
	 		})

		await interaction.editReply({ content: `<@${user_id}> | \`${user_id}\``, embeds: [embed] })

		for (const key in config.config_absence) {
			const config_absence = config.config_absence[key]
		
			if (member.roles.cache.has(config_absence.role_id)) {
				await asyncQuery(
					"UPDATE `absence` SET `guild_id` = ? WHERE `user_id` = ?",
					"run",
					[
						config_absence.guild_id,
						user_id
					]
				);
				new WebhookClient({ url: config_absence.webhook })
					.send({
						avatarURL: "https://cdn.discordapp.com/icons/656244004609851455/a_2c72393a0f972c7970c5871150704a62.gif",
						content: `<@${user_id}> | \`${user_id}\``,
						embeds: [embed]
					})
				break
			}
		}

		return;
	},
};
