const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Ticket = require(`${process.cwd()}/database/models/ticketActions.js`);
const staffNotas = require(`${process.cwd()}/database/models/staffNotas.js`);

function getSafeDate(ticket) {
    if (ticket.createdAt) {
        // Tenta converter DD/MM/YYYY HH:mm
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?/;
        const match = regex.exec(ticket.createdAt);
        if (match) {
            const [ , day, month, year, hour = '00', min = '00' ] = match;
            // JavaScript: mês começa do zero!
            return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min));
        }
        // Se não casar, tenta criar a partir do valor puro
        const data = new Date(ticket.createdAt);
        if (!isNaN(data.getTime())) return data;
    }
    if (ticket._id && ticket._id.getTimestamp) return ticket._id.getTimestamp();
    return new Date(0);
}

function parseMembers(members) {
    if (Array.isArray(members)) return members;
    if (typeof members === 'string') {
        try { return JSON.parse(members); }
        catch { return members.replace(/[\[\]'"]/g, '').split(',').map(s => s.trim()).filter(Boolean); }
    }
    if (typeof members === 'object' && members !== null) {
        return Object.values(members).map(s => String(s));
    }
    return [];
}

function parseStaff(staff) {
    if (Array.isArray(staff)) return staff;
    if (typeof staff === 'string') {
        try { return JSON.parse(staff); }
        catch { return staff.replace(/[\[\]'"]/g, '').split(',').map(s => s.trim()).filter(Boolean); }
    }
    if (typeof staff === 'object' && staff !== null) {
        return Object.values(staff).map(s => String(s));
    }
    return [];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meus-tickets')
        .setDescription('Veja o histórico dos seus tickets fechados')
        .setDMPermission(false),
    global: true,

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const userId = String(interaction.user.id).trim();

        // Busca todos os tickets fechados
        const allTickets = await Ticket.find({ opened: false });

        // Filtro: tickets em que você participou de alguma forma
        const tickets = allTickets.filter(t => {
            const membersArr = parseMembers(t.members);
            const staffArr = parseStaff(t.staff);
            return (
                membersArr.includes(userId) ||
                staffArr.includes(userId) ||
                (t.closedBy && String(t.closedBy).trim() === userId) ||
                (t.user_id && String(t.user_id).trim() === userId)
            );
        });

        if (!tickets || tickets.length === 0) {
            return interaction.editReply({ content: 'Você não participou de nenhum ticket fechado.', ephemeral: true });
        }

        // Ordena do mais recente para o mais antigo
        const sorted = tickets.sort((a, b) => getSafeDate(b) - getSafeDate(a));
        const chunkSize = 5;
        const grouped = [];
        for (let i = 0; i < sorted.length; i += chunkSize) {
            grouped.push(sorted.slice(i, i + chunkSize));
        }

        let currentPage = 0;

        async function getEmbedAndButtons(page) {
            const group = grouped[page];
            let desc = '';
            let transcriptButtons = [];

            for (const ticket of group) {
                // Prepara info
                const departamento = ticket.department || '_desconhecido_';
                const server = ticket.server ? `S${ticket.server}` : '_desconhecido_';
                const assumido = (parseStaff(ticket.staff) || [])
                    .filter(id => id && id !== 'none')
                    .map((id, idx) => `\`${idx + 1}\` <@${id}>`).join('\n') || 'Ninguém';

                let fechadoPor = '';
                if (ticket.closedBy) {
                    fechadoPor = `Fechado por: <@${ticket.closedBy}>`;
                }

                let dataUnix;
                const safeDate = getSafeDate(ticket);
                if (safeDate && !isNaN(safeDate.getTime())) {
                    dataUnix = Math.floor(safeDate.getTime() / 1000);
                } else {
                    dataUnix = null;
                }

                // Notas (se tiver)
                let nota = 'N/A';
                let comentario = '';
                if (staffNotas && ticket.channel_id) {
                    const notaDoc = await staffNotas.findOne({ 'Nota.Channel': ticket.channel_id, 'Nota.Who': userId });
                    if (notaDoc) {
                        const notaItem = notaDoc.Nota.find(n => n.Channel === ticket.channel_id && n.Who === userId);
                        if (notaItem) {
                            nota = notaItem.Nota;
                            comentario = notaItem.Comentario;
                        }
                    }
                }

                // Monta descrição do ticket
                desc +=
`**#${ticket.id}** | ${server} | Departamento: ${departamento}
Assumido por:
${assumido}
${fechadoPor}
${dataUnix ? `Data: <t:${dataUnix}:F>` : 'Data: _desconhecida_'}
Avaliação: **${nota}**${comentario ? ` — "${comentario}"` : ''}
${ticket.transcriptUrl && ticket.transcriptUrl.startsWith('http') ? `\n[Baixar Transcript](<${ticket.transcriptUrl}>)` : ''}
\n`;

                // Botão do transcript (se tiver)
                if (
                    ticket.transcriptUrl &&
                    typeof ticket.transcriptUrl === 'string' &&
                    ticket.transcriptUrl.startsWith('http')
                ) {
                    transcriptButtons.push(
                        new ButtonBuilder()
                            .setURL(ticket.transcriptUrl)
                            .setLabel(`Baixar Transcript #${ticket.id}`)
                            .setStyle(ButtonStyle.Link)
                    );
                }
            }

            // Botões de paginação
            const paginationButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('Anterior')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Próximo')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page >= grouped.length - 1)
            );

            const actionRows = [];
            for (let i = 0; i < transcriptButtons.length; i += 5) {
                actionRows.push(new ActionRowBuilder().addComponents(transcriptButtons.slice(i, i + 5)));
            }
            if (grouped.length > 1) actionRows.push(paginationButtons);

            return {
                embed: new EmbedBuilder()
                    .setColor(0x7f5af0)
                    .setTitle('Seus Tickets Fechados')
                    .setDescription(desc)
                    .setFooter({ text: `Página ${page + 1} de ${grouped.length}` }),
                components: actionRows
            };
        }

        let { embed, components } = await getEmbedAndButtons(currentPage);

        await interaction.editReply({
            embeds: [embed],
            components,
            ephemeral: true
        });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i =>
                (['prev_page', 'next_page'].includes(i.customId) && i.user.id === interaction.user.id),
            time: 60000,
        });

        collector.on('collect', async i => {
            if (i.customId === 'next_page' && currentPage < grouped.length - 1) {
                currentPage++;
                let { embed: newEmbed, components: newComponents } = await getEmbedAndButtons(currentPage);
                await i.update({ embeds: [newEmbed], components: newComponents, ephemeral: true });
            } else if (i.customId === 'prev_page' && currentPage > 0) {
                currentPage--;
                let { embed: newEmbed, components: newComponents } = await getEmbedAndButtons(currentPage);
                await i.update({ embeds: [newEmbed], components: newComponents, ephemeral: true });
            }
        });
    }
};
