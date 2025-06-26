const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");

/**
 * @type {import('../../../typings').SlashInteractionCommand}
*/
module.exports = {
	data: new SlashCommandBuilder()
		.setName("absence")
		.setDescription(
			"🕒 | Cria o painel de ausência"
		)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    global: true,

	async execute(interaction) {
		await interaction.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("Blue")
                    // .setAuthor({ name: "Painel destinado para notificar ausências." })
                    .setTitle("🕒 | Solicitar Ausência")
                    .setThumbnail("https://cdn.discordapp.com/icons/656244004609851455/a_2c72393a0f972c7970c5871150704a62.gif")
                    .setDescription("Painel destinado a notificar ausências.\n### COMO SOLICITAR UMA AUSÊNCIA?\n- Clique no botão \"Solicitar Ausência\".\n- Preencha o formulário com os campos requiridos.")
                    .setFooter({
                        iconURL: "https://cdn.discordapp.com/icons/656244004609851455/a_2c72393a0f972c7970c5871150704a62.gif",
                        text: `Brasil Play Shox`
                    })
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(JSON.stringify({ id: "absence" }))
                            .setLabel("Solicitar Ausência")
                            .setEmoji("🕒")
                            .setStyle(ButtonStyle.Primary)
                    )
            ]
        });

        await interaction.reply({
            content: "🕒 | Painel de Ausência criado com sucesso!",
            ephemeral: true
        });

        return;
	},
};
