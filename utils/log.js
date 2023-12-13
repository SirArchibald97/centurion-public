const { EmbedBuilder } = require('discord.js');

const startup = (message) => {
	const date = new Date(new Date(Date.now()).toUTCString());
	console.log(`\u001b[32m[${date.getHours() < 10 ? "0" + date.getHours() : date.getHours()}:${date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()}:${date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds()}] [STARTUP] \u001b[37m${message}`);
}

const log = (message) => {
	const date = new Date(new Date(Date.now()).toUTCString());
	console.log(`\u001b[34m[${date.getHours() < 10 ? "0" + date.getHours() : date.getHours()}:${date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()}:${date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds()}] [LOG] \u001b[37m${message}`);
}

const db = (message) => {
    const date = new Date(new Date(Date.now()).toUTCString());
	console.log(`\u001b[33m[${date.getHours() < 10 ? "0" + date.getHours() : date.getHours()}:${date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()}:${date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds()}] [DB] \u001b[37m${message}`);
}

const logInteraction = async (client, interaction) => {
	if (client.config.logBlacklist.includes(interaction.channel.id)) return;

	const date = new Date(new Date(Date.now()).toUTCString());
	const time = `${date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()}:${
		date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
	}:${date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()} ${
		date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
	}/${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}/${date.getFullYear()}`;

	const member = await client.guilds.cache.first().members.fetch(interaction.member.id);
	const channel = await client.guilds.cache.first().channels.fetch(interaction.channel.id);

	let action;
	if (interaction.isCommand()) {
		action = `Slash Command: ${interaction.commandName}`;
	} else if (interaction.isButton()) {
		action = `Button: ${interaction.customId}`;
	} else if (interaction.isStringSelectMenu()) {
		action = `Select Menu: ${interaction.customId} -> ${interaction.values[0]}`;
	} else if (interaction.isContextMenu()) {
		action = `${interaction.isUserContextMenu() ? 'User' : 'Message'} Context Menu ${interaction.commandName}`;
	}

	if (interaction.options) {
		for (let option of interaction.options.data) {
			if (option.type === 'SUB_COMMAND') {
				action += `\n     + ${option.type}: ${option.name}`;
				for (let subcommand_option of option.options) {
					action += `\n     + ${subcommand_option.type}_OPTION: ${subcommand_option.name} -> ${subcommand_option.value}`;
				}
			} else {
				action += `\n     + ${option.type}_OPTION: ${option.name} -> ${option.value}`;
			}
		}
	}

	await client.guilds.cache.first().channels.cache.get(client.config.interactionLogs).send({ content: `\`\`\`\n[${time}]\n + ${member.user.tag}\n + ${channel.name}\n + ${action}\`\`\``, });
};

const logMessageDelete = async (client, message) => {
	const files = [];
	if (message.attachments.size > 0) {
		for (let [id, attachment] of message.attachments.entries()) {
			files.push(attachment);
		}
	}

	const embed = new EmbedBuilder().setTitle(`Message Deleted`).setColor('Red').setTimestamp()
		.setDescription(
			`Message from <@${message.author.id}> in <#${message.channel.id}>\n` +
			`\`\`\`${files.length === 0 ? message.content : message.content.length > 0 ? message.content + '\n(See Images)' : 'See Images'}\`\`\``
		);

	await client.guilds.cache.first().channels.cache.get(client.config.messageLogs).send({
		embeds: [embed],
		files: files.length > 0 ? files : [],
	});
}

const logMessageEdit = async (client, oldMessage, newMessage) => {
	const files = [];
	if (oldMessage.attachments.size > 0) {
		for (let [id, attachment] of oldMessage.attachments.entries()) {
			files.push(attachment);
		}
	}
	if (newMessage.attachments.size > 0) {
		for (let [id, attachment] of newMessage.attachments.entries()) {
			files.push(attachment);
		}
	}

	const embed = new EmbedBuilder().setTitle(`Message Edited`).setColor('Blurple').setTimestamp()
	embed.setDescription(
		`Message from <@${newMessage.member.id}> in <#${newMessage.channel.id}>\n\n` +
		`**Old Message:**\n\`\`\`${files.length === 0 ? oldMessage.content : oldMessage.content.length > 0 ? oldMessage.content + `\n(See Images)` : `See Images`}\`\`\`` +
		`**New Message:**\n\`\`\`${files.length === 0 ? newMessage.content : newMessage.content.length > 0 ? newMessage.content + `\n(See Images)` : `See Images`}\`\`\`` +
		`[Go to message](${newMessage.url})`
	);

	await client.guilds.cache.first().channels.cache.get(client.config.messageLogs).send({
		embeds: [embed],
		files: files.length > 0 ? files : [],
	});
}

const logCommand = async (client, interaction) => {
	if (client.config.logBlacklist.includes(interaction.channel.id)) return;

	const message = await interaction.fetchReply();
	await client.guilds.cache.first().channels.cache.get(client.config.punishmentLogs).send({
		embeds: [
			new EmbedBuilder().setTitle('Command Run').setColor('Blurple').setTimestamp()
				.setDescription(`Command \`/${interaction.commandName}\` run by <@${interaction.member.id}> in <#${interaction.channel.id}>\n[Go to message](${message.url})`)
		],
	});
}

module.exports = { startup, log, db, logInteraction, logMessageDelete, logMessageEdit, logCommand };