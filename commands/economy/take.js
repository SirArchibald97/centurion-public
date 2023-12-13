const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, SlashCommandBuilder } = require('discord.js');
const { getUser, getInventory, takeCents, takeItem } = require('../../utils/db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('take')
		.setDescription('Take an item from a user')
		.addUserOption((user) => user.setName('user').setDescription('Select a user').setRequired(true)),

	async execute(client, interaction) {
		if (!interaction.member.roles.cache.has(client.config.directorRole) && !interaction.member.roles.cache.has(client.config.centRole))
			return interaction.reply({
				embeds: [new EmbedBuilder().setDescription(':x: You are not allowed to use this command!').setColor('Red')],
				ephemeral: true,
			});

		let user = interaction.options.getMember('user');
		if (!user || user.user.bot) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(`:x: This member does not seem to exist, or they are a bot.`).setColor('Red')], ephemeral: true });

		const centInfo = (await getUser(client.conn, user.id))[0];
		let inventory = await getInventory(client.conn, user.id);
		let embed = new EmbedBuilder().setDescription('Choose an item from the list below to use!').setColor('Blurple');
		let menu = new StringSelectMenuBuilder().setCustomId('take-inventory').setPlaceholder('Select an item...');
		for (let entry of inventory) {
			let item = client.items.get(entry.item);
			menu.addOptions([{ label: `${item.name} (x${entry.quantity})`, value: `${item.id}:${entry.quantity}` }]);
		}

		if (centInfo?.cents > 0) {
			menu.addOptions([{ label: `Cents Purse (¢${centInfo.cents})`, value: `purse_cents:${centInfo.cents}` }]);
		}

		if (centInfo?.bank > 0) {
			menu.addOptions([{ label: `Cents Bank (¢${centInfo.bank})`, value: `bank_cents:${centInfo.bank}` }]);
		}

		let row = new ActionRowBuilder().addComponents(menu);

		await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
		let reply = await interaction.fetchReply();
		const filter = (int) => int.member.id === interaction.member.id;
		let collector = reply.createMessageComponentCollector({ filter: filter, componentType: 'SELECT_MENU', max: 1 });
		collector.on('end', async (collectedSelectMenu) => {
			const [value, max] = collectedSelectMenu.first().values[0].split(':');

			let item;
			let isTakingCents = false;
			if (value === 'purse_cents' || value === 'bank_cents') {
				item = value;
				isTakingCents = true;
			} else {
				item = client.items.get(value);
			}

			await collectedSelectMenu.first().update({
				embeds: [new EmbedBuilder().setTitle(`Taking ${isTakingCents ? 'Cents' : 'Items'}`).setDescription(`How ${isTakingCents ? 'much cents' : 'many items'} do you want to take?`).setColor('Blurple')],
				components: [],
			});

			const filter = (msg) => {
				if (parseInt(msg.content) && msg.member.id === interaction.member.id) {
					if (parseInt(msg.content) > 0 && parseInt(msg.content) <= max) {
						return true;
					}
				}
				return false;
			};

			let collector = await interaction.channel.createMessageCollector({ filter: filter, max: 1 });
			collector.on('end', async (collected) => {
				await collected.first().delete();
				const amount = parseInt(collected.first().content);

				if (isTakingCents) {
					await takeCents(client.conn, user.id, amount);
				} else {
					for (let i = 0; i < amount; i++) {
						await takeItem(client.conn, user.id, item.id);
					}
				}

				await collectedSelectMenu.first().editReply({
					embeds: [new EmbedBuilder().setDescription(`✅ Removed **${isTakingCents ? `¢${amount} (${item === 'purse_cents' ? 'Purse' : 'Bank'})` : `${amount}x ${item.name}`}** from <@${user.id}>!`).setColor('Green')],
					components: [],
				});
			});
		});
	},
};
