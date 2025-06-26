module.exports = {
    id: "ticket-add-role",

    async execute(interaction, args) {
        const role = interaction.values[0]; // ID do cargo selecionado

        await interaction.channel.permissionOverwrites.edit(role, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
        });

        return interaction.reply({
            content: `✅ | O cargo <@&${role}> foi adicionado a este ticket!`,
            ephemeral: true,
        });
    },
};
