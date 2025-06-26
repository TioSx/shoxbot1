/**
 * Slash command /historicoanuncios
 * Lista os últimos anúncios enviados
 */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('historicoanuncios')
    .setDescription('Veja o histórico de anúncios enviados.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const Anuncio = interaction.client.database.Anuncio;
    const rows = await Anuncio.find().sort({ data: -1 }).limit(10);

    if (!rows.length)
      return interaction.reply({ content: 'Nenhum anúncio encontrado!', ephemeral: true });

    for (const anuncio of rows) {
      let desc = anuncio.mensagem.length > 180 ? anuncio.mensagem.slice(0, 180) + '...' : anuncio.mensagem;

      const embed = new EmbedBuilder()
        .setTitle(anuncio.titulo || 'Mensagem Pura')
        .setDescription(desc)
        .addFields(
          { name: 'Tipo', value: anuncio.tipo, inline: true },
          { name: 'Data', value: `<t:${Math.floor(anuncio.data.getTime() / 1000)}:F>`, inline: true },
          { name: 'Canal', value: `<#${anuncio.canal_id}>`, inline: true }
        )
        .setFooter({ text: `ID: ${anuncio._id} | Autor: <@${anuncio.autor_id}>` })
        .setColor(0x8e44ad);

      await interaction.user.send({ embeds: [embed] });
    }

    await interaction.reply({ content: 'Enviei os últimos anúncios no seu DM!', ephemeral: true });
  }
};
