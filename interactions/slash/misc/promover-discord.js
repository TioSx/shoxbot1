// commands/promover-discord.js

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const logPromocaoDemissao = require('../../../util/logStaffPromocaoDemissao');

const cargosStaff = {
  'Admin. Discord': { roleId: '668262641789173767', prefix: '[Admin. Discord]' },
  'Admin. Aprendiz': { roleId: '1203386767819022436', prefix: '[Admin. Aprendiz]' },
  'Mod. Discord': { roleId: '767768014107836458', prefix: '[Mod. Discord]' },
  'Mod. Discord Aprendiz': { roleId: '824442559072960553', prefix: '[Mod. Discord Aprendiz]' }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promover-discord')
    .setDescription('Promove um membro da staff de Discord.')
    // restringe quem pode usar o comando a quem tem Gerenciar Canais
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
    .addUserOption(o =>
      o.setName('user')
       .setDescription('Membro para promover')
       .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('cargo')
       .setDescription('Cargo de destino')
       .setRequired(true)
       .addChoices(...Object.keys(cargosStaff).map(c => ({ name: c, value: c })))
    )
    .addStringOption(o =>
      o.setName('motivo')
       .setDescription('Motivo da promoção')
       .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // 1️⃣ Checa permissão de quem executa
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.editReply('❌ Você precisa de permissão para usar este comando.');
    }

    const botMember = interaction.guild.members.me;
    // 2️⃣ Checa permissão do bot para gerenciar cargos
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.editReply('❌ Preciso de permissão **Manage Roles** para executar esta ação.');
    }

    // 3️⃣ Fetch garantido do membro
    const userId = interaction.options.getUser('user').id;
    let member;
    try {
      member = await interaction.guild.members.fetch(userId);
    } catch (err) {
      console.error('Fetch member failed:', err);
      return interaction.editReply('❌ Não consegui encontrar esse membro no servidor.');
    }

    // 4️⃣ Checa hierarquia
    if (botMember.roles.highest.position <= member.roles.highest.position) {
      return interaction.editReply(
        '❌ Não posso modificar cargos deste usuário (hierarquia igual ou superior).'
      );
    }

    const cargoNome = interaction.options.getString('cargo');
    const motivo = interaction.options.getString('motivo') || 'Motivo não especificado.';
    const { roleId, prefix } = cargosStaff[cargoNome];
    const todosCargos = Object.values(cargosStaff).map(c => c.roleId);

    // 5️⃣ Ajusta cargos
    try {
      await member.roles.remove(todosCargos);
      await member.roles.add(roleId);
    } catch (err) {
      console.error('Erro ao ajustar cargos:', err);
      return interaction.editReply(
        '❌ Falha ao ajustar cargos. Verifique hierarquia e permissão **Manage Roles**.'
      );
    }

    // 6️⃣ Tenta alterar nickname
    if (botMember.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
      const nomeLimpo = member.displayName.replace(/^\[.*?\]\s*/, '');
      try {
        await member.setNickname(`${prefix} ${nomeLimpo}`);
      } catch (err) {
        console.warn('Não foi possível alterar nickname:', err);
        await interaction.followUp({
          content:
            '⚠️ Cargo atualizado, mas não consegui alterar o nickname devido a restrições do Discord.',
          ephemeral: true
        });
      }
    }

    // 7️⃣ Log de promoção
    logPromocaoDemissao(interaction.guild, {
      member,
      staffMember: interaction.member,
      tipo: 'PROMOCAO',
      cargoAntigo: 'Antigo (removido)',
      cargoNovo: cargoNome,
      motivo
    }).catch(err => console.error('Erro no logPromocaoDemissao:', err));

    // 8️⃣ Resposta final
    return interaction.editReply(`✅ ${member} foi promovido para **${cargoNome}**!`);
  }
};
