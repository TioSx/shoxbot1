const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Ticket = require(`${process.cwd()}/database/models/ticketActions.js`);

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */

module.exports = {
    id: "ticket-lock",

    /**@param {import("discord.js").ButtonInteraction} interaction  */

    async execute(interaction, args) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.MoveMembers))
            return interaction.reply({
                content: "❌ | Você não tem permissão para usar este botão.",
                ephemeral: true
        });

        try {
            const ticket = await Ticket.findOne({ channel_id: interaction.channel.id });

            if (!ticket)
                return interaction.reply({
                    content: "❌ | Este canal não é um ticket.",
                    ephemeral: true,
                });

            if (ticket.locked === true) {
                return interaction.reply({
                    content: "ℹ️ | O ticket já está trancado.",
                    ephemeral: true,
                });
            }

            const member = await interaction.guild.members.fetch(ticket.members[0]);

            if (!member)
                return interaction.reply({
                    content: "❌ | O usuário deste ticket não está no servidor.",
                    ephemeral: true,
                });

            await Ticket.updateOne({ channel_id: interaction.channel.id }, { locked: true });

            ticket.members.forEach( async (m) => {
                const member = await interaction.guild.members.fetch(m);
                if (member.permissions.has(PermissionFlagsBits.MoveMembers)) {
                    interaction.channel.permissionOverwrites.edit(member, { SendMessages: true });
                } else {
                    interaction.channel.permissionOverwrites.edit(member, { SendMessages: false });
                }
            });

            lockedEmbed = new EmbedBuilder()
                .setDescription(`🔒 | O ticket foi trancado por <@${interaction.member.id}>`)
                .setColor("Purple");

            interaction.reply({ embeds: [lockedEmbed] });

        } catch (error) {
            console.error("Error locking ticket:", error);
            interaction.reply({ content: "❌ | Ocorreu um erro ao tentar trancar o ticket.", ephemeral: true });
        }
    },
};