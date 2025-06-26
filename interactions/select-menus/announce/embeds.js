const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	PermissionFlagsBits,
	UserSelectMenuBuilder,
	EmbedBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} = require("discord.js");

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */
module.exports = {
	id: "announce-embeds",

	/**@param {import("discord.js").StringSelectMenuInteraction} interaction  */
	async execute(interaction, args) {
		if (interaction.user.id !== args.user)
			return interaction.reply({
				content: "❌ | Você não tem permissão para usar este menu!",
				ephemeral: true,
			});
		const selected = interaction.values[0];

		if (args.action === "select") {
			if (selected === "back") {
				const components = interaction.message.components;

				components[components.length > 1 ? 1 : 0] =
					new ActionRowBuilder().setComponents(
						new StringSelectMenuBuilder()
							.setCustomId(
								JSON.stringify({ id: "announce", user: interaction.user.id })
							)
							.setPlaceholder("Selecione uma opção")
							.addOptions(
								{
									label: "Conteúdo da mensagem",
									value: "message",
									description: "Muda a mensagem, pode ser usada para marcações",
									emoji: "📝",
								},
								{
									label: "Embeds",
									value: "embeds",
									description: "Menu para gerenciar as embeds",
									emoji: "📰",
								},
								{
									label: "Links",
									value: "links",
									description: "Menu para gerenciar os botões de links",
									emoji: "🔗",
								},
								{
									label: "Enviar",
									value: "send",
									description: "Envia a mensagem",
									emoji: "✅",
								}
							)
					);

				await interaction.update({
					components,
				});
			} else if (selected === "add") {
				return await interaction.showModal(
					new ModalBuilder()
						.setTitle("Adicionar Embed")
						.setCustomId(
							JSON.stringify({
								id: "announce-embeds",
								user: interaction.user.id,
								action: "add",
							})
						)
						.addComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("title")
									.setLabel("Título")
									.setMaxLength(256)
									.setMinLength(1)
									.setRequired(true)
									.setStyle(TextInputStyle.Short)
							)
						)
				);
			} else {
				const components = interaction.message.components;
				const menu = new StringSelectMenuBuilder()
					.setCustomId(
						JSON.stringify({
							id: "announce-embeds",
							user: interaction.user.id,
							action: "embed",
							embed: Number(selected),
						})
					)
					.setPlaceholder(`Embed ${Number(selected) + 1} - Escolha uma ação`)
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

				await interaction.update({
					components,
				});
			}
		} else if (args.action === "embed") {
			const components = interaction.message.components;
			const embed = interaction.message.embeds[args.embed];

			if (selected === "back") {
				const menu = new StringSelectMenuBuilder()
					.setCustomId(
						JSON.stringify({
							id: "announce-embeds",
							user: interaction.user.id,
							action: "select",
						})
					)
					.setPlaceholder("Embeds - Selecione uma embed")
					.addOptions([
						...interaction.message.embeds.map((embed, index) => ({
							label: `Embed ${index + 1}`,
							value: `${index}`,
							description: embed.title,
							emoji: "📰",
						})),
						...(interaction.message.embeds.length < 5
							? [
									{
										label: "Adicionar embed",
										value: "add",
										description: "Adicione uma nova embed",
										emoji: "➕",
									},
							  ]
							: []),
						{
							label: "Voltar",
							value: "back",
							description: "Volta para o menu anterior",
							emoji: "⬅️",
						},
					]);

				components[components.length - 1].components = [menu];

				await interaction.update({
					components,
				});
			} else if (selected === "title") {
				await interaction.message.edit({
					components: interaction.message.components,
				});
				return await interaction.showModal(
					new ModalBuilder()
						.setTitle("Mudar título")
						.setCustomId(
							JSON.stringify({
								id: "announce-embeds",
								user: interaction.user.id,
								action: "title",
								embed: args.embed,
							})
						)
						.addComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("title")
									.setLabel("Título")
									.setMaxLength(256)
									.setMinLength(0)
									.setRequired(false)
									.setValue(embed.title ?? "")
									.setStyle(TextInputStyle.Short)
							),
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("url")
									.setLabel("URL")
									.setPlaceholder("https://google.com")
									.setMaxLength(512)
									.setRequired(false)
									.setMinLength(0)
									.setValue(embed.url ?? "")
									.setStyle(TextInputStyle.Short)
							)
						)
				);
			} else if (selected === "description") {
				await interaction.message.edit({
					components: interaction.message.components,
				});
				return await interaction.showModal(
					new ModalBuilder()
						.setTitle("Mudar descrição")
						.setCustomId(
							JSON.stringify({
								id: "announce-embeds",
								user: interaction.user.id,
								action: "description",
								embed: args.embed,
							})
						)
						.addComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("description")
									.setLabel("Descrição")
									.setMaxLength(4000)
									.setMinLength(0)
									.setValue(embed.description ?? "")
									.setRequired(false)
									.setStyle(TextInputStyle.Paragraph)
							)
						)
				);
			} else if (selected === "color") {
				await interaction.message.edit({
					components: interaction.message.components,
				});
				return await interaction.showModal(
					new ModalBuilder()
						.setTitle("Mudar cor")
						.setCustomId(
							JSON.stringify({
								id: "announce-embeds",
								user: interaction.user.id,
								action: "color",
								embed: args.embed,
							})
						)
						.addComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("color")
									.setLabel("Cor")
									.setPlaceholder("Ex: #FF0000")
									.setValue(embed.hexColor ?? "")
									.setRequired(true)
									.setStyle(TextInputStyle.Short)
							)
						)
				);
			} else if (selected === "image") {
				await interaction.message.edit({
					components: interaction.message.components,
				});
				return await interaction.showModal(
					new ModalBuilder()
						.setTitle("Mudar imagem")
						.setCustomId(
							JSON.stringify({
								id: "announce-embeds",
								user: interaction.user.id,
								action: "image",
								embed: args.embed,
							})
						)
						.addComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("image")
									.setLabel("Imagem")
									.setPlaceholder("Ex: https://google.com/image.png")
									.setValue(embed.image?.url ?? "")
									.setRequired(false)
									.setStyle(TextInputStyle.Short)
							)
						)
				);
			} else if (selected === "thumbnail") {
				await interaction.message.edit({
					components: interaction.message.components,
				});
				return await interaction.showModal(
					new ModalBuilder()
						.setTitle("Mudar thumbnail")
						.setCustomId(
							JSON.stringify({
								id: "announce-embeds",
								user: interaction.user.id,
								action: "thumbnail",
								embed: args.embed,
							})
						)
						.addComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("thumbnail")
									.setLabel("Thumbnail")
									.setPlaceholder("Ex: https://google.com/image.png")
									.setValue(embed.thumbnail?.url ?? "")
									.setRequired(false)
									.setStyle(TextInputStyle.Short)
							)
						)
				);
			} else if (selected === "footer") {
				await interaction.message.edit({
					components: interaction.message.components,
				});
				return await interaction.showModal(
					new ModalBuilder()
						.setTitle("Mudar rodapé")
						.setCustomId(
							JSON.stringify({
								id: "announce-embeds",
								user: interaction.user.id,
								action: "footer",
								embed: args.embed,
							})
						)
						.addComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("footer")
									.setLabel("Rodapé")
									.setPlaceholder("Ex: Rodapé")
									.setValue(embed.footer?.text ?? "")
									.setRequired(false)
									.setStyle(TextInputStyle.Short)
							),
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("footerIcon")
									.setLabel("Ícone do rodapé")
									.setPlaceholder("Ex: https://google.com/image.png")
									.setValue(embed.footer?.iconURL ?? "")
									.setRequired(false)
									.setStyle(TextInputStyle.Short)
							)
						)
				);
			} else if (selected === "author") {
				await interaction.message.edit({
					components: interaction.message.components,
				});
				return await interaction.showModal(
					new ModalBuilder()
						.setTitle("Mudar autor")
						.setCustomId(
							JSON.stringify({
								id: "announce-embeds",
								user: interaction.user.id,
								action: "author",
								embed: args.embed,
							})
						)
						.addComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("author")
									.setLabel("Autor")
									.setPlaceholder("Ex: Autor")
									.setValue(embed.author?.name ?? "")
									.setRequired(false)
									.setStyle(TextInputStyle.Short)
							),
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("authorIcon")
									.setLabel("Ícone do autor")
									.setPlaceholder("Ex: https://google.com/image.png")
									.setValue(embed.author?.iconURL ?? "")
									.setRequired(false)
									.setStyle(TextInputStyle.Short)
							),
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("authorUrl")
									.setLabel("URL do autor")
									.setPlaceholder("Ex: https://google.com")
									.setValue(embed.author?.url ?? "")
									.setRequired(false)
									.setStyle(TextInputStyle.Short)
							)
						)
				);
			} else if (selected === "remove") {
				const embeds = interaction.message.embeds;

				embeds.splice(args.embed, 1);

				const menu = new StringSelectMenuBuilder()
					.setCustomId(
						JSON.stringify({
							id: "announce-embeds",
							user: interaction.user.id,
							action: "select",
						})
					)
					.setPlaceholder("Embeds - Selecione uma embed")
					.addOptions([
						...interaction.message.embeds.map((embed, index) => ({
							label: `Embed ${index + 1}`,
							value: `${index}`,
							description: embed.title,
							emoji: "📰",
						})),
						...(interaction.message.embeds.length < 5
							? [
									{
										label: "Adicionar embed",
										value: "add",
										description: "Adicione uma nova embed",
										emoji: "➕",
									},
							  ]
							: []),
						{
							label: "Voltar",
							value: "back",
							description: "Volta para o menu anterior",
							emoji: "⬅️",
						},
					]);

				components[components.length - 1].components = [menu];

				await interaction.update({
					embeds,
					components,
				});
			} else if (selected === "fields") {
				const options = [];

				for (let field in embed.fields) {
					options.push({
						label: `Field ${Number(field) + 1}`,
						value: field,
						description: embed.fields[field].name,
						emoji: "📝",
					});
				}

				if (embed.fields.length < 10) {
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

				await interaction.update({
					components,
				});
			}
		} else if (args.action === "fields") {
			const components = interaction.message.components;
			const embed = interaction.message.embeds[args.embed];

			if (selected === "back") {
				const menu = new StringSelectMenuBuilder()
					.setCustomId(
						JSON.stringify({
							id: "announce-embeds",
							user: interaction.user.id,
							action: "select",
						})
					)
					.setPlaceholder("Embeds - Selecione uma embed")
					.addOptions([
						...interaction.message.embeds.map((embed, index) => ({
							label: `Embed ${index + 1}`,
							value: `${index}`,
							description: embed.title,
							emoji: "📰",
						})),
						...(interaction.message.embeds.length < 5
							? [
									{
										label: "Adicionar embed",
										value: "add",
										description: "Adicione uma nova embed",
										emoji: "➕",
									},
							  ]
							: []),
						{
							label: "Voltar",
							value: "back",
							description: "Volta para o menu anterior",
							emoji: "⬅️",
						},
					]);

				components[components.length - 1].components = [menu];

				await interaction.update({
					components,
				});
			} else if (selected === "add") {
				await interaction.message.edit({
					components: interaction.message.components,
				});
				return await interaction.showModal(
					new ModalBuilder()
						.setTitle("Adicionar field")
						.setCustomId(
							JSON.stringify({
								id: "announce-embeds",
								user: interaction.user.id,
								action: "field",
								embed: args.embed,
							})
						)
						.addComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("name")
									.setLabel("Nome")
									.setMaxLength(256)
									.setRequired(true)
									.setStyle(TextInputStyle.Short)
							),
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("value")
									.setLabel("Valor")
									.setMaxLength(1024)
									.setRequired(true)
									.setStyle(TextInputStyle.Paragraph)
							),
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("inline")
									.setLabel("Inline")
									.setPlaceholder("S/N")
									.setMaxLength(1)
									.setRequired(false)
									.setStyle(TextInputStyle.Short)
							)
						)
				);
			} else {
				const field =
					interaction.message.embeds[args.embed].fields[Number(selected)];

				if (!field)
					return interaction.reply({
						content: "❌ | Este field não existe!",
						ephemeral: true,
					});

				await interaction.message.edit({
					components: interaction.message.components,
				});
				return await interaction.showModal(
					new ModalBuilder()
						.setTitle("Mudar field")
						.setCustomId(
							JSON.stringify({
								id: "announce-embeds",
								user: interaction.user.id,
								action: "field",
								embed: args.embed,
								field: Number(selected),
							})
						)
						.addComponents(
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("name")
									.setLabel("Nome")
									.setMaxLength(256)
									.setValue(field.name ?? "")
									.setRequired(false)
									.setStyle(TextInputStyle.Short)
							),
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("value")
									.setLabel("Valor")
									.setMaxLength(1024)
									.setValue(field.value ?? "")
									.setRequired(false)
									.setStyle(TextInputStyle.Paragraph)
							),
							new ActionRowBuilder().addComponents(
								new TextInputBuilder()
									.setCustomId("inline")
									.setLabel("Inline")
									.setPlaceholder("S/N")
									.setMaxLength(1)
									.setValue(field.inline ? "S" : "N")
									.setRequired(false)
									.setStyle(TextInputStyle.Short)
							)
						)
				);
			}
		}
	},
};
