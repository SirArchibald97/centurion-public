const { EmbedBuilder } = require('discord.js');
const { getBoosts, addBoost, takeItem } = require('../../utils/db');

module.exports = {
	id: 'golden_vac',
	name: 'Golden Vac',
	desc: 'Earn no EXP from messages, but earn Cents instead for 30 minutes!',
	rarity: 'Rare',
	price: 500,

	async event(client, interaction) {
		const boosts = await getBoosts(client.conn, interaction.member.id);
		if (boosts.length > 0) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(':x: You already have an active boost!').setColor('Red')], components: [], ephemeral: true });

		await addBoost(client.conn, interaction.member.id, this.id, 0, 30);
		await interaction.update({ embed: [new EmbedBuilder().setTitle(`Activated ${this.name}!`).setDescription('You will now gain all EXP as Cents for 30 minutes!').setColor('Green')], components: [], });
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
