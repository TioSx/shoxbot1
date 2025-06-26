const config = require("../../../config.json");
const {
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ActionRowBuilder,
  codeBlock,
} = require("discord.js");
const ticketLogs = require("../../../util/ticketLogs");
const Ticket = require(`${process.cwd()}/database/models/ticketActions.js`);

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */

module.exports = {
  id: "ticket",

  /**
   * @param {import("discord.js").ModalSubmitInteraction} interaction
   */

  async execute(interaction, args) {
    await interaction.deferUpdate();

    const count = await Ticket.countDocuments();

let ticketNumber = count + 1;
while (ticketNumber.toString().includes("1488")) {
  console.log("Atenção! Número do ticket contém 1488, tentando o próximo...");
  ticketNumber++; // Incrementa o número do ticket
}

console.log(`Número do ticket final: ${ticketNumber}`);
// Agora você pode continuar criando o ticket com ticketNumber


    const member = await interaction.guild.members.fetch(interaction.user.id);
    const userNickname = member.nickname || interaction.user.globalName;
    const ticketName = `sv${args.server}-${args.department}-${userNickname}`;

    let ticketCategory = null;

    const ticketCategoryID =
      config["ticket-category"]?.[args.server.toString()];

    if (ticketCategoryID) {
      const categoryChannel = await interaction.guild.channels
        .fetch(ticketCategoryID)
        .catch(() => null);

      if (categoryChannel && categoryChannel.children.cache.size < 50) {
        ticketCategory = categoryChannel;
      }
    }

    let staff =
      config["ticket-roles"]?.[args.server.toString()]?.permission ?? [];

    const mention =
      config["ticket-roles"]?.[args.server.toString()]?.[args.department] ?? [];

    if (["discord", "fórum"].includes(args.department)) {
      staff =
        config["ticket-roles"]?.[args.server.toString()]?.[args.department] ??
        [];
    }

    let channel;
    try {
      /**
       * @type {import('discord.js').TextChannel}
       */
      channel = await interaction.guild.channels.create({
        name: ticketName,
        parent:
          args.department === "discord"
            ? "1207158017968308234"
            : args.department === "fórum"
            ? "1207158225741545542"
            : ticketCategory,
        topic: `Brasil Play Shox - Ticket: #${ticketNumber}`,
        permissionOverwrites: [
          ...staff.map((role) => ({
            id: role,
            allow: ["ViewChannel"],
          })),
          {
            id: interaction.user.id,
            allow: ["ViewChannel"],
          },
          {
            id: interaction.guild.id,
            deny: ["ViewChannel"],
          },
        ],
      });
    } catch (e) {
      console.error(e);
      return interaction.editReply({
        content: `Erro ao criar o ticket. Por favor, tente novamente mais tarde.`,
        ephemeral: true,
      });
    }

    const nickname = interaction.fields.getTextInputValue("nickname");
    const problem = interaction.fields.getTextInputValue("problem");

    const timestamp = Date.now();
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

    const newTicket = new Ticket({
      id: 1,
      server: args.server,
      department: args.department,
      channel_id: channel.id,
      transcriptUrl: "none",
      staff: "none",
      members: [interaction.user.id],
      opened: true,
      locked: false,
      createdAt: formattedDate,
    });

    try {
      await newTicket.save();

      await channel.send({
        content: `<@${interaction.user.id}> ${
          mention.length ? mention.map((role) => `<@&${role}>`).join(" ") : ""
        }`,
        embeds: [
          new EmbedBuilder()
            .setTitle("Ticket Criado")
            .setDescription(
              `❗ Todos os responsáveis já foram avisados. Evite chamar alguém no privado, aguarde e alguém irá fazer seu atendimento.\n\n> 👤 **Nickname:** ${nickname}\n> 🪪 **ID:** #${ticketNumber} \n> 📃 **Resumo**: \`\`${problem}\`\`\n\nPara fechar este ticket, basta clicar no botão vermelho.`
            )
            .setColor("Purple")
            .setFooter({
              text: `⚠️ Descreva seu problema abaixo com o máximo de detalhes possível para agilizar o atendimento`,
            }),
        ],
      components: [
    new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(
                JSON.stringify({ id: "ticket-close", ticket: channel.id })
            )
            .setLabel("Encerrar Suporte")
            .setEmoji("🗑️")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(
                JSON.stringify({ id: "ticket-unlock", ticket: channel.id })
            )
            .setLabel("Destrancar Ticket")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(
                JSON.stringify({ id: "ticket-lock", ticket: channel.id })
            )
            .setLabel("Trancar Ticket")
            .setEmoji("🔐")
            .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(
                JSON.stringify({ id: "ticket-notify", ticket: channel.id })
            )
            .setLabel("Notificar Membro")
            .setEmoji("🔔")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(
                JSON.stringify({ id: "ticket-add", ticket: channel.id })
            )
            .setLabel("Adicionar Membro")
            .setEmoji("➕")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(
                JSON.stringify({ id: "ticket-redeem", ticket: channel.id })
            )
            .setLabel("Assumir Ticket")
            .setEmoji("⚜️")
            .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(
                JSON.stringify({ id: "ticket-add-role", ticket: channel.id })
            )
            .setLabel("Adicionar Cargo")
            .setEmoji("🛠️")
            .setStyle(ButtonStyle.Secondary)
    ),
],

      });
    } catch (error) {
      console.log("Error creating ticket:", error);
      return interaction.editReply({
        content: `Erro ao criar o ticket. Por favor, tente novamente mais tarde.`,
        ephemeral: true,
      });
    }

    sucessEmbed = new EmbedBuilder()
      .setDescription(`✅ | Ticket criado com sucesso! ${channel}`)
      .setColor("Purple");

    await interaction.editReply({
      content: ``,
      embeds: [sucessEmbed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setURL(channel.url)
            .setLabel("Ir para ticket")
            .setStyle(ButtonStyle.Link)
        ),
      ],
      ephemeral: true,
    });

    ticketLogs(interaction.guild, {
      embeds: [
        new EmbedBuilder()
          .setTitle("🟢 Ticket Aberto")
          .setFields([
            { name: "👤 Usuário", value: `${interaction.user}` },
            { name: "🪪 ID", value: codeBlock(`${interaction.user.id}`) },
            {
              name: "🖥 Servidor",
              value: codeBlock(`Servidor ${args.server}`),
            },
            { name: "📁 Departamento", value: codeBlock(args.department) },
            { name: "📃 Resumo", value: codeBlock(problem) },
          ])
          .setColor("Green")
          .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 512 }))
          .setFooter({ text: `Ticket #${ticketNumber} - Brasil Play Shox` })
          .setTimestamp(),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setURL(channel.url)
            .setLabel("Ir para ticket")
            .setStyle(ButtonStyle.Link)
        ),
      ],
    });
  },
};
