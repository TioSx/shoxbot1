const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Ticket = require(`${process.cwd()}/database/models/ticketActions.js`);
const staffNotas = require(`${process.cwd()}/database/models/staffNotas.js`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('relatorio')
        .setDescription('Gera um relatório automático da staff e dos tickets')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false),
    global: true,

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // Pega o período desejado (aqui: últimos 7 dias)
        const agora = new Date();
        const seteDiasAtras = new Date(agora);
        seteDiasAtras.setDate(agora.getDate() - 7);

        // Tickets fechados nos últimos 7 dias (usando closedAt!)
        const ticketsRecentes = await Ticket.find({
            opened: false,
            closedAt: { $gte: seteDiasAtras }
        });

        // Tickets abertos atualmente
        const ticketsAbertos = await Ticket.find({ opened: true });

        // Top staff da semana (apenas dos tickets fechados na semana)
        let staffCount = {};
        ticketsRecentes.forEach(ticket => {
            (ticket.staff || []).forEach(id => {
                if (!id || id === 'none') return;
                staffCount[id] = (staffCount[id] || 0) + 1;
            });
        });
        const topStaff = Object.entries(staffCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Média de avaliações no período
        const todasNotas = await staffNotas.find({ GuildID: interaction.guild.id });
        let notasSemana = [];
        todasNotas.forEach(staff => {
            (staff.Nota || []).forEach(nota => {
                if (nota.When && new Date(nota.When) >= seteDiasAtras) {
                    notasSemana.push(nota.Nota);
                }
            });
        });
        const mediaAval = notasSemana.length
            ? (notasSemana.reduce((a, b) => a + b, 0) / notasSemana.length).toFixed(2)
            : 'N/A';

        // Tickets pendentes (abertos há mais de 48h)
        const quarentaEOitoHorasAtras = new Date(agora);
        quarentaEOitoHorasAtras.setHours(agora.getHours() - 48);
        const pendentes = ticketsAbertos.filter(t => {
            const dataCriacao = new Date(t.createdAt);
            return dataCriacao < quarentaEOitoHorasAtras;
        });

        // Monta embed de relatório
        const embed = new EmbedBuilder()
            .setTitle(`📊 Relatório Semanal — Staff ${interaction.guild.name}`)
            .setColor(0x7f5af0)
            .setDescription(`Dados automáticos dos últimos 7 dias`)
            .addFields(
                { name: 'Tickets fechados', value: `${ticketsRecentes.length}`, inline: true },
                { name: 'Tickets abertos agora', value: `${ticketsAbertos.length}`, inline: true },
                { name: 'Tickets abertos >48h', value: `${pendentes.length}`, inline: true },
                { name: 'Média avaliações', value: `${mediaAval}`, inline: true },
                {
                    name: 'Top staff (tickets)',
                    value: topStaff.length
                        ? topStaff.map(([id, qtd], i) => `#${i + 1}: <@${id}> — ${qtd} tickets`).join('\n')
                        : 'Sem atendimentos nesta semana'
                }
            )
            .setFooter({ text: `Gerado em: ${agora.toLocaleString('pt-BR')}` });

        await interaction.editReply({ embeds: [embed], ephemeral: false });
    }
};
