const { EmbedBuilder } = require('discord.js');
const { addExp, takeItem } = require('../../utils/db');

module.exports = {
	id: 'exp_bucket',
	name: 'Bucket of Exp',
	desc: 'Instantly receive 125 Exp.',
	rarity: 'Rare',
	price: 125,

	async event(client, interaction) {
		await addExp(client.conn, interaction.member.id, 125);
		await interaction.update({ embeds: [new EmbedBuilder().setDescription('🎁 You have received **125 EXP**!').setColor('Green')], components: [] });
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
