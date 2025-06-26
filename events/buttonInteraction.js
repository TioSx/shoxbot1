/**
 * @file Button Interaction Handler
 * @author Naman Vrati
 * @since 3.0.0
 * @version 3.3.1
 */

const { InteractionType, ComponentType } = require("discord-api-types/v10");

module.exports = {
	name: "interactionCreate",

	/**
	 * @description Executes when an interaction is created and handle it.
	 * @author Naman Vrati
	 * @param {import('discord.js').ButtonInteraction & { client: import('../typings').Client }} interaction The interaction which was created
	 */

	async execute(interaction) {
		// Deconstructed client from interaction object.
		const { client } = interaction;

		// Checks if the interaction is a button interaction (to prevent weird bugs)

		if (!interaction.isButton()) return;

		try {
			let args;
			try {
				args = JSON.parse(interaction.customId);
			} catch (err) {
				return;
			}

			const command = client.buttonCommands.get(args.id);

			// If the interaction is not a command in cache, return error message.
			// You can modify the error message at ./messages/defaultButtonError.js file!

			if (!command) return;

			// A try to execute the interaction.

			await command.execute(interaction, args);
			return;
		} catch (err) {
			console.error(err);
			await interaction
				.reply({
					content: "Houve um problema ao executar a ação desse botão!",
					ephemeral: true,
				})
				.catch(async () => {
					await interaction
						.followUp({
							content: "Houve um problema ao executar a ação desse botão!",
							ephemeral: true,
						})
						.catch(() => {});
				});
			return;
		}
	},
};
