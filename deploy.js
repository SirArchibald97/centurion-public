const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { startup } = require("./utils/log");

module.exports = async (client) => {
	client.commands = new Map();

	let commands = [], count = 0;
	let dirs = fs.readdirSync(`./commands/`);
	for (let dir of dirs) {
		let files = fs.readdirSync(`./commands/${dir}`);
		for (let file of files) {
			const command = require(`./commands/${dir}/${file}`);
			if (command.func) {
				let commandData = await command.data(client);
				client.commands.set(commandData.name, command);
				commands.push(commandData.toJSON());
			} else {
				client.commands.set(command.data.name, command);
				commands.push(command.data.toJSON());
			}
			count += 1;
		}
	}

	let globalCommands = [];
	let files = fs.readdirSync(`./globalcmds/`);
	for (let file of files) {
		const command = require(`./globalcmds/${file}`);
		globalCommands.push(command.data.toJSON());
		client.commands.set(command.data.name, command);
		count += 1;
	}

	// commands
    const rest = new REST({ version: '10' }).setToken(client.config.token);
    await (async () => {
        try {
            await rest.put(Routes.applicationGuildCommands(client.user.id, client.config.guild), { body: commands });
            await rest.put(Routes.applicationCommands(client.user.id), { body: globalCommands });
            startup(`Registered ${count} commands!`);
        } catch (error) {
            console.error(error);
        }
    })();
}