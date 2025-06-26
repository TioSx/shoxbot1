const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const CargoTemp = require('../../../database/models/CargoTemp.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listacargotemp')
        .setDescription('Lista todos com cargos temporários ativos')
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.MoveMembers)) {
            return interaction.reply({
                content: "❌ Você não tem permissão para usar este comando.",
                ephemeral: true
            });
        }

        const docs = await CargoTemp.find({ guildId: interaction.guild.id, expiresAt: { $gt: new Date() } });
        if (!docs.length) {
            return interaction.reply({ content: "Nenhum usuário está com cargo temporário ativo.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('Cargos Temporários Ativos')
            .setColor(0x2b8fff)
            .setFooter({ text: `Total: ${docs.length}` });

        for (const doc of docs.slice(0, 15)) {
            embed.addFields({
                name: `<@${doc.userId}>`,
                value: `Cargo: <@&${doc.roleId}>\nExpira em: <t:${Math.floor(new Date(doc.expiresAt).getTime()/1000)}:R>`,
                inline: false
            });
        }
        if (docs.length > 15) {
            embed.addFields({
                name: '⚠️ Aviso',
                value: `Mostrando apenas os 15 primeiros.`,
                inline: false
            });
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
