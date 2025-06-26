// util/logStaffPromocaoDemissao.js
const { EmbedBuilder, Colors } = require('discord.js');

// Canal de log das promoções/demissões
const LOG_CHANNEL_ID = '980643400107851786';

/**
 * @param {import('discord.js').Guild} guild
 * @param {Object} options
 * @param {import('discord.js').GuildMember} options.member
 * @param {import('discord.js').GuildMember} options.staffMember
 * @param {'PROMOCAO' | 'DEMISSAO'} options.tipo
 * @param {string} [options.cargoAntigo]
 * @param {string} [options.cargoNovo]
 * @param {string} options.motivo
 */
async function logPromocaoDemissao(guild, { member, staffMember, tipo, cargoAntigo = '', cargoNovo = '', motivo }) {
  const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
  if (!logChannel) {
    console.error(`[ERRO] Canal de log não encontrado (${LOG_CHANNEL_ID})`);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(tipo === 'PROMOCAO' ? Colors.Green : Colors.Red)
    .setTimestamp()
    .setFooter({ text: `ID do membro: ${member.id}` });

  if (tipo === 'PROMOCAO') {
    embed
      .setTitle('🎖️ Promoção de Staff')
      .setDescription(
        `👤 **Membro promovido:** ${member}\n` +
        `🎓 **De:** ${cargoAntigo || 'Sem cargo'}\n` +
        `🏆 **Para:** ${cargoNovo}\n` +
        `👮‍♂️ **Promovido por:** ${staffMember}\n` +
        `🕒 **Data:** <t:${Math.floor(Date.now() / 1000)}:f>\n\n` +
        `📄 **Motivo:** ${motivo || 'Motivo não especificado.'}`
      );
  } else if (tipo === 'DEMISSAO') {
    embed
      .setTitle('⚠️ Demissão de Staff')
      .setDescription(
        `👤 **Membro demitido:** ${member}\n` +
        `👮‍♂️ **Demitido por:** ${staffMember}\n` +
        `🕒 **Data:** <t:${Math.floor(Date.now() / 1000)}:f>\n\n` +
        `📄 **Motivo:** ${motivo || 'Motivo não especificado.'}`
      );
  }

  await logChannel.send({ embeds: [embed] });
}

module.exports = logPromocaoDemissao;
