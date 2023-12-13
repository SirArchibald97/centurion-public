const { EmbedBuilder } = require('discord.js');
const { addExp, takeItem } = require('../../utils/db');

module.exports = {
	id: 'exp_bottle',
	name: 'Bottle of EXP',
	desc: 'Instantly receive 75 EXP.',
	rarity: 'Uncommon',
	price: 75,

	async event(client, interaction) {
		await addExp(client.conn, interaction.member.id, 75);
		await interaction.update({ embeds: [new EmbedBuilder().setDescription('🎁 You have received **75 EXP**!').setColor('Green')], components: [], });
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
