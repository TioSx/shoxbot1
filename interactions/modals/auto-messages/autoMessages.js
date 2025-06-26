const { asyncQuery } = require("../../../database");
const config = require("../../../config.json");
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	codeBlock,
} = require("discord.js");
const ticketLogs = require("../../../util/ticketLogs");
const autoMessagesInterval = require("../../../util/autoMessagesInterval");

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */
module.exports = {
	id: "autoMessages",

	/**
	 * @param {import("discord.js").ModalSubmitInteraction} interaction
	 */
	async execute(interaction, args) {
		if (args.action === "add") {
			await interaction.deferUpdate();

			let title = interaction.fields.getTextInputValue("title");

			const exists = await asyncQuery(
				"SELECT * FROM autoMessages WHERE title = ?",
				"return",
				[title]
			);

			if (exists.length) {
				title += ` (${exists.length})`;
			}

			await interaction.editReply({
				content:
					"🗨 | Envie a mensagem que deseja que seja enviada automaticamente, você tem `2 minutos`!\n\n**Ela será apagada assim que enviada**",
				embeds: [],
				components: [],
			});

			const message = await interaction.channel
				.awaitMessages({
					filter: (m) => m.author.id === interaction.user.id,
					max: 1,
					time: 120000,
				})
				.catch(() => {});

			if (!message || !message.first()) {
				return await interaction.editReply({
					content: "❌ | Você não enviou a mensagem a tempo",
					ephemeral: true,
				});
			}

			const content = message.first().content;

			message
				.first()
				.delete()
				.catch(() => {});

			await interaction.editReply({
				content:
					"⏳ | Envie o intervalo em minutos que a mensagem deve ser enviada, você tem `2 minutos`!",
				ephemeral: true,
			});

			const interval = await interaction.channel
				.awaitMessages({
					filter: (m) => m.author.id === interaction.user.id,
					max: 1,
					time: 120000,
				})
				.catch(() => {});

			if (!interval || !interval.first()) {
				return await interaction.editReply({
					content: "❌ | Você não enviou o intervalo a tempo",
					ephemeral: true,
				});
			}

			const intervalContent = interval.first().content;

			await interval
				.first()
				.delete()
				.catch(() => {});

			const intervalNumber = Number(intervalContent);

			if (isNaN(intervalNumber) || intervalNumber < 1) {
				return await interaction.editReply({
					content: "❌ | O intervalo deve ser um número inteiro maior que 0",
					ephemeral: true,
				});
			}

			await asyncQuery(
				"INSERT INTO autoMessages (title, channel_id, message, interval, createdAt) VALUES (?, ?, ?, ?, ?)",
				"run",
				[
					title,
					interaction.channel.id,
					content,
					intervalNumber,
					Math.floor(Date.now() / 1e3),
				]
			);

			const id = await asyncQuery(
				"SELECT (id) FROM autoMessages WHERE title = ?",
				"return",
				[title]
			);

			await interaction.editReply({
				content: `Mensagem \`${title}\` automática adicionada com sucesso`,
				ephemeral: true,
			});

			autoMessagesInterval(
				interaction.client,
				interaction.channel.id,
				id[0].id,
				intervalNumber,
				content
			);
		}

		return;
	},
};
