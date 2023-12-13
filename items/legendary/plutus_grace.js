const { EmbedBuilder } = require('discord.js');
const { getBoosts, addBoost, takeItem } = require('../../utils/db');

module.exports = {
	id: 'plutus_grace',
	name: 'Plutus Grace',
	desc: 'Earn +50% Cents for 1 hour!',
	rarity: 'Legendary',
	craftable: true,
	recipe: [{ item: 'ruby', quantity: 3 }],
	unfindable: true,
    giftable: true,
	price: 1500,

	async event(client, interaction) {
		const boosts = await getBoosts(client.conn, interaction.member.id);
		if (boosts.length > 0) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(':x: You already have an active boost!').setColor('Red')], components: [], ephemeral: true });

		await addBoost(client.conn, interaction.member.id, this.id, 0, 60);
		await interaction.update({ embeds: [new EmbedBuilder().setTitle("Activated Plutus' Grace!").setDescription('You will gain +50% Cents for 1 hour!').setColor('Green')] ,components: [] });
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
