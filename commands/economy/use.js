const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { getInventory, getSettings, getPetPouch } = require('../../utils/db');

module.exports = {
	data: new SlashCommandBuilder().setName('use').setDescription('Use an item from your inventory'),

	async execute(client, interaction) {
		if (client.playersUsingItems.includes(interaction.member.id)) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You are already using a different item!').setColor('Red')], ephemeral: true });
		client.playersUsingItems.push(interaction.member.id);

		const inventory = await getInventory(client.conn, interaction.member.id);
		const petPouch = await getPetPouch(client.conn, interaction.member.id);

		let usableItems = [];
		for (const entry of inventory) {
			if (!client.items.get(entry.item).material) usableItems.push(entry);
		}
		for (const entry of petPouch) {
			usableItems.push(entry);
		}

		if (usableItems.length === 0) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You have no items to use!').setColor('Red')], ephemeral: true });

		let embed = new EmbedBuilder().setDescription('Choose an item from the list below to use!').setColor('Blurple');
		let menu = new StringSelectMenuBuilder().setCustomId('use-inventory').setPlaceholder('Select an item...');
		for (let entry of usableItems) {
			let item = client.items.get(entry.item);
			menu.addOptions([{ label: `${item.name} (x${entry.quantity})`, value: item.id }]);  
		}
		let row = new ActionRowBuilder().addComponents(menu);

		const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
		const filter = (int) => int.member.id === interaction.member.id;
		let collector = reply.createMessageComponentCollector({ filter: filter, max: 1, time: 30_000 });
		collector.on('end', async (collectedSelectMenu) => {
			if (collectedSelectMenu.size === 0) {
				client.playersUsingItems.splice(client.playersUsingItems.indexOf(interaction.member.id), 1);
                try {
				    return await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(':x: Operation timed out!').setColor('Red')], components: [] });
                } catch (e) {
                    return;
                }
			}

			let item = client.items.get(collectedSelectMenu.first().values[0]);

			const settings = (await getSettings(client.conn, interaction.member.id))[0];
			if (settings.ITEM_CONFIRM === 1) {
				let confirmRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('use-confirm').setLabel('CONFIRM').setStyle(ButtonStyle.Success));
				let confirmEmbed = new EmbedBuilder().setDescription(`Press confirm below within 10 seconds to confirm the use of one **${item.name}**!`).setColor('Blurple');
				await collectedSelectMenu.first().update({ embeds: [confirmEmbed], components: [confirmRow] });

				let confirmReply = await collectedSelectMenu.first().fetchReply();
				const confirmFilter = (int) => int.member.id === interaction.member.id && int.customId === 'use-confirm';
				collector = confirmReply.createMessageComponentCollector({ filter: confirmFilter, max: 1, time: 10000 });
				collector.on('end', async (collected) => {
					if (collected.size === 0) {
						await collectedSelectMenu.first().editReply({ embeds: [new EmbedBuilder().setDescription(':x: Operation timed out!').setColor('Red')], components: [] });
						client.playersUsingItems.splice(client.playersUsingItems.indexOf(interaction.member.id), 1);
					} else {
						const inventory = await getInventory(client.conn, interaction.member.id);
						let itemIDs = [];
						inventory.forEach((item) => itemIDs.push(item.item));
						petPouch.forEach((item) => itemIDs.push(item.item));
						if (!itemIDs.includes(item.id))
							return await collected.first().update({
								embeds: [new EmbedBuilder().setDescription(':x: You no longer have this item!').setColor('Red')],
								components: [],
                                ephemeral: true,
							});
						item.event(client, collected.first());
						client.playersUsingItems.splice(client.playersUsingItems.indexOf(interaction.member.id), 1);
					}
				});
			} else {
				const inventory = await getInventory(client.conn, interaction.member.id);
				let itemIDs = [];
				inventory.forEach((item) => itemIDs.push(item.item));
				petPouch.forEach((item) => itemIDs.push(item.item));
				if (!itemIDs.includes(item.id))
                    return await collectedSelectMenu.first().update({
                        embeds: [new EmbedBuilder().setDescription(':x: You no longer have this item!').setColor('Red')],
                        components: [],
                        ephemeral: true
                    });
				item.event(client, collectedSelectMenu.first());
				client.playersUsingItems.splice(client.playersUsingItems.indexOf(interaction.member.id), 1);
			}
		});
	},
};
