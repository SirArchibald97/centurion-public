const { EmbedBuilder } = require('discord.js');
const { getInventory, getBoosts, giveItem, removePetItem, getPetPouch } = require('../../utils/db');
const { getMaxInventorySlots } = require('../../utils/levels');

module.exports = {
	id: 'item_token',
	name: 'Item Token',
	desc: 'A token used to instantly drop an item.',
	rarity: 'Common',
	unfindable: true,

	async event(client, interaction) {
		const inventory = await getInventory(client.conn, interaction.member.id);
		const totalSlots = await getMaxInventorySlots(client.conn, client, interaction.member);
		if (inventory.length === totalSlots) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(':x: Your inventory is full!').setColor('Red')], components: [], ephemeral: true });

		const boosts = (await getBoosts(client.conn, interaction.member.id)).filter(b => b.type === "dragon");
		// common = 100%
		// uncommon = 60%
		// rare = 30%
		// epic = 10%
		// legendary = 2.5%
		//let itemChance = interaction.member.id !== "398890149607637013" ? Math.floor(Math.random() * (1001 - 1) + 1) : 100;
		let itemChance = Math.floor(Math.random() * (1001 - 1) + 1);
		if (boosts.length > 0) {
			itemChance -= 300;
			if (itemChance < 0) {
				itemChance = 0;
			}
		}
		//let itemChance = 300;

		let rarity = '';
		if (itemChance <= 25) {
			rarity = 'Legendary';
		} else if (itemChance <= 100) {
			rarity = 'Epic';
		} else if (itemChance <= 300) {
			rarity = 'Rare';
		} else if (itemChance <= 600) {
			rarity = 'Uncommon';
		} else {
			rarity = 'Common';
		}

		let possibleItems = [];
		for (let [id, item] of client.items.entries()) {
			if (item.rarity === rarity && !item.unfindable) {
				possibleItems.push(item);
			}
		}
		let randIndex = Math.floor(Math.random() * (possibleItems.length - 1) + 1);
		let chosenItem = possibleItems[randIndex - 1];

		let itemEmbed = new EmbedBuilder().setTitle('You found an item!').setColor('Blurple');
		if (interaction.member.presence?.clientStatus.mobile) {
			itemEmbed.setDescription(
				`\`\`\`css\n[${rarity}] ${chosenItem.name}\n${chosenItem.desc}\`\`\`\nUse \`/use\` or \`/craft\` to use your items!`,
			);
		} else {
			let colours = { Legendary: '33', Epic: '35', Rare: '34', Uncommon: '32', Common: '30' };
			itemEmbed.setDescription(
				`\`\`\`ansi\n[0;${colours[rarity]}m[${rarity.toUpperCase()}]  [1;37m${chosenItem.name}\n[0m${
					chosenItem.desc
				}\`\`\`\nUse \`/use\` or \`/craft\` to use your items!`,
			);
		}

		await interaction.update({ embeds: [itemEmbed], components: [] });
		await giveItem(client.conn, interaction.member.id, chosenItem.id);
		await removePetItem(client.conn, interaction.member.id, this.id, 1, await getPetPouch(client.conn, interaction.member.id));
	},
};
