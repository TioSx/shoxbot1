const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	StringSelectMenuBuilder,
} = require("discord.js");
const { asyncQuery } = require("../../../database");
const time = require("../../../util/timeMs");

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("sorteio")
		.setDescription("🎁 | Cria um sorteio")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setDMPermission(false)
		.addStringOption((option) =>
			option
				.setName("titulo")
				.setDescription("Título do sorteio")
				.setMaxLength(100)
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("premio")
				.setDescription("Prêmio do sorteio")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("data")
				.setDescription("Data do sorteio. Exemplo: 30/12/2023, 12:30, 12h")
				.setRequired(true)
		)
		.addIntegerOption((option) =>
			option
				.setName("vencedores")
				.setDescription("Quantidade de vencedores")
				.setMinValue(1)
				.setMaxValue(20)
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("requisito")
				.setDescription("Requisito para participar do sorteio")
				.setRequired(false)
				.setMaxLength(200)
		),
	global: true,

	async execute(interaction) {

		const title = interaction.options.getString("titulo");
		const prize = interaction.options.getString("premio");
		const requiredText = interaction.options.getString("requisito");
		const winners = interaction.options.getInteger("vencedores");
		const now = Date.now();
		let date = time(interaction.options.getString("data"));

		if (!date) {
			return interaction.reply({
				content: "Data inválida. Insira uma data que se encaixe nos exemplos:\n\n> `a - h - m - s` - Ano, Hora, Minuto, Segundo\n \n> `1h 10m 40s` - `1m 10s` - `2h 10m`\n \n> `2 dias 10 minutos 5 segundos`\n \n> `30/01/2022 14:35:25` *Os segundos são opcionais*\n \n> `hoje 14:35` - `amanhã 14:35`\n \n> `09:10` - `14:35` - `30/01/2022` - `00:00`\n \n> `domingo 11:00` - `segunda` - `terça-feira 17:00`",
				ephemeral: true,
			});
		}

		date = Math.floor((date + now) / 1e3);

		const embed = new EmbedBuilder()
			.setTitle(`Sorteio - ${title}`)
			.setDescription("Para participar clique no botão abaixo.")
			.setColor("Purple")
			.addFields(
				{
					name: `📆 Encerra <t:${date}:R>`,
					value: `<t:${date}>`,
					inline: true,
				},
				{
					name: "🎁 Prêmio",
					value: `> ${prize}`,
					inline: true,
				},
				{
					name: "👑 Vencedores",
					value: `> **${winners}**`,
					inline: true,
				}
			)
			.setTimestamp()
			.setFooter({
				text: `Brasil Play Shox`,
				iconURL: interaction.guild.iconURL({ dynamic: true }),
			});

		if (requiredText) {
			embed.addFields({
				name: "📄 Requisito",
				value: requiredText,
				inline: true,
			});
		}

		await asyncQuery(
			"INSERT INTO giveaway (title, prize, creator_id, winners, endsAt, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
			"run",
			[title, prize, interaction.user.id, winners, date, Math.floor(now / 1e3)]
		);

		const id = await asyncQuery(
			"SELECT id FROM giveaway WHERE createdAt = ?",
			"return",
			[Math.floor(now / 1e3)]
		);

		await interaction.reply({
			embeds: [embed],
			components: [
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(
							JSON.stringify({ id: "giveaway", giveaway_id: id[0].id })
						)
						.setPlaceholder("Selecione uma opção")
						.addOptions([
							{
								label: "Adicionar cargos para participar",
								value: "addRoles",
							},
							{
								label: "Enviar mensagem do sorteio",
								value: "sendMessage",
							},
						])
				),
			],
			ephemeral: true,
		});
	},
};
