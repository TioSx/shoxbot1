const { EmbedBuilder, codeBlock, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { setTimeout } = require("timers/promises");
const ticketLogs = require("../../../util/ticketLogs");
const Ticket = require(`${process.cwd()}/database/models/ticketActions.js`);

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "ticket-delete",

	/**@param {import("discord.js").ButtonInteraction} interaction  */
	async execute(interaction, args) {

		const currentTimeMillis = Date.now();
		const futureTimeMillis = currentTimeMillis + 7000;
		const futureTime = new Date(futureTimeMillis);
		const timestamp = `<t:${Math.floor(futureTime.getTime() / 1000)}:R>`;

		deleteEmbed = new EmbedBuilder()
			.setDescription(`🗑 | Ticket será deletado ${timestamp}`)
			.setColor('Purple')

		await interaction.update({
			content: ``,
			embeds: [deleteEmbed],
			components: [],
		});

		await setTimeout(5e3);

		const ticketData = await Ticket.findOne({ channel_id: interaction.channel.id });

		if (!ticketData) return;

		await interaction.channel.delete().catch(() => { });

		await ticketLogs(
			interaction.guild,
			{
				embeds: [
					new EmbedBuilder()
						.setTitle("🔴 Ticket Deletado")
						.setFields([
							{ name: "👤 Aberto por", value: `<@${ticketData.members[0]}>` },
							{ name: "🪪 ID", value: codeBlock(`${ticketData.members[0]}`) },
							{ name: "❌ Deletado por", value: `${interaction.user}` },
							{ name: "🪪 ID", value: codeBlock(`${interaction.user.id}`) },
							{ name: "🖥 Servidor", value: codeBlock(`Servidor ${ticketData.server}`) },
							{ name: "📁 Departamento", value: codeBlock(ticketData.department) },
						])
						.setColor("Red")
						.setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 512 }))
						.setFooter({ text: `Ticket #${ticketData.id} - Brasil Play Shox`, })
						.setTimestamp(),
				],
			});
	},
};
