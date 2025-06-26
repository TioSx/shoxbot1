const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logStaff = require('../../../util/logStaff.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('limparcargo')
        .setDescription('Remove todos os membros de um cargo especificado')
        .addRoleOption(option =>
            option.setName('cargo')
                .setDescription('Cargo que será removido de todos os membros')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
        .setDMPermission(false),
    global: true,

    async execute(interaction) {
        try {
            const role = interaction.options.getRole('cargo');
            if (!role) return interaction.reply({ content: 'Cargo não encontrado.', ephemeral: true });

            if (role.managed || role.id === interaction.guild.id) {
                return interaction.reply({ content: 'Esse cargo não pode ser limpo (cargo de bot, integração ou padrão).', ephemeral: true });
            }

            const botMember = await interaction.guild.members.fetchMe();
            if (!botMember.permissions.has(PermissionFlagsBits.MoveMembers)) {
                return interaction.reply({ content: 'Eu preciso da permissão "Gerenciar Cargos" para fazer isso!', ephemeral: true });
            }
            if (role.position >= botMember.roles.highest.position) {
                return interaction.reply({ content: 'Não posso remover membros desse cargo, pois ele está igual ou acima do meu cargo mais alto.', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const membersWithRole = role.members;

            if (membersWithRole.size === 0) {
                return interaction.editReply({
                    content: 'Não há membros com esse cargo **no cache do bot** agora. Isso acontece em servidores grandes, pois o Discord não carrega todos os membros offline por questão de performance. ' +
                             'Para garantir a remoção total, considere excluir e recriar o cargo (use `/recriarcargo`), ou peça para os membros ficarem online antes de rodar o comando.'
                });
            }

            let sucesso = [];
            let falha = [];

            for (const [id, member] of membersWithRole) {
                if (member.roles.highest.position >= botMember.roles.highest.position) {
                    falha.push(`<@${id}> (cargo acima do bot)`);
                    continue;
                }
                try {
                    await member.roles.remove(role, 'Comando /limparcargo');
                    sucesso.push(`<@${id}>`);
                    await new Promise(res => setTimeout(res, 200));
                } catch (err) {
                    falha.push(`<@${id}> (${err.message})`);
                }
            }

            let mensagem = `✅ Removido o cargo **${role.name}** de ${sucesso.length} membro(s).`;
            if (falha.length > 0) {
                mensagem += `\n⚠️ Não consegui remover de:\n${falha.join(', ')}.`;
            }

            // Log de staff
            await logStaff(interaction.client, {
                guild: interaction.guild,
                userStaff: interaction.user,
                action: 'Limpeza de cargo',
                targetUser: null,
                details: `Cargo limpo: ${role.name} (${role.id})\nTotal removido: ${sucesso.length}\nFalhas: ${falha.length}`
            });

            await interaction.editReply({ content: mensagem });

        } catch (err) {
            console.error('Erro no /limparcargo:', err);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'Erro inesperado: ' + err.message });
            } else {
                await interaction.reply({ content: 'Erro inesperado: ' + err.message, ephemeral: true });
            }
        }
    }
};
