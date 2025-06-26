const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logStaff = require('../../../util/logStaff.js');
const Aviso = require('../../../database/models/Aviso.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aviso')
        .setDescription('Aplica uma advertência em um usuário')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(opt => opt.setName('user').setDescription('Usuário a ser avisado').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do aviso').setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({
                content: "❌ Você não tem permissão para usar este comando.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('user');
        const motivo = interaction.options.getString('motivo');
        const staff = interaction.user;

        // Salva o aviso no banco MongoDB
        await Aviso.create({
            userId: user.id,
            staffId: staff.id,
            motivo: motivo
        });

        // Conta quantos avisos o usuário já tem
        const avisos = await Aviso.find({ userId: user.id });

        // Envia DM para o usuário avisado
        try {
            await user.send(
                `⚠️ Você recebeu uma advertência no servidor ${interaction.guild.name}!\nMotivo: ${motivo}\n\nTotal de avisos: ${avisos.length}`
            );
        } catch {
            // Se não puder mandar DM, só ignora
        }

        // Se o user chegou a 3 avisos, silencia por 24h (timeout)
        if (avisos.length >= 3) {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (member) {
                try {
                    await member.timeout(24 * 60 * 60 * 1000, 'Atingiu 3 avisos');
                } catch {
                    // Pode não ter permissão para timeout
                }
                try {
                    await user.send(`🚫 Você foi silenciado no servidor ${interaction.guild.name} por 24 horas por acumular 3 avisos.`);
                } catch {}
            }
        }

        // Log de staff
        await logStaff(interaction.client, {
            guild: interaction.guild,
            userStaff: interaction.user,
            action: 'Aviso aplicado',
            targetUser: user,
            details: `Motivo: ${motivo}\nTotal de avisos: ${avisos.length}`
        });

        await interaction.reply({
            content: `Aviso aplicado a ${user} pelo motivo: **${motivo}**.\nAgora ele(a) possui **${avisos.length} aviso(s)**.`,
            ephemeral: true
        });
    },
};
