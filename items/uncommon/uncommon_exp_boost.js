const { EmbedBuilder } = require('discord.js');
const { getBoosts, addBoost, takeItem } = require('../../utils/db');

module.exports = {
	id: 'uncommon_exp_boost',
	name: 'Uncommon EXP Boost',
	desc: 'Provides an extra 3 EXP per message for 2 hours.',
	rarity: 'Uncommon',
	price: 250,

	async event(client, interaction) {
		const boosts = await getBoosts(client.conn, interaction.member.id);
		if (boosts.length > 0) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(':x: You already have an active boost!').setColor('Red')], components: [], ephemeral: true });

		await addBoost(client.conn, interaction.member.id, this.id, 3, 60 * 2);
		await interaction.update({ embeds: [new EmbedBuilder().setTitle('Activated Uncommon EXP Boost!').setDescription('You will gain +3 EXP per message for 2 hours!').setColor('Green')], components: [] });
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
