const { asyncQuery } = require("../database");
const { existsSync, mkdirSync } = require("fs");
const downloadAttachment = require("../util/downloadAttachment");
const { PermissionFlagsBits } = require("discord.js");

// IDs dos usuários que NÃO podem ser mencionados
const bloqueados = [
""
  //"740371751988625467", // Melyssa
    //"657305212440150047", // Tio
    //"414995628314329088" // Charada
    // Adicione outros IDs que quiser proteger
];

// Lista de canais bloqueados por servidor
const canaisBloqueio = {
    "1099040187251699785": ["1116824536445362186", "ID_CANAL_2"],
    "ID_DO_SERVIDOR_2": ["ID_CANAL_3"],
    "1108183376118153307": ["1116824536445362186"],
    // ...adapte conforme seu caso
};

module.exports = {
    name: "messageCreate",

    /**@param {import("discord.js").Message} message  */
    async execute(message) {
        if (message.author.bot || message.author.system) return;
        if (!message.member) return;

        const guildId = message.guild?.id;
        const canalId = message.channelId;

        const bloqueioAtivo = guildId && canaisBloqueio[guildId]?.includes(canalId);

        // Permite staff com permissão de mover membros marcar qualquer um
        if (
            bloqueioAtivo &&
            !message.member?.permissions.has(PermissionFlagsBits.MoveMembers)
        ) {
            const mencoesProibidas = message.mentions.users.filter(user => bloqueados.includes(user.id));
            if (mencoesProibidas.size > 0) {
                await message.delete().catch(() => {});
                await message.channel.send({
                    content: `${message.author}, você não pode mencionar ${mencoesProibidas.map(u => u.username).join(', ')}! Caso queira atendimento, abra um ticket no servidor principal: discord.gg/bps`,
                    allowedMentions: { users: [message.author.id] }
                });
                return;
            }
        }

        // --- SISTEMA DE TICKET (SEU CÓDIGO) ---
        if (message.client.tickets.get(message.channelId)) {
            let attachmentNumber = await asyncQuery(
                "SELECT SUM(`attachment`) as `count` FROM `ticketMessages` WHERE `channel_id` = ?",
                "return",
                [message.channelId]
            );

            attachmentNumber = attachmentNumber?.[0].count ?? 0;
            let count = 0;

            if (message.attachments.size > 0) {
                if (!existsSync(`./attachments/${message.channelId}`))
                    mkdirSync(`./attachments/${message.channelId}`, { recursive: true });
            }

            for (let attachment of message.attachments) {
                if (attachment[1].size < 3e6) {
                    count += 1;
                    attachmentNumber += 1;
                    downloadAttachment(
                        attachment[1].url,
                        `./attachments/${message.channelId}/${attachmentNumber}.${attachment[1].contentType.split("/")[1]}`
                    );
                }
            }

            await asyncQuery(
                "INSERT INTO `ticketMessages` (`channel_id`, `message_id`, `username`, `message`, `attachment`, `status`, `type`, `createdAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                "run",
                [
                    message.channelId,
                    message.id,
                    message.member.displayName,
                    message.content,
                    count,
                    0,
                    0,
                    Math.floor(message.createdTimestamp / 1e3),
                ]
            );
            return;
        }

        return;
    },
};
