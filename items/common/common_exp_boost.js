const { EmbedBuilder } = require('discord.js');
const { addBoost, takeItem, getBoosts } = require('../../utils/db');

module.exports = {
	id: 'common_exp_boost',
	name: 'Common EXP Boost',
	desc: 'Provides an extra 3 EXP per message for 30 minutes.',
	rarity: 'Common',
	price: 100,

	async event(client, interaction) {
		const boosts = await getBoosts(client.conn, interaction.member.id);
		if (boosts.length > 0) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(':x: You already have an active boost!').setColor('Red')], components: [], ephemeral: true });

		await addBoost(client.conn, interaction.member.id, this.id, 3, 30);
		await takeItem(client.conn, interaction.member.id, this.id);
		await interaction.update({ embeds: [new EmbedBuilder().setTitle('Activated Common EXP Boost!').setDescription('You will gain +3 EXP per message for 30 minutes!').setColor('Green')], components: [] });
	},
};
