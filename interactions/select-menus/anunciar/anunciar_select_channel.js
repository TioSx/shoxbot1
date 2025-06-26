/**
 * Handler do menu de seleção de canal
 * Envia o anúncio e salva no MongoDB
 */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  id: 'anunciar_select_channel',
  /**
   * @param {import('discord.js').StringSelectMenuInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const selectedChannelId = interaction.values[0];
    const data = interaction.client.announcementCache?.[interaction.user.id];

    if (!data) return interaction.editReply({ content: '❌ Não encontrei os dados do anúncio, tente novamente.', ephemeral: true });

    const { tipo, titulo, mensagem, botoesText } = data;
    let embed = null;
    let botoes = [];

    // Processa botões
    if (botoesText) {
      const linhas = botoesText.split('\n');
      botoes = linhas
        .map(l => l.split('|'))
        .filter(arr => arr.length === 2)
        .map(([label, url]) => ({ label: label.trim(), url: url.trim() }));
    }

    if (tipo === 'embed' || tipo === 'botao') {
      embed = new EmbedBuilder()
        .setDescription(mensagem)
        .setColor(0x8e44ad);
      if (titulo) embed.setTitle(titulo);
      embed.setTimestamp();
    }

    let row = null;
    if (botoes.length > 0 && (tipo === 'botao' || tipo === 'embed')) {
      row = new ActionRowBuilder();
      botoes.forEach(btn => {
        row.addComponents(
          new ButtonBuilder()
            .setLabel(btn.label)
            .setStyle(ButtonStyle.Link)
            .setURL(btn.url)
        );
      });
    }

    const canal = interaction.guild.channels.cache.get(selectedChannelId);

    let msg;
    if (tipo === 'puro') {
      msg = await canal.send(mensagem);
    } else if (row) {
      msg = await canal.send({ embeds: [embed], components: [row] });
    } else {
      msg = await canal.send({ embeds: [embed] });
    }

    // Salva no MongoDB
    const Anuncio = interaction.client.database.Anuncio;
    await Anuncio.create({
      autor_id: interaction.user.id,
      tipo,
      titulo,
      mensagem,
      canal_id: canal.id,
      embed: embed ? embed.toJSON() : null,
      botoes
    });

    // Limpa cache temporário
    delete interaction.client.announcementCache[interaction.user.id];

    await interaction.editReply({ content: '✅ Anúncio enviado com sucesso!', ephemeral: true });
  },
};
