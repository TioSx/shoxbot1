const {
  StringSelectMenuInteraction,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const Ticket = require(`${process.cwd()}/database/models/ticketActions.js`);

/**
 * @type {import('../../../typings').SelectInteractionCommand}
 */
module.exports = {
  id: "ticket",

  /**
   *
   * @param {StringSelectMenuInteraction} interaction
   */
  async execute(interaction, args) {
    const selected = interaction.values[0];

    const ticket = await Ticket.findOne({
      members: [interaction.user.id],
      server: args.server,
      opened: true,
    });

    if (ticket) {
      const channel = interaction.guild.channels.cache.get(ticket.channel_id);

      if (channel) {
        await interaction.reply({
          content: `🎫 | Você já possui um ticket aberto em ${channel}`,
          ephemeral: true,
        });
        return;
      }

      await Ticket.updateOne({ id: ticket.id }, { opened: true });
    }

    await interaction.showModal(
      new ModalBuilder()
        .setTitle(`Ticket Brasil Play Shox - ${selected}`)
        .setCustomId(
          JSON.stringify({
            id: "ticket",
            server: args.server,
            department: selected,
          })
        )
        .setComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("nickname")
              .setLabel("INFORME SEU NICK EXATO UTILIZADO")
              .setRequired(true)
              .setStyle(TextInputStyle.Short)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("problem")
              .setLabel("INFORME O SEU PROBLEMA")
              .setRequired(true)
              .setStyle(TextInputStyle.Paragraph)
              .setMaxLength(300)
              .setMinLength(10)
          )
        )
    );
  },
};
