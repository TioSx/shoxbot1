const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  codeBlock,
  StringSelectMenuBuilder,
  Colors,
} = require("discord.js");
const ticketLogs = require("../../../util/ticketLogs");

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */
module.exports = {
  id: "announce-embeds",

  /**
   * @param {import("discord.js").ModalSubmitInteraction} interaction
   */
  async execute(interaction, args) {
    if (args.action === "add") {
      const title = interaction.fields.getTextInputValue("title");

      const components = interaction.message.components;
      const menu = new StringSelectMenuBuilder()
        .setCustomId(
          JSON.stringify({
            id: "announce-embeds",
            user: interaction.user.id,
            action: "embed",
            embed: interaction.message.embeds.length,
          })
        )
        .setPlaceholder(
          `Embed ${interaction.message.embeds.length + 1} - Escolha uma ação`
        )
        .setOptions([
          {
            label: "Mudar título",
            emoji: "📝",
            value: "title",
          },
          {
            label: "Mudar descrição",
            emoji: "📝",
            value: "description",
          },
          {
            label: "Mudar cor",
            emoji: "🔵",
            value: "color",
          },
          {
            label: "Mudar imagem",
            emoji: "🖼",
            value: "image",
          },
          {
            label: "Mudar thumbnail",
            emoji: "🖼",
            value: "thumbnail",
          },
          {
            label: "Mudar rodapé",
            emoji: "📝",
            value: "footer",
          },
          {
            label: "Mudar autor",
            emoji: "👤",
            value: "author",
          },
          {
            label: "Gerenciar fields",
            emoji: "📝",
            value: "fields",
          },
          {
            label: "Remover embed",
            emoji: "❌",
            value: "remove",
          },
          {
            label: "Voltar",
            emoji: "⬅️",
            value: "back",
          },
        ]);

      components[components.length - 1].components = [menu];

      await interaction.message.edit({
        embeds: [
          ...interaction.message.embeds,
          new EmbedBuilder().setTitle(title),
        ],
        components,
      });

      await interaction.reply({
        content: "✅ | Embed criada com sucesso!",
        ephemeral: true,
      });
    } else if (args.action === "title") {
      const title = interaction.fields.getTextInputValue("title");
      const url = interaction.fields.getTextInputValue("url");

      if (!title && !interaction.message.embeds[args.embed]?.description) {
        return interaction.reply({
          content: "❌ | Você precisa ter um título ou uma descrição!",
          ephemeral: true,
        });
      }

      if (url) {
        const check =
          /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/.test(
            url
          );

        if (!check)
          return interaction.reply({
            content: "❌ | URL inválida!",
            ephemeral: true,
          });
      }

      interaction.message.embeds[args.embed] = new EmbedBuilder(
        interaction.message.embeds[args.embed]
      )
        .setTitle(title || null)
        .setURL(url || null);

      await interaction.message.edit({
        embeds: interaction.message.embeds,
      });

      await interaction.reply({
        content: "✅ | Título alterado com sucesso!",
        ephemeral: true,
      });
    } else if (args.action === "description") {
      const description = interaction.fields.getTextInputValue("description");

      if (!description && !interaction.message.embeds[args.embed]?.title) {
        return interaction.reply({
          content: "❌ | Você precisa ter um título ou uma descrição!",
          ephemeral: true,
        });
      }

      interaction.message.embeds[args.embed] = new EmbedBuilder(
        interaction.message.embeds[args.embed]
      ).setDescription(description || null);

      await interaction.message.edit({
        embeds: interaction.message.embeds,
      });

      await interaction.reply({
        content: "✅ | Descrição alterada com sucesso!",
        ephemeral: true,
      });
    } else if (args.action === "color") {
      let color = interaction.fields.getTextInputValue("color");

      if (color in Colors) {
        color = Colors[color];
      } else {
        color = parseInt(color, 16);
      }

      if (isNaN(color)) {
        return interaction.reply({
          content: "❌ | Cor inválida!",
          ephemeral: true,
        });
      }

      interaction.message.embeds[args.embed] = new EmbedBuilder(
        interaction.message.embeds[args.embed]
      ).setColor(color);

      await interaction.message.edit({
        embeds: interaction.message.embeds,
      });

      await interaction.reply({
        content: "✅ | Cor alterada com sucesso!",
        ephemeral: true,
      });
    } else if (args.action === "image") {
      const url = interaction.fields.getTextInputValue("image");

      if (url) {
        const check = /\/\/(\S+?(?:jpe?g|png|gif|webp))/g.test(url);
        if (!check)
          return interaction.reply({
            content: "❌ | URL inválida!",
            ephemeral: true,
          });
      }

      interaction.message.embeds[args.embed] = new EmbedBuilder(
        interaction.message.embeds[args.embed]
      ).setImage(url.replace("`", "") || null);

      await interaction.message.edit({
        embeds: interaction.message.embeds,
      });

      await interaction.reply({
        content: "✅ | Imagem alterada com sucesso!",
        ephemeral: true,
      });
    } else if (args.action === "thumbnail") {
      const url = interaction.fields.getTextInputValue("thumbnail");

      if (url) {
        const check = /\/\/(\S+?(?:jpe?g|png|gif|webp))/g.test(url);
        if (!check)
          return interaction.reply({
            content: "❌ | URL inválida!",
            ephemeral: true,
          });
      }

      interaction.message.embeds[args.embed] = new EmbedBuilder(
        interaction.message.embeds[args.embed]
      ).setThumbnail(url.replace("`", "") || null);

      await interaction.message.edit({
        embeds: interaction.message.embeds,
      });

      await interaction.reply({
        content: "✅ | Thumbnail alterada com sucesso!",
        ephemeral: true,
      });
    } else if (args.action === "footer") {
      const text = interaction.fields.getTextInputValue("footer");
      let icon = interaction.fields.getTextInputValue("footerIcon");

      if (icon) {
        const check = /\/\/(\S+?(?:jpe?g|png|gif|webp))/g.test(icon);
        if (!check) {
          if (icon === "eu") {
            icon = interaction.user.displayAvatarURL({
              dynamic: true,
              size: 2048,
            });
          } else if (icon === "bot") {
            icon = interaction.client.user.displayAvatarURL({
              dynamic: true,
              size: 2048,
            });
          } else
            return interaction.reply({
              content:
                "❌ | URL inválida!\n\nUse `eu` para usar o seu avatar ou `bot` para usar o avatar do bot!",
              ephemeral: true,
            });
        }
      }

      interaction.message.embeds[args.embed] = new EmbedBuilder(
        interaction.message.embeds[args.embed]
      ).setFooter({
        text: text || null,
        iconURL: icon || null,
      });

      await interaction.message.edit({
        embeds: interaction.message.embeds,
      });

      await interaction.reply({
        content: "✅ | Rodapé alterado com sucesso!",
        ephemeral: true,
      });
    } else if (args.action === "author") {
      const name = interaction.fields.getTextInputValue("author");
      let icon = interaction.fields.getTextInputValue("authorIcon");
      const url = interaction.fields.getTextInputValue("authorUrl");

      if (!name && (!icon || !url)) {
        return interaction.reply({
          content: "❌ | Você precisa ter um nome!",
          ephemeral: true,
        });
      }

      if (icon) {
        const check = /\/\/(\S+?(?:jpe?g|png|gif|webp))/g.test(icon);
        if (!check) {
          if (icon === "eu") {
            icon = interaction.user.displayAvatarURL({
              dynamic: true,
              size: 2048,
            });
          } else if (icon === "bot") {
            icon = interaction.client.user.displayAvatarURL({
              dynamic: true,
              size: 2048,
            });
          } else
            return interaction.reply({
              content:
                "❌ | URL inválida!\n\nUse `eu` para usar o seu avatar ou `bot` para usar o avatar do bot!",
              ephemeral: true,
            });
        }
      }

      if (url) {
        const check =
          /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/.test(
            url
          );

        if (!check)
          return interaction.reply({
            content: "❌ | URL inválida!",
            ephemeral: true,
          });
      }

      interaction.message.embeds[args.embed] = new EmbedBuilder(
        interaction.message.embeds[args.embed]
      ).setAuthor({
        name: name || null,
        iconURL: icon || null,
        url: url || null,
      });

      await interaction.message.edit({
        embeds: interaction.message.embeds,
      });

      await interaction.reply({
        content: "✅ | Autor alterado com sucesso!",
        ephemeral: true,
      });
    } else if (args.action === "field") {
      const name = interaction.fields.getTextInputValue("name");
      const value = interaction.fields.getTextInputValue("value");
      const inline = interaction.fields.getTextInputValue("inline") || "N";

      const embeds = interaction.message.embeds;

      if (typeof args.field === "number") {
        if (!name && !value) {
          embeds[args.embed] = new EmbedBuilder(
            embeds[args.embed]
          ).spliceFields(args.field, 1);
        } else {
          embeds[args.embed] = new EmbedBuilder(
            embeds[args.embed]
          ).spliceFields(args.field, 1, {
            name: name || null,
            value: value || null,
            inline: /S/gi.test(inline) || false,
          });
        }
      } else {
        if (!name && !value)
          return interaction.reply({
            content: "❌ | Você precisa ter um nome ou um valor!",
            ephemeral: true,
          });

        embeds[args.embed] = new EmbedBuilder(embeds[args.embed]).addFields({
          name: name || null,
          value: value || null,
          inline: /S/gi.test(inline) || false,
        });
      }

      const options = [];
      const components = interaction.message.components;

      const embedFields = (embeds[args.embed].toJSON() ?? embeds[args.embed])
        ?.fields;

      for (let field in embedFields) {
        options.push({
          label: `Field ${Number(field) + 1}`,
          value: field,
          description: embedFields[field].name ?? "",
          emoji: "📝",
        });
      }

      if ((embedFields?.length ?? 0) < 10) {
        options.push({
          label: "Adicionar campo",
          value: "add",
          description: "Adicione um novo field",
          emoji: "➕",
        });
      }

      options.push({
        label: "Voltar",
        value: "back",
        description: "Volta para o menu anterior",
        emoji: "⬅️",
      });

      components[components.length - 1].components = [
        new StringSelectMenuBuilder()
          .setCustomId(
            JSON.stringify({
              id: "announce-embeds",
              user: interaction.user.id,
              action: "fields",
              embed: args.embed,
            })
          )
          .setPlaceholder("Fields - Selecione um field")
          .addOptions(options),
      ];

      await interaction.message.edit({
        embeds,
        components,
      });

      await interaction.reply({
        content: `✅ | Field ${
          typeof args.field === "number" ? "alterado" : "adicionado"
        } com sucesso!`,
        ephemeral: true,
      });
    }
  },
};
