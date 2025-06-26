/**
 * @file Select Menu Interaction Handler
 * @author Naman Vrati
 * @since 3.0.0
 * @version 3.3.1
 */

module.exports = {
	name: "interactionCreate",

	/**
	 * @description Executes when an interaction is created and handle it.
	 * @author Naman Vrati
	 * @param {import('discord.js').SelectMenuInteraction & { client: import('../typings').Client }} interaction The interaction which was created
	 */

	async execute(interaction) {
		// Deconstructed client from interaction object.
		const { client } = interaction;

		// Checks if the interaction is a select menu interaction (to prevent weird bugs)

		if (!interaction.isAnySelectMenu()) return;

		try {
			const args = JSON.parse(interaction.customId);

			const command = client.selectCommands.get(args.id);

			if (!command) return;

			// A try to execute the interaction.

			await command.execute(interaction, args);
			return;
		} catch (err) {
			console.error(err);
			await interaction
				.reply({
					content: "Houve um problema ao executar a ação desse menu!",
					ephemeral: true,
				})
				.catch(async () => {
					await interaction
						.followUp({
							content: "Houve um problema ao executar a ação desse menu!",
							ephemeral: true,
						})
						.catch(() => {});
				});
			return;
		}
	},
};
