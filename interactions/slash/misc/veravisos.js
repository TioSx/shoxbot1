const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Aviso = require('../../../database/models/Aviso.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('veravisos')
        .setDescription('Veja os avisos de um usuário')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers) // restrição na integração
        .addUserOption(opt => opt.setName('user').setDescription('Usuário').setRequired(true)),

    async execute(interaction) {
        // Restrição por permissão
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({
                content: "❌ Você não tem permissão para usar este comando.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('user');
        const avisos = await Aviso.find({ userId: user.id });

        if (!avisos || avisos.length === 0) {
            return interaction.reply({
                content: `✅ O usuário ${user} não possui nenhum aviso.`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Avisos de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .setColor(0xFFCC00)
            .setDescription(`Total de avisos: **${avisos.length}**`)
            .setFooter({ text: `ID: ${user.id}` });

        avisos.slice(0, 10).forEach((aviso, i) => {
            embed.addFields({
                name: `#${i + 1} | Aplicado por <@${aviso.staffId}>`,
                value: `**Motivo:** ${aviso.motivo}\n**Data:** <t:${Math.floor(new Date(aviso.data).getTime() / 1000)}:F>`,
                inline: false
            });
        });

        if (avisos.length > 10) {
            embed.addFields({
                name: "⚠️ Aviso",
                value: `Mostrando apenas os 10 avisos mais recentes.`,
                inline: false
            });
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
