const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logStaff = require('../../../util/logStaff.js');
const CargoTemp = require('../../../database/models/CargoTemp.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cargotemp')
        .setDescription('Atribui um cargo temporário a um usuário')
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
        .addUserOption(opt => opt.setName('user').setDescription('Usuário').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Cargo').setRequired(true))
        .addIntegerOption(opt => opt.setName('dias').setDescription('Dias').setRequired(false))
        .addIntegerOption(opt => opt.setName('horas').setDescription('Horas').setRequired(false))
        .addIntegerOption(opt => opt.setName('minutos').setDescription('Minutos').setRequired(false)),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.MoveMembers)) {
            return interaction.reply({
                content: "❌ Você não tem permissão para usar este comando.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const dias = interaction.options.getInteger('dias') || 0;
        const horas = interaction.options.getInteger('horas') || 0;
        const minutos = interaction.options.getInteger('minutos') || 0;
        if (dias + horas + minutos === 0) {
            return interaction.reply({ content: "Você precisa definir pelo menos um tempo (dias, horas ou minutos).", ephemeral: true });
        }

        const expiresAt = new Date(Date.now() +
            (dias * 24 * 60 * 60 * 1000) +
            (horas * 60 * 60 * 1000) +
            (minutos * 60 * 1000)
        );

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return interaction.reply({ content: "Usuário não encontrado no servidor.", ephemeral: true });
        }

        await member.roles.add(role).catch(() => {
            return interaction.reply({ content: "❌ Não foi possível atribuir o cargo. Verifique a hierarquia do bot.", ephemeral: true });
        });

        await CargoTemp.create({
            guildId: interaction.guild.id,
            userId: user.id,
            roleId: role.id,
            expiresAt
        });

        // Log de staff
        await logStaff(interaction.client, {
            guild: interaction.guild,
            userStaff: interaction.user,
            action: 'Cargo temporário adicionado',
            targetUser: user,
            details: `Cargo: <@&${role.id}>\nExpira: <t:${Math.floor(expiresAt.getTime()/1000)}:F>`
        });

        await interaction.reply({
            content: `✅ Cargo ${role} adicionado a ${user} até <t:${Math.floor(expiresAt.getTime()/1000)}:f>.`,
            ephemeral: true
        });
    },
};
