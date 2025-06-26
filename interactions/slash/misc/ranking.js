const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const moment = require('moment');
const staffNotas = require(`${process.cwd()}/database/models/staffNotas.js`);

const cargosAdmins = {
  1: "659909981033725971",
  2: "773239011241623622",
  3: "820000868161552485",
  4: "838836670441979976"
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ranking")
        .setDescription("📊 | Apresenta o ranking de avaliações de usuários a staffs.")
        .addIntegerOption(option =>
            option.setName('servidor')
                .setDescription('Número do servidor (1, 2, 3, 4) ou deixe em branco para global')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }); // <- Garante que não vai dar timeout

        const servidor = interaction.options.getInteger('servidor');
        const thirtyDaysAgo = moment().subtract(30, 'days');
        let staffers = await staffNotas.find({ GuildID: interaction.guild.id });

        // Para servidores grandes: limitar staffers com avaliação recente
        const DIAS_UTEIS = 60; // considera os últimos 60 dias
        const LIMITE_STAFFERS = 40; // máximo de staffers processados por ranking

        if (servidor && cargosAdmins[servidor]) {
            const cargoID = cargosAdmins[servidor];
            const diasAtras = moment().subtract(DIAS_UTEIS, 'days');
            // Apenas staffers avaliados recentemente, limitando o total processado
            let recentStaffers = staffers.filter(staff => staff.Nota.some(nota => moment(nota.When).isAfter(diasAtras)));
            recentStaffers = recentStaffers.slice(0, LIMITE_STAFFERS);

            const staffersFiltrados = [];
            for (const staff of recentStaffers) {
                try {
                    const member = await interaction.guild.members.fetch(staff.StaffID).catch(() => null);
                    if (member && member.roles.cache.has(cargoID)) {
                        staffersFiltrados.push(staff);
                    }
                } catch (e) {
                    // ignora staffers que não estão mais no servidor
                }
            }
            staffers = staffersFiltrados;
        }

        const stats = staffers.map(staffer => {
            const totalTickets = staffer.Nota.length;

            const tickets30Days = staffer.Nota.filter(nota => moment(nota.When).isAfter(thirtyDaysAgo)).length;

            const allTimeAvgRating = totalTickets ?
                (staffer.Nota.reduce((sum, nota) => sum + nota.Nota, 0) / totalTickets).toFixed(1) : 0;

            const ratings30Days = staffer.Nota.filter(nota => moment(nota.When).isAfter(thirtyDaysAgo));
            const tickets30DaysTotal = ratings30Days.length;
            const avgRating30Days = tickets30DaysTotal ?
                (ratings30Days.reduce((sum, nota) => sum + nota.Nota, 0) / tickets30DaysTotal).toFixed(1) : 'N/A';

            const worstAvgRatingAllTime = totalTickets ?
                (staffer.Nota.reduce((sum, nota) => sum + nota.Nota, 0) / totalTickets).toFixed(1) : 0;

            return {
                StaffID: staffer.StaffID,
                totalTickets,
                tickets30Days,
                allTimeAvgRating,
                avgRating30Days,
                worstAvgRatingAllTime,
            };
        });

        const topTicketsAllTime = [...stats].sort((a, b) => b.totalTickets - a.totalTickets);
        const topTickets30Days = [...stats].sort((a, b) => b.tickets30Days - a.tickets30Days);

        const topAvgRating30Days = [...stats].filter(user => user.avgRating30Days !== 'N/A')
                                              .sort((a, b) => b.avgRating30Days - a.avgRating30Days);
        const topAvgRatingAllTime = [...stats].sort((a, b) => b.allTimeAvgRating - a.allTimeAvgRating);

        const worstAvgRating30Days = [...stats].filter(user => user.avgRating30Days !== 'N/A')
                                               .sort((a, b) => a.avgRating30Days - b.avgRating30Days);
        const worstAvgRatingAllTime = [...stats].sort((a, b) => a.allTimeAvgRating - b.allTimeAvgRating);

        const generateEmbed = (page = 0) => {
            const fieldsPerPage = 5;
            const start = page * fieldsPerPage;
            const end = start + fieldsPerPage;

            return {
                color: 0x9C59B6,
                title: servidor ? `📊 Ranking de Avaliações - Servidor ${servidor}` : "📊 Ranking de Avaliações (Global)",
                description: `Aqui estão os dados de avaliações do usuários aos staffs (Página ${page + 1}):`,
                fields: [
                    {
                        name: "🎟️ Mais Tickets Gerenciados (Últimos 30 dias)",
                        value: topTickets30Days.slice(start, end).map((user, index) =>
                            `\`${start + index + 1}-\` <@${user.StaffID}> - ${user.tickets30Days} tickets`).join("\n") || "Sem dados",
                    },
                    {
                        name: "🎟️ Mais Tickets Gerenciados (Todo Tempo)",
                        value: topTicketsAllTime.slice(start, end).map((user, index) =>
                            `\`${start + index + 1}-\` <@${user.StaffID}> - ${user.totalTickets} tickets`).join("\n") || "Sem dados",
                    },
                    {
                        name: "👍 Média Maiores Avaliações (Últimos 30 dias)",
                        value: topAvgRating30Days.slice(start, end).map((user, index) =>
                            `\`${start + index + 1}-\` <@${user.StaffID}> - ${user.avgRating30Days} estrelas`).join("\n") || "Sem dados",
                    },
                    {
                        name: "👍 Média Maiores Avaliações (Todo Tempo)",
                        value: topAvgRatingAllTime.slice(start, end).map((user, index) =>
                            `\`${start + index + 1}-\` <@${user.StaffID}> - ${user.allTimeAvgRating} estrelas`).join("\n") || "Sem dados",
                    },
                    {
                        name: "👎 Média Piores Avaliações (Últimos 30 dias)",
                        value: worstAvgRating30Days.slice(start, end).map((user, index) =>
                            `\`${start + index + 1}-\` <@${user.StaffID}> - ${user.avgRating30Days} estrelas`).join("\n") || "Sem dados",
                    },
                    {
                        name: "👎 Média Piores Avaliações (Todo Tempo)",
                        value: worstAvgRatingAllTime.slice(start, end).map((user, index) =>
                            `\`${start + index + 1}-\` <@${user.StaffID}> - ${user.allTimeAvgRating} estrelas`).join("\n") || "Sem dados",
                    }
                ]
            };
        };

        const totalPages = Math.ceil(stats.length / 5);

        const createButtons = (page) => new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('prev_page')
                .setLabel('Anterior')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId('next_page')
                .setLabel('Próximo')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page >= totalPages - 1)
        );

        let currentPage = 0;
        const embed = generateEmbed(currentPage);
        const buttons = createButtons(currentPage);

        const message = await interaction.editReply({
            embeds: [embed],
            components: [buttons],
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector({
            filter: i => ['prev_page', 'next_page'].includes(i.customId),
            time: 60000 // 1 minute
        });

        collector.on('collect', async i => {
            if (i.customId === 'next_page' && currentPage < totalPages - 1) {
                currentPage++;
            } else if (i.customId === 'prev_page' && currentPage > 0) {
                currentPage--;
            }

            const newEmbed = generateEmbed(currentPage);
            const newButtons = createButtons(currentPage);

            await i.update({ embeds: [newEmbed], components: [newButtons] });
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] });
        });
    }
};
