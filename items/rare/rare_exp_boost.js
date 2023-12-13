const { EmbedBuilder } = require('discord.js');
const { getBoosts, addBoost, takeItem } = require('../../utils/db');

module.exports = {
	id: 'rare_exp_boost',
	name: 'Rare EXP Boost',
	desc: 'Provides an extra 5 EXP per message for 60 minutes.',
	rarity: 'Rare',
	price: 400,

	async event(client, interaction) {
		const boosts = await getBoosts(client.conn, interaction.member.id);
		if (boosts.length > 0) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(':x: You already have an active boost!').setColor('Red')], components: [], ephemeral: true });

		await addBoost(client.conn, interaction.member.id, this.id, 5, 60);
		await interaction.update({ embeds: [new EmbedBuilder().setTitle('Activated Rare EXP Boost!').setDescription('You will gain +5 EXP per message for 60 minutes!').setColor('Green')], components: [] });
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
