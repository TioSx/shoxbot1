// commands/demitir-discord.js

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const logPromocaoDemissao = require('../../../util/logStaffPromocaoDemissao');

const cargosStaff = {
  'Admin. Discord': '668262641789173767',
  'Admin. Aprendiz': '1203386767819022436',
  'Mod. Discord': '767768014107836458',
  'Mod. Discord Aprendiz': '824442559072960553'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('demitir-discord')
    .setDescription('Demite um membro da staff de Discord.')
    // restringe quem vê / pode usar o comando a quem tem ManageChannels
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
    .addUserOption(o =>
      o.setName('user')
       .setDescription('Membro para demitir')
       .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('motivo')
       .setDescription('Motivo da demissão')
       .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // 1️⃣ Checa se quem executa tem ManageChannels
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

    const motivo = interaction.options.getString('motivo');

    // 4️⃣ Checa hierarquia
    if (botMember.roles.highest.position <= member.roles.highest.position) {
      return interaction.editReply(
        '❌ Não posso demitir este usuário porque ele está em um cargo igual ou superior ao meu.'
      );
    }

    // 5️⃣ Remover todos os cargos de staff
    const todosCargos = Object.values(cargosStaff);
    try {
      await member.roles.remove(todosCargos);
    } catch (err) {
      console.error('Erro ao remover cargos:', err);
      return interaction.editReply(
        '❌ Falha ao remover cargos de staff. Verifique hierarquia e permissão Manage Roles.'
      );
    }

    // 6️⃣ Resetar nickname, se possível
    if (botMember.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
      const nomeLimpo = member.displayName.replace(/^\[.*?\]\s*/, '');
      try {
        await member.setNickname(nomeLimpo);
      } catch (err) {
        console.warn('Não foi possível resetar nickname:', err);
        await interaction.followUp({
          content: '⚠️ Cargos removidos, mas não consegui resetar o nickname devido a restrições.',
          ephemeral: true
        });
      }
    }

    // 7️⃣ Log de demissão (não bloqueia o fluxo se falhar)
    logPromocaoDemissao(interaction.guild, {
      member,
      staffMember: interaction.member,
      tipo: 'DEMISSAO',
      motivo
    }).catch(err => console.error('Erro no logPromocaoDemissao:', err));

    // 8️⃣ Resposta final
    return interaction.editReply(`✅ ${member} foi demitido da staff com sucesso!`);
  }
};
