const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
// Helper de consultas ao banco de dados SQL (asyncQuery), não é necessário acesso manual ao DB
const { asyncQuery } = require('../../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sorteios-ativos')
    .setDescription('Exibe todos os sorteios ativos nos canais de sorteio configurados'),

  async execute(interaction) {
    // Evita timeout enquanto buscamos dados
    await interaction.deferReply({ ephemeral: true });

    // Timestamp atual em segundos
    const now = Math.floor(Date.now() / 1000);

    /*
      Sem acesso manual ao banco, filtramos pelos canais onde os sorteios são enviados.
      Preencha essa lista com os IDs dos canais de sorteio em cada servidor.
    */
    const giveawayChannels = [
      '815031179039735839', // Servidor principal
      '1287494030552203395', // servidor 1
      '1267646004765790280', // Servidor 1 Sorteio familias
      '1287498455194931211', // servidor 2
      '1127413500856254494', // servidor 3
      '1287500984808902821'  // servidor 4
    ];

    // Cria placeholders para cada canal na consulta
    const placeholders = giveawayChannels.map(() => '?').join(',');

    // Query SQL: busca todos os sorteios ativos por canal_id e timestamp
    const sql = `
      SELECT *
      FROM giveaway
      WHERE channel_id IN (${placeholders})  -- canais de sorteio
        AND ended = 0                        -- não cancelados
        AND endsAt > ?                       -- ainda não finalizados
    `;

    // Executa a query usando asyncQuery e recebe um array de objetos
    const giveaways = await asyncQuery(sql, 'return', [...giveawayChannels, now]);

    // Se não houver resultados, avisa no Discord
    if (!giveaways.length) {
      return interaction.editReply('Não há sorteios ativos nos canais configurados.');
    }

    // Monta um embed para listar todos os sorteios ativos
    const embed = new EmbedBuilder()
      .setTitle('🎉 Sorteios Ativos')
      .setColor('Purple')
      .setTimestamp();

    // Adiciona cada sorteio como um campo no embed
    giveaways.forEach(g => {
      embed.addFields({
        name: g.title,
        value: `Prêmio: **${g.prize}**\nCanal: <#${g.channel_id}>\nTermina: <t:${g.endsAt}:R>`
      });
    });

    // Envia o embed atualizado ao usuário
    await interaction.editReply({ embeds: [embed] });
  }
};
