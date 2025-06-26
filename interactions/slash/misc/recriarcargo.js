const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logStaff = require('../../../util/logStaff.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recriarcargo')
        .setDescription('Exclui e recria um cargo igual (para limpar todos os membros de uma vez)')
        .addRoleOption(option =>
            option.setName('cargo')
                .setDescription('Cargo que será excluído e recriado')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false),
    global: true,

    async execute(interaction) {
        try {
            const role = interaction.options.getRole('cargo');
            if (!role) return interaction.reply({ content: 'Cargo não encontrado.', ephemeral: true });

            if (role.managed || role.id === interaction.guild.id) {
                return interaction.reply({ content: 'Esse cargo não pode ser recriado (cargo de bot, integração ou padrão).', ephemeral: true });
            }

            const botMember = await interaction.guild.members.fetchMe();
            if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return interaction.reply({ content: 'Eu preciso da permissão "Gerenciar Cargos" para fazer isso!', ephemeral: true });
            }
            if (role.position >= botMember.roles.highest.position) {
                return interaction.reply({ content: 'Não posso editar esse cargo, pois ele está igual ou acima do meu cargo mais alto.', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            // Armazena as propriedades do cargo
            const props = {
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                mentionable: role.mentionable,
                permissions: role.permissions,
                position: role.position
            };

            // Remove o cargo original
            await role.delete('Comando /recriarcargo — limpeza completa de membros');

            // Cria um novo igual (posição pode variar um pouco)
            const newRole = await interaction.guild.roles.create({
                name: props.name,
                color: props.color,
                hoist: props.hoist,
                mentionable: props.mentionable,
                permissions: props.permissions,
                reason: 'Recriação do cargo via /recriarcargo'
            });

            // Tenta mover para a posição original (nem sempre é exata por limitações do Discord)
            await newRole.setPosition(props.position);

            // Log de staff
            await logStaff(interaction.client, {
                guild: interaction.guild,
                userStaff: interaction.user,
                action: 'Cargo recriado',
                targetUser: null,
                details: `Cargo antigo: ${props.name} (${props.position})\nNovo ID: ${newRole.id}`
            });

            await interaction.editReply({
                content: `Cargo **${props.name}** excluído e recriado com sucesso!\n` +
                         `Agora ninguém mais tem esse cargo. Adicione aos membros novamente se quiser.`
            });

        } catch (err) {
            console.error('Erro no /recriarcargo:', err);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'Erro inesperado: ' + err.message });
            } else {
                await interaction.reply({ content: 'Erro inesperado: ' + err.message, ephemeral: true });
            }
        }
    }
};
