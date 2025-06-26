const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	PermissionFlagsBits,
	StringSelectMenuBuilder,
} = require("discord.js");
const fetchServers = require("../../../util/fetchServers");
const serverTracker = require("../../../util/serverTracker");
const { asyncQuery } = require("../../../database");

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("automessages")
		.setDMPermission(false)
		.setDescription("🎫 | Configura mensagens automáticas para serem enviadas")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	global: true,

	async execute(interaction) {
		const messages = await asyncQuery(
			"SELECT * FROM autoMessages",
			"return",
			[]
		);

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Mensagens automáticas")
					.setDescription(
						messages.length
							? messages
									.map((message) => {
										return `**Título:** ${message.title}\n**Canal:** <#${message.channel_id}>\n**Intervalo:** ${message.interval} minutos`;
									})
									.join("\n\n")
							: "Não há mensagens automáticas cadastradas"
					)
					.setColor("Purple"),
			],
			ephemeral: true,
			components: [
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(JSON.stringify({ id: "autoMessages", action: "type" }))
						.setPlaceholder("Selecione uma opção")
						.addOptions([
							{
								label: "Adicionar mensagem",
								value: "add",
								emoji: "🟢",
							},
							{
								label: "Remover mensagem",
								value: "remove",
								emoji: "🔴",
							},
						])
				),
			],
		});

		return;
	},
};
