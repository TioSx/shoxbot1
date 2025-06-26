// events/guildMemberAdd.js
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  /**
   * @param {import('discord.js').GuildMember} member
   */
  async execute(member) {
    // canal de boas-vindas (substitua pelo ID do seu canal)
    const welcomeChannel = member.guild.channels.cache.get('999608903341969468');
    if (!welcomeChannel) return;

    // Embed de boas-vindas
    const embed = new EmbedBuilder()
      .setColor('#00BFFF')
      .setTitle(`👋 Bem-vindo(a)!`) // TÍTULO SEM MENÇÃO
      .setDescription(
        `Seja muito bem-vindo(a) ao **${member.guild.name}**!\n\n` +
        `Dê uma olhada em nossos canais básicos abaixo e aproveite:`
      )
      .addFields(
        { name: '📜 Libere o seu acesso', value: 'Libere o seu acesso em <#998443712998817842>', inline: true },
        { name: '🤖 Suporte', value: 'Tem dúvidas? Peça ajuda em <#1023064767298019348>', inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: `Somos agora ${member.guild.memberCount} membros!` })
      .setTimestamp();

    // Botões com links úteis
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Site Oficial/UCP')
        .setStyle(ButtonStyle.Link)
        .setURL('https://brasilplayshox.com.br/')
    );

    // Envia no canal → MENÇÃO NO CONTENT
    await welcomeChannel.send({
      content: `👋 Bem-vindo(a), <@${member.id}>!`, // <- menção 100% clicável e com notificação
      embeds: [embed],
      components: [row],
    });
  },
};
