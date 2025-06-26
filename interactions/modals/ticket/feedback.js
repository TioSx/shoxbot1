const staffNotas = require(`${process.cwd()}/database/models/staffNotas.js`);
const Ticket = require(`${process.cwd()}/database/models/ticketActions.js`);
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */

function getServidorFromParentId(parentId) {
    const map = {
        "1135015992049807450": 1, // Servidor 1
        "1135016015412088963": 2, // Servidor 2
        "1135016033833451570": 3, // Servidor 3
        "1228160127182573659": 4  // Servidor 4
    };
    return map[parentId] || null;
}

module.exports = {
    id: "fdModal",

    /**
     * @param {import("discord.js").ModalSubmitInteraction} interaction
     */
    async execute(interaction, args) {

        const { client } = interaction;
        let verifier = interaction.fields.getTextInputValue("fdbk");
        if (!verifier || verifier == '') verifier = "Nenhum comentário";

        let nota = args.s
        let staffId = args.u
        let parentId = args.p
        let channelId = args.c;

        const ticket = await Ticket.findOne({ channel_id: args.c });

        let Log = {
            "1135015992049807450": "1207030712755294278", // Servidor 1: Log 1
            "1135016015412088963": "1207030901469347911", // Servidor 2: Log 2
            "1135016033833451570": "1207031069740638239", // Servidor 3: Log 3
            "1228160127182573659": "1207031144672141382", // Servidor 4: Log 4
            "1207158017968308234": "1207027093821722624", // Discord: Log 
            "1207158225741545542": "1207027897681051658" // Forum : Log
        };

        let channelLogs = client.channels.cache.get(Log[parentId]);

        await staffNotas.findOneAndUpdate({
            GuildID: channelLogs.guild.id,
            StaffID: staffId,
        }, {
            $push: {
                Nota: {
                    Who: interaction.user.id,
                    From: parentId,
                    Channel: channelId,
                    Nota: nota,
                    Comentario: verifier,
                    When: new Date(),
                    Servidor: getServidorFromParentId(parentId), // <- CAMPO ADICIONADO!
                },
            },
        }, { upsert: true });

        interaction.reply({
            content: `${interaction.user}, o seu comentário foi enviado com sucesso!`,
            ephemeral: true
        });

        interaction.message.edit({ components: [] });

        channelLogs.send({
            embeds: [{
                title: "❤ | Nova Avaliação",
                description: `👥 | Avaliação Enviada Por:\n` +
                    `${interaction.user}\` - ${interaction.user.id}\`\n\n` +
                    `👷‍♂️ | Staffer vinculado:\n` +
                    `${client.users.cache.get(staffId)} - ${staffId}\n\n` +
                    `:star: | Nota:\n` +
                    `:star:`.repeat(nota) + ` (${nota}/5)\n\n` +
                    `📝 | Comentário:\n` +
                    `${verifier}`,
            }],
            components: [
                new ActionRowBuilder().setComponents(
                    new ButtonBuilder()
                        .setURL(ticket.transcriptUrl)
                        .setLabel("Transcrição")
                        .setStyle(ButtonStyle.Link)
                ),
            ]
        });
    },
};
