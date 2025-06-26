const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ActionRowBuilder,
	StringSelectMenuBuilder,
} = require("discord.js");

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("anunciar")
		.setDMPermission(false)
		.setDescription("📢 | Anunciar algo em um canal")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	global: true,

	async execute(interaction) {
		return interaction.reply({
			components: [
				new ActionRowBuilder().setComponents(
					new StringSelectMenuBuilder()
						.setCustomId(
							JSON.stringify({ id: "announce", user: interaction.user.id })
						)
						.setPlaceholder("Selecione uma opção")
						.addOptions(
							{
								label: "Conteúdo da mensagem",
								value: "message",
								description: "Muda a mensagem, pode ser usada para marcações",
								emoji: "📝",
							},
							{
								label: "Embeds",
								value: "embeds",
								description: "Menu para gerenciar as embeds",
								emoji: "📰",
							},
							{
								label: "Links",
								value: "links",
								description: "Menu para gerenciar os botões de links",
								emoji: "🔗",
							},
							{
								label: "Enviar",
								value: "send",
								description: "Envia a mensagem",
								emoji: "✅",
							}
						)
				),
			],
		});
	},
};
