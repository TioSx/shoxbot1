// /application/utils/logStaff.js
const { EmbedBuilder } = require('discord.js');

async function logStaff(client, { guild, userStaff, action, targetUser, details }) {
    const logChannelId = '1378793302589050981';
    const channel = guild.channels.cache.get(logChannelId) || await guild.channels.fetch(logChannelId).catch(() => null);

    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor(0x2b8fff)
        .setTitle('🔔 Ação de Staff')
        .setDescription(`**Ação:** ${action}`)
        .addFields(
            { name: 'Responsável', value: `<@${userStaff.id}> (${userStaff.id})`, inline: true },
            { name: 'Alvo', value: targetUser ? `<@${targetUser.id}> (${targetUser.id})` : 'Não se aplica', inline: true },
            { name: 'Detalhes', value: details || 'Nenhum', inline: false }
        )
        .setTimestamp();

    await channel.send({ embeds: [embed] });
}

module.exports = logStaff;
