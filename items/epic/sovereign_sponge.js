const { EmbedBuilder } = require('discord.js');
const { getBoosts, addBoost, takeItem } = require('../../utils/db');

module.exports = {
	id: 'sovereign_sponge',
	name: 'Sovereign Sponge',
	desc: 'Earn in Cents what everyone earns in EXP for 30 minutes.',
	rarity: 'Epic',
	price: 1000,

	async event(client, interaction) {
		const boosts = await getBoosts(client.conn, interaction.member.id);
		if (boosts.length > 0) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(':x: You already have an active boost!').setColor('Red')], components: [], ephemeral: true });

		await addBoost(client.conn, interaction.member.id, this.id, 0, 30);
		await interaction.update({ embeds: [new EmbedBuilder().setTitle(`Activated ${this.name}!`).setDescription('You will gain in Cents what everyone else earns in EXP for 30 minutes!').setColor('Green')], components: [] });
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
