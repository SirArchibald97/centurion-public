const { EmbedBuilder } = require('discord.js');
const { getBoosts, addBoost, removePetItem, getPetPouch } = require('../../utils/db');

module.exports = {
	id: 'vulture_gift',
	name: 'Gift of the Vulture',
	desc: 'Increases your chance to find items for 3 hours.',
	rarity: 'Epic',
	unfindable: true,

	async event(client, interaction) {
		const boosts = await getBoosts(client.conn, interaction.member.id);
		if (boosts.length > 0) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(':x: You already have an active boost!').setColor('Red')], components: [], ephemeral: true });

		await addBoost(client.conn, interaction.member.id, this.id, 0, 60 * 3);
		await interaction.update({ embeds: [new EmbedBuilder().setTitle('Activated Gift of the Vulture!').setDescription('You have a higher chance to find items for 3 hours!').setColor('Green')], components: [] });
		await removePetItem(client.conn, interaction.member.id, this.id, 1, await getPetPouch(client.conn, interaction.member.id));
	},
};
