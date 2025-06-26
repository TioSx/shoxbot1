const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits } = require("discord.js");
const moment = require('moment');
const staffNotas = require(`${process.cwd()}/database/models/staffNotas.js`);
const Ticket = require(`${process.cwd()}/database/models/ticketActions.js`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("media-staff")
        .setDMPermission(false)
        .setDescription("⭐ | Vê a média de notas de um staffer")
        .addUserOption(option =>
            option.setName("staff")
                .setDescription("Usuário que você deseja ver a média.")
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    global: true,

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const staff = interaction.options.getUser("staff");
        const db = await staffNotas.findOne({ GuildID: interaction.guild.id, StaffID: staff.id });
        if (!db) return interaction.editReply({ content: "Este usuário não possui nenhuma avaliação.", ephemeral: true });

        // Ranking (posição global)
        const todosStaffs = await staffNotas.find({ GuildID: interaction.guild.id });
        const stats = todosStaffs.map(s => ({
            StaffID: s.StaffID,
            totalTickets: s.Nota.length,
            mediaGlobal: s.Nota.length
                ? (s.Nota.reduce((sum, n) => sum + n.Nota, 0) / s.Nota.length)
                : 0
        }));
        const ranking = [...stats].sort((a, b) => b.totalTickets - a.totalTickets);
        const posicao = ranking.findIndex(s => s.StaffID === staff.id) + 1;

        // Total geral
        const totalNotas = db.Nota.length;
        const somaNotas = db.Nota.reduce((total, nota) => total + nota.Nota, 0);
        const media = (somaNotas / totalNotas).toFixed(2);

        // Por servidor
        const porServidor = {};
        [1, 2, 3, 4].forEach(num => {
            const avaliacoes = db.Nota.filter(n => n.Servidor === num);
            porServidor[num] = {
                tickets: avaliacoes.length,
                media: avaliacoes.length
                    ? (avaliacoes.reduce((s, n) => s + n.Nota, 0) / avaliacoes.length).toFixed(2)
                    : "N/A"
            };
        });

        // 30 dias
        const thirtyDaysAgo = moment().subtract(30, 'days');
        const notas30Dias = db.Nota.filter(nota => moment(nota.When).isAfter(thirtyDaysAgo));
        const totalNotas30Dias = notas30Dias.length;
        const somaNotas30Dias = notas30Dias.reduce((total, nota) => total + nota.Nota, 0);
        const media30Dias = totalNotas30Dias ? (somaNotas30Dias / totalNotas30Dias).toFixed(2) : 'N/A';

        // Tickets Repetidos
        const ticketsRepetidos = db.Nota.filter(nota => nota.Who === staff.id).length;
        const ticketsRepetidos30Dias = notas30Dias.filter(nota => nota.Who === staff.id).length;

        // Últimas avaliações
        const ultimas = db.Nota
            .sort((a, b) => b.When - a.When)
            .slice(0, 5)
            .map((n, i) => `#${i + 1}: Nota **${n.Nota}** – ${moment(n.When).format('DD/MM/YYYY')}`);

        // Embed principal
        const embed = {
            color: 0x9C59B6,
            author: { name: `${staff.globalName} | Perfil de Avaliações` },
            thumbnail: { url: staff.displayAvatarURL({ dynamic: true }) },
            description:
                `**Posição no ranking:** #${posicao}\n` +
                `**Tickets totais:** \`${totalNotas}\`\n` +
                `**Média geral:** \`${media}\`\n\n` +
                `[ S1: \`${porServidor[1].tickets}\` tickets | Média: \`${porServidor[1].media}\` ]\n` +
                `[ S2: \`${porServidor[2].tickets}\` tickets | Média: \`${porServidor[2].media}\` ]\n` +
                `[ S3: \`${porServidor[3].tickets}\` tickets | Média: \`${porServidor[3].media}\` ]\n` +
                `[ S4: \`${porServidor[4].tickets}\` tickets | Média: \`${porServidor[4].media}\` ]\n\n` +
                `# 30 Dias:\n` +
                `:star: | Média: \`${media30Dias}\`\n` +
                `🎟️ | Tickets: \`${totalNotas30Dias}\`\n` +
                `🎫 | Tickets Repetidos: \`${ticketsRepetidos30Dias}\`\n\n` +
                `# Últimas avaliações:\n` +
                (ultimas.length ? ultimas.join('\n') : "Nenhuma avaliação ainda.")
        };

        await interaction.editReply({
            embeds: [embed],
            components: [
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            custom_id: 'comentarios',
                            label: `O que falam sobre ${staff.globalName}?`,
                            style: 1
                        })
                    ]
                })
            ],
        });

        // Paginação de comentários
        const notas = db.Nota;
        const groupedNotas = groupArrayIntoChunks(notas, 5);
        let currentPage = 0;

        const filter = (button) => {
            return button.customId === 'comentarios' || button.customId === 'previous' || button.customId === 'next';
        };

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (button) => {
            try {
                await button.deferUpdate();

                if (button.customId === 'comentarios') {
                    currentPage = 0;
                }
                if (button.customId === 'previous') {
                    currentPage = Math.max(0, currentPage - 1);
                } else if (button.customId === 'next') {
                    currentPage = Math.min(groupedNotas.length - 1, currentPage + 1);
                }

                await sendPage(button, currentPage, groupedNotas, staff);
            } catch (error) {
                console.error('Error handling button interaction:', error);
            }
        });
    }
};

async function sendPage(button, currentPage, groupedItems, staff) {
    const components = [
        new ButtonBuilder({
            custom_id: 'previous',
            label: 'Anterior',
            style: 1,
            disabled: currentPage === 0,
        }),
        new ButtonBuilder({
            custom_id: 'next',
            label: 'Próximo',
            style: 1,
            disabled: currentPage === groupedItems.length - 1,
        }),
    ];

    const actionRow = new ActionRowBuilder({ components });

    const description = await getGroupDescription(groupedItems[currentPage], staff);

    const embed = {
        color: 0x9C59B6,
        title: `Notas de ${staff.globalName}`,
        description,
    };

    await button.editReply({ embeds: [embed], components: [actionRow], ephemeral: true });
}

function groupArrayIntoChunks(array, chunkSize) {
    const grouped = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        grouped.push(array.slice(i, i + chunkSize));
    }
    return grouped;
}

async function getGroupDescription(group, staff) {
    let groupDescription = '';
    for (let i = 0; i < group.length; i++) {
        const nota = group[i];
        groupDescription += `\`${i + 1}.\` - ${await formatNota(nota, staff)}\n\n`;
    }
    return groupDescription;
}

async function formatNota(nota, staff) {
    try {
        const ticket = await Ticket.findOne({ channel_id: nota.Channel });
        const transcriptUrl = ticket ? ticket.transcriptUrl : 'Sem transcript';
        return `<@${nota.Who}>\nNota: **${nota.Nota}**\nData: <t:${moment(nota.When).unix()}:F>\nComentário: ${nota.Comentario}\nTranscript: ${transcriptUrl}\n`;
    } catch (error) {
        console.error('Erro ao buscar o transcript:', error);
        return `<@${nota.Who}>\nData: <t:${moment(nota.When).unix()}:F>\nNota: **${nota.Nota}**\nComentário: ${nota.Comentario}\nTranscript: Erro ao buscar o transcript.\n`;
    }
}
