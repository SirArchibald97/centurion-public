const { EmbedBuilder } = require('discord.js');
const { addExp, takeItem } = require('../../utils/db');

module.exports = {
	id: 'exp_barrel',
	name: 'Barrel of EXP',
	desc: 'Instantly receive 200 EXP.',
	rarity: 'Epic',
	price: 200,

	async event(client, interaction) {
		await addExp(client.conn, interaction.member.id, 200);
		await interaction.update({ embeds: [new EmbedBuilder().setDescription('🎁 You have received **200 EXP**!').setColor('Green')], components: [] });
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
