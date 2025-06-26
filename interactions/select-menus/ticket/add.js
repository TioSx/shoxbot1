const { UserSelectMenuInteraction, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Ticket = require(`${process.cwd()}/database/models/ticketActions.js`);

/**
 * @type {import('../../../typings').SelectInteractionCommand}
 */
module.exports = {
    id: "ticket-add",

    /**
     *
     * @param {UserSelectMenuInteraction} interaction
     */
    async execute(interaction, args) {
        const members = interaction.members;

        await interaction.deferUpdate();

        let res = [[], []];

        for (const [id, member] of members) {
            if (member.user.bot) {
                res[1].push({ id, reason: 3 });
                continue;
            }
            if (member.permissions.has(PermissionFlagsBits.Administrator)) {
                res[1].push({ id, reason: 1 });
                continue;
            }

            const ticket = await Ticket.findOne({ channel_id: interaction.channel.id });

            if (!ticket || !ticket.members.includes(id)) {
                res[0].push({ id, username: member.user.username });
            } else {
                res[1].push({ id, reason: 2 });
            }
        }

        if (res[0].length) {
            await Ticket.updateOne({ channel_id: interaction.channel.id }, { $push: { members: { $each: res[0].map(({ id }) => id) } } });

            const addedMembers = res[0].map(({ id }) => `<@${id}>`).join(" ");

            await interaction.channel.permissionOverwrites.set([
                ...interaction.channel.permissionOverwrites.cache.toJSON(),
                ...res[0].map(({ id }) => ({
                    id,
                    allow: [PermissionFlagsBits.ViewChannel],
                })),
            ]);

            await interaction.channel.send({
                content: `${addedMembers}`,
                embeds: [
                    new EmbedBuilder()
                        .setColor("Purple")
                        .setDescription(
                            `✅ | ${addedMembers} ${res[0].length > 1 ? "foram" : "foi"} adicionado${res[0].length > 1 ? "s" : ""} ao ticket por <@${interaction.user.id}>`
                        ),
                ],
            });
        }

        if (res[1].length) {
            const reasons = {
                1: "é um administrador",
                2: "já possui acesso ao ticket",
                3: "é um bot",
            };

            await interaction.editReply({
                content: `🟠 | **Não foi possível adicionar os seguintes usuários:**\n\n${res[1]
                    .map(({ id, reason }) => `<@${id}> ${reasons[reason]}`)
                    .join("\n")}`,
                components: [],
            });
        } else {
            await interaction.editReply({
                content: "🟢 | Usuários adicionados com sucesso!",
                components: [],
            });
        }
    },
};
