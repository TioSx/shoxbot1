/**
 * @file Main File of the bot, responsible for registering events, commands, interactions etc.
 * @author Naman Vrati
 * @since 1.0.0
 * @version 3.3.0
 */

// Declare constants which will be used throughout the bot.

process.env.TZ = "America/Sao_Paulo";

const fs = require("fs");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { token, client_id, guild_id } = require("./config.json");
const path = require('path')
const Database = require('./mongodb.js');
const mongodb = new Database;

mongodb.connect();

require("moment").locale("pt-br");

/**
 * From v13, specifying the intents is compulsory.
 * @type {import('./typings').Client}
 * @description Main Application Client */

// @ts-ignore
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
   GatewayIntentBits.GuildMembers,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Channel],
});

/**********************************************************************/
// Below we will be making an event handler!

/**
 * @description All event files of the event handler.
 * @type {String[]}
 */

const eventFiles = fs
	.readdirSync("./events")
	.filter((file) => file.endsWith(".js"));

// Loop through all files and execute the event when it is actually emmited.
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	} else {
		client.on(
			event.name,
			async (...args) => await event.execute(...args, client)
		);
	}
}

/**********************************************************************/
// Define Collection of Commands, Slash Commands and cooldowns

client.slashCommands = new Collection();
client.buttonCommands = new Collection();
client.selectCommands = new Collection();
client.contextCommands = new Collection();
client.modalCommands = new Collection();
client.autocompleteInteractions = new Collection();
client.tickets = new Collection();
client.autoMessages = new Collection();
client.database = {};

const modelsDir = path.join(process.cwd(), 'database', 'models');
const modelFiles = fs.readdirSync(modelsDir);

modelFiles.forEach((file) => {
  const modelName = path.basename(file, '.js');
  const modelPath = path.join(modelsDir, file);
  const model = require(modelPath);
  client.database[modelName] = model;
});

/**********************************************************************/
// Registration of Slash-Command Interactions.

/**
 * @type {String[]}
 * @description All slash commands.
 */

const slashCommands = fs.readdirSync("./interactions/slash");

// Loop through all files and store slash-commands in slashCommands collection.

for (const module of slashCommands) {
	const commandFiles = fs
		.readdirSync(`./interactions/slash/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const commandFile of commandFiles) {
		const command = require(`./interactions/slash/${module}/${commandFile}`);
		client.slashCommands.set(command.data.name, command);
	}
}

/**********************************************************************/
// Registration of Autocomplete Interactions.

/**
 * @type {String[]}
 * @description All autocomplete interactions.
 */

const autocompleteInteractions = fs.readdirSync("./interactions/autocomplete");

// Loop through all files and store autocomplete interactions in autocompleteInteractions collection.

for (const module of autocompleteInteractions) {
	const files = fs
		.readdirSync(`./interactions/autocomplete/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const interactionFile of files) {
		const interaction = require(`./interactions/autocomplete/${module}/${interactionFile}`);
		client.autocompleteInteractions.set(interaction.name, interaction);
	}
}

/**********************************************************************/
// Registration of Context-Menu Interactions

/**
 * @type {String[]}
 * @description All Context Menu commands.
 */

// const contextMenus = fs.readdirSync("./interactions/context-menus");

// Loop through all files and store context-menus in contextMenus collection.

// for (const folder of contextMenus) {
// 	const files = fs
// 		.readdirSync(`./interactions/context-menus/${folder}`)
// 		.filter((file) => file.endsWith(".js"));
// 	for (const file of files) {
// 		const menu = require(`./interactions/context-menus/${folder}/${file}`);
// 		const keyName = `${folder.toUpperCase()} ${menu.data.name}`;
// 		client.contextCommands.set(keyName, menu);
// 	}
// }

/**********************************************************************/
// Registration of Button-Command Interactions.

/**
 * @type {String[]}
 * @description All button commands.
 */

const buttonCommands = fs.readdirSync("./interactions/buttons");

// Loop through all files and store button-commands in buttonCommands collection.

for (const module of buttonCommands) {
	const commandFiles = fs
		.readdirSync(`./interactions/buttons/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const commandFile of commandFiles) {
		const command = require(`./interactions/buttons/${module}/${commandFile}`);
		client.buttonCommands.set(command.id, command);
	}
}

/**********************************************************************/
// Registration of Modal-Command Interactions.

/**
 * @type {String[]}
 * @description All modal commands.
 */

const modalCommands = fs.readdirSync("./interactions/modals");

// Loop through all files and store modal-commands in modalCommands collection.

for (const module of modalCommands) {
	const commandFiles = fs
		.readdirSync(`./interactions/modals/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const commandFile of commandFiles) {
		const command = require(`./interactions/modals/${module}/${commandFile}`);
		client.modalCommands.set(command.id, command);
	}
}

/**********************************************************************/
// Registration of select-menus Interactions

/**
 * @type {String[]}
 * @description All Select Menu commands.
 */

const selectMenus = fs.readdirSync("./interactions/select-menus");

// Loop through all files and store select-menus in selectMenus collection.

for (const module of selectMenus) {
	const commandFiles = fs
		.readdirSync(`./interactions/select-menus/${module}`)
		.filter((file) => file.endsWith(".js"));
	for (const commandFile of commandFiles) {
		const command = require(`./interactions/select-menus/${module}/${commandFile}`);
		client.selectCommands.set(command.id, command);
	}
}

/**********************************************************************/
// Registration of Slash-Commands in Discord API

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
	try {
		console.log("Started refreshing application (/) commands.");

		const commandJsonData = [
			...Array.from(client.slashCommands.filter((v) => !v.global).values()).map(
				(c) => c.data.toJSON()
			),
		];

		const globalJsonData = [
			...Array.from(client.slashCommands.filter((v) => v.global).values()).map(
				(c) => c.data.toJSON()
			),
		];

		await rest.put(
			/**
			 * By default, you will be using guild commands during development.
			 * Once you are done and ready to use global commands (which have 1 hour cache time),
			 * 1. Please uncomment the below (commented) line to deploy global commands.
			 * 2. Please comment the below (uncommented) line (for guild commands).
			 */

			Routes.applicationGuildCommands(client_id, guild_id),

			/**
			 * Good advice for global commands, you need to execute them only once to update
			 * your commands to the Discord API. Please comment it again after running the bot once
			 * to ensure they don't get re-deployed on the next restart.
			 */

			// Routes.applicationCommands(client_id)

			{ body: commandJsonData }
		);

		await rest.put(Routes.applicationCommands(client_id), {
			body: globalJsonData,
		});

		console.log("Successfully reloaded application (/) commands.");
	} catch (error) {
		console.error(error);
	}
})();

// Login into your client application with bot's token.

client.login(token);

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);
client.on('debug', console.log);
client.on('warn', console.warn);
client.on('error', console.error);