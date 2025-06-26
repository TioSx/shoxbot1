const {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
} = require("discord.js");

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "fdbk",

	/**@param {import("discord.js").ButtonInteraction} interaction  */
	async execute(interaction, args) {

		const modal = new ModalBuilder()
			.setTitle("Inserir comentário")
			// Since discord limits the characters for custom id up to 100.
            // the string values were abrevieted, they are s = star, u = userId, p = parentId, c = channelId
			.setCustomId(JSON.stringify({ id: "fdModal", s: args.s, u: args.u, p: args.p, c: args.c, }))
			.setComponents(
				new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setStyle(2)
						.setCustomId("fdbk")
						.setMaxLength(300)
						.setLabel("Comentário")
						.setRequired(false)
						.setPlaceholder("Insira um comentário sobre como foi seu atendimento")
				)
			);

		interaction.showModal(modal);
	},
};
