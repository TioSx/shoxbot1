const {
    ActionRowBuilder,
    PermissionFlagsBits,
    RoleSelectMenuBuilder,
} = require("discord.js");

module.exports = {
    id: "ticket-add-role",
/**@param {import("discord.js").ButtonInteraction} interaction  */    async execute(interaction, args) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.MoveMembers))
            return interaction.reply({
                content: "❌ | Você não tem permissão de adicionar cargos nesse ticket!",
                ephemeral: true,
            });

        return interaction.reply({
            content: "🔧 | Selecione o cargo que deseja adicionar ao ticket:",
            ephemeral: true,
            components: [
                new ActionRowBuilder().addComponents(
                    new RoleSelectMenuBuilder()
                        .setCustomId(JSON.stringify({ id: "ticket-add-role" }))
                        .setPlaceholder("Selecione o cargo")
                        .setMinValues(1)
                        .setMaxValues(1)
                ),
            ],
        });
    },
};
