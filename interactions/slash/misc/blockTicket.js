const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, codeBlock } = require('discord.js');
const Block = require(`${process.cwd()}/database/models/block.js`);
const ms = require('ms');

const serverOptions = {
	'1273427584545329244': 1,
	'1273427832290152620': 2,
	'1273427886489075784': 3,
	'1273427925479325736': 4,
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blockticket')
		.setDescription('⛔ | Bloqueia usuário temporariamente de criar tickets.')
		.addStringOption(option => option
			.setName('usuário')
			.setDescription('ID do usuário que você deseja bloquear.')
			.setRequired(true))
		.addStringOption(option => option
			.setName('servidor')
			.setDescription('Selecione o servidor que você deseja bloquear o usuário.')
			.addChoices(
				{ name: 'Servidor 1', value: '1273427584545329244' },
				{ name: 'Servidor 2', value: '1273427832290152620' },
				{ name: 'Servidor 3', value: '1273427886489075784' },
				{ name: 'Servidor 4', value: '1273427925479325736' }
			)
			.setRequired(true))
		.addStringOption(option => option
			.setName('duração')
			.setDescription('Duração do bloqueio (ex: 10m, 2h, 3d)')
			.setRequired(true))
		.addStringOption(option => option
			.setName('motivo')
			.setDescription('Motivo para o bloqueio')
			.setRequired(false))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.setDMPermission(false),

	async execute(interaction) {
		const userId = interaction.options.getString('usuário');
		const roleId = interaction.options.getString('servidor');
		const duration = interaction.options.getString('duração');
		const reason = interaction.options.getString('motivo') || 'Não houve um motivo';

		const member = await interaction.guild.members.fetch(userId).catch(() => null);

		if (!member) {
			return interaction.reply({ content: '❌ | ID inválido.', ephemeral: true });
		}

		await member.roles.add(roleId);
		const expiresAt = new Date(Date.now() + ms(duration));

		await Block.create({
			userId: userId,
			roleId: roleId,
			expiresAt: expiresAt,
			reason: reason,
			guildId: interaction.guild.id,
		});

        const channel = await interaction.guild.channels.fetch('980642109864411206');
        if (!channel || !channel.isTextBased()) {
            return interaction.reply({ content: 'Canal não encontrado ou não é um canal de texto.', ephemeral: true });
        }

		const serverPosition = serverOptions[roleId].toString();
		const ExpireTime = expiresAt.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' ' + expiresAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short', });

		const userBlockEmbed = new EmbedBuilder()
			.setTitle('Você foi bloqueado!')
			.setDescription(`Você foi bloqueado de abrir tickets por **${duration}**.`)
			.addFields(
				{ name: 'Servidor', value: codeBlock(serverPosition) },
				{ name: 'Motivo', value: codeBlock(reason) },
				{ name: 'Responsável', value: codeBlock(interaction.user.tag) },
				{ name: 'Expira', value: codeBlock(ExpireTime) },
			)
			.setColor('Red')
			.setTimestamp();

		const serverBlockEmbed = new EmbedBuilder()
			.setTitle('Usuário bloqueado!')
			.setDescription(`<@${userId}> foi bloqueado de abrir tickets por **${duration}**.`)
			.addFields(
				{ name: 'Servidor', value: codeBlock(serverPosition), inline: true },
				{ name: 'Responsável', value: codeBlock(interaction.user.tag), inline: true },
				{ name: 'Motivo', value: codeBlock(reason) },
				{ name: 'Expira', value: codeBlock(ExpireTime) },
			)
			.setColor('Red')
			.setTimestamp();

		await channel.send({ embeds: [serverBlockEmbed] });

		try {
			await member.send({ embeds: [userBlockEmbed] });
		} catch (error) {
			return;
		}

		await interaction.reply({
			content: `✅ | <@${userId}> foi mutado por ${duration}.`,
			ephemeral: true,
		});

		setTimeout(async () => {
			const updatedMember = await interaction.guild.members.fetch(userId).catch(() => null);
			if (updatedMember) {
				await updatedMember.roles.remove(roleId);

				await Block.deleteOne({ userId: userId, roleId: roleId });
			}
		}, ms(duration));
	}
};
