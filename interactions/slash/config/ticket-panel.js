const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");

/**
 * @type {import('../../../typings').SlashInteractionCommand}
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("ticket")
		.setDescription(
			"🎫 | Cria o painel de tickets"
		)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute(interaction) {
		await interaction.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("Purple")
                    .setTitle("🎫 | Sistema de Tickets")
                    .setDescription("Precisa de ajuda? Esse é o lugar certo, basta clicar no botão abaixo.\n- Será criado um canal para que você possa se comunicar diretamente com a nossa Staff.\n- Após isso, basta escrever o seu problema no respectivo canal, envia-lo e aguardar.\n- Seja direto e objetivo em suas questões para que possamos fornecer um atendimento claro e eficiente.")
                    .setFooter({
                        text: `Brasil Play Shox`
                    })
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(JSON.stringify({ id: "ticket" }))
                            .setLabel("Solicitar Suporte")
                            .setStyle(ButtonStyle.Success)
                    )
            ]
        });

        await interaction.reply({
            content: "🎫 | Painel de Tickets criado com sucesso!",
            ephemeral: true
        });

        return;
	},
};
