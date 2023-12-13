const { EmbedBuilder } = require('discord.js');
const { getBoosts, addBoost, takeItem } = require('../../utils/db');

module.exports = {
	id: 'legendary_exp_boost',
	name: 'Legendary EXP Boost',
	desc: 'Provides an extra 7 EXP per message for 3 hours.',
	rarity: 'Legendary',
	price: 850,

	async event(client, interaction) {
		const boosts = await getBoosts(client.conn, interaction.member.id);
		if (boosts.length > 0) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(':x: You already have an active boost!').setColor('Red')], components: [], ephemeral: true });

		await addBoost(client.conn, interaction.member.id, this.id, 7, 60 * 3);
		await interaction.update({ embeds: [new EmbedBuilder().setTitle('Activated Legendary EXP Boost!').setDescription('You will gain +7 EXP per message for 3 hours!').setColor('Green')], components: [] });
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
