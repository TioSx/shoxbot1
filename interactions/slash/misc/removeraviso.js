const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logStaff = require('../../../util/logStaff.js');
const Aviso = require('../../../database/models/Aviso.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removeraviso')
        .setDescription('Remove um aviso de um usuário')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(opt => opt.setName('user').setDescription('Usuário').setRequired(true))
        .addIntegerOption(opt => opt.setName('numero').setDescription('Número do aviso (veja em /veravisos)').setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({
                content: "❌ Você não tem permissão para usar este comando.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('user');
        const numero = interaction.options.getInteger('numero');

        const avisos = await Aviso.find({ userId: user.id });

        if (!avisos || avisos.length === 0) {
            return interaction.reply({ content: `O usuário ${user} não tem nenhum aviso.`, ephemeral: true });
        }
        if (numero < 1 || numero > avisos.length) {
            return interaction.reply({ content: `Número de aviso inválido. O usuário ${user} possui ${avisos.length} aviso(s).`, ephemeral: true });
        }

        avisos.sort((a, b) => new Date(a.data) - new Date(b.data));
        const avisoRemover = avisos[numero - 1];

        await Aviso.deleteOne({ _id: avisoRemover._id });

        // Log de staff
        await logStaff(interaction.client, {
            guild: interaction.guild,
            userStaff: interaction.user,
            action: 'Aviso removido',
            targetUser: user,
            details: `Aviso #${numero} removido. Motivo: ${avisoRemover.motivo}`
        });

        return interaction.reply({
            content: `✅ Aviso #${numero} removido do usuário ${user}!\nMotivo removido: **${avisoRemover.motivo}**`,
            ephemeral: true
        });
    },
};
