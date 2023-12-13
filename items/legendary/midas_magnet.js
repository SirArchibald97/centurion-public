const { EmbedBuilder } = require('discord.js');
const { getBoosts, addBoost, removePetItem, getPetPouch } = require('../../utils/db');

module.exports = {
	id: 'midas_magnet',
	name: 'Midas Magnet',
	desc: 'Gain a higher chance to find rarer items for 3 hours.',
	rarity: 'Legendary',
	unfindable: true,

	async event(client, interaction) {
		const boosts = await getBoosts(client.conn, interaction.member.id);
		if (boosts.length > 0) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(':x: You already have an active boost!').setColor('Red')], components: [], ephemeral: true });

		await addBoost(client.conn, interaction.member.id, this.id, 0, 60 * 3);
		await interaction.update({ embeds: [new EmbedBuilder().setTitle('Activated Midas Magnet!').setDescription('You will gain a higher chance to find rarer items for 3 hours!').setColor('Green')], components: [] });
		await removePetItem(client.conn, interaction.member.id, this.id, 1, await getPetPouch(client.conn, interaction.member.id));
	},
};
