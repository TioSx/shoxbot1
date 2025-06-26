/**
 * @file Modal Interaction Handler
 * @author Naman Vrati
 * @since 3.2.0
 * @version 3.3.1
 */

const { InteractionType } = require("discord-api-types/v10");

module.exports = {
  name: "interactionCreate",

  /**
   * @description Executes when an interaction is created and handles it.
   * @param {import('discord.js').Interaction & { client: import('../typings').Client }} interaction
   */
  async execute(interaction) {
    const { client } = interaction;

    // Apenas tratamos submits de modal
    if (!interaction.isModalSubmit()) return;

    // Ignora o modal de ausência (é tratado no listener global do bot.js)
    if (interaction.customId === "ausencia_modal") {
      return;
    }

    // Para os outros modais, esperamos customId em JSON: { id: '...', ... }
    let args;
    try {
      args = JSON.parse(interaction.customId);
    } catch (err) {
      // Não é um modal nosso serializado, ignora
      return;
    }

    const command = client.modalCommands.get(args.id);
    if (!command) return;

    try {
      await command.execute(interaction, args);
    } catch (err) {
      console.error(err);
      // Tenta responder ao usuário que houve um erro
      try {
        await interaction.reply({
          content: "Houve um problema ao executar a ação desse modal!",
          ephemeral: true,
        });
      } catch {
        await interaction.followUp({
          content: "Houve um problema ao executar a ação desse modal!",
          ephemeral: true,
        });
      }
    }
  },
};
