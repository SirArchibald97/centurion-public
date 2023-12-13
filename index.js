const { Client, Partials, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: Object.values(GatewayIntentBits).filter(value => isNaN(value)), partials: [Partials.Message, Partials.Channel, Partials.Reaction] });
client.config = require('./config');
client.login(client.config.token);

const mysql = require('mysql');
client.conn = new mysql.createConnection(client.config.db);

fs.readdir('./events/', (err, files) => {
	if (err) return console.error(err);
	let count = 0;
	for (const file of files) {
		const event = require(`./events/${file}`);
		client.on(event.type, event.bind(null, client));
		count += 1;
	}
});

(client.items = new Collection()), (itemCount = 0);
const dirs = fs.readdirSync(__dirname + '/items/');
for (const dir of dirs) {
	const files = fs.readdirSync(__dirname + `/items/${dir}`);
	for (const file of files) {
		const item = require(__dirname + `/items/${dir}/${file}`);
		client.items.set(item.id, item);
		itemCount += 1;
	}
}

// error handling
process.on('uncaughtException', function (err) {
	// Handle the error safely
	console.log('\u001b[31m───── Uncaught Exception Error Start ─────\u001b[0m');
	console.log(err);
	console.log('\u001b[31m───── Uncaught Exception Error End ─────\u001b[0m');
});

process.on('unhandledRejection', function (err) {
	// Handle the error safely
	console.log('\u001b[31m───── Uncaught Rejection Error Start ─────\u001b[0m');
	console.log(err);
	console.log('\u001b[31m───── Uncaught Rejection Error End ─────\u001b[0m');
});
