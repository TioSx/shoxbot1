const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Ticket = require(`${process.cwd()}/database/models/ticketActions.js`);

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */

module.exports = {
    id: "ticket-redeem",

    /**@param {import("discord.js").ButtonInteraction} interaction  */
    async execute(interaction, args) {
        try {
            const ticket = await Ticket.findOne({ channel_id: interaction.channel.id });

            if (!ticket) {
                return interaction.reply({
                    content: "❌ | Ticket não encontrado na database.",
                    ephemeral: true,
                });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.MoveMembers)) {
                return interaction.reply({
                    content: "❌ | Você não tem permissão para usar este botão.",
                    ephemeral: true,
                });
            }

            let staffList = Array.isArray(ticket.staff) ? ticket.staff : (ticket.staff ? [ticket.staff] : []);
            let assumiu = false;
            if (!staffList.includes(interaction.user.id)) {
                staffList.push(interaction.user.id);
                await Ticket.updateOne({ channel_id: interaction.channel.id }, { staff: staffList });
                assumiu = true;
            }

            const RedeemEmbed = new EmbedBuilder()
                .setDescription(`⚜️ | O staff <@${interaction.user.id}> assumiu o ticket e será o responsável por lhe atender.`)
                .setColor("Purple");

            await interaction.channel.send({ embeds: [RedeemEmbed] });
            await interaction.channel.send({ content: `Seja bem-vindo ao suporte **BRASIL PLAY SHOX**. Me chamo ${interaction.user.globalName || interaction.user.username} e irei lhe auxiliar no seu ticket.` });

            return interaction.reply({
                content: assumiu
                    ? '✅ | Você agora é um dos responsáveis por esse ticket.'
                    : 'ℹ️ | Você já havia assumido esse ticket.',
                ephemeral: true
            });
        } catch (error) {
            console.error("Erro ao assumir ticket:", error);
            return interaction.reply({
                content: "❌ | Ocorreu um erro ao tentar assumir o ticket.",
                ephemeral: true,
            });
        }
    },
};