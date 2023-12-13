const { EmbedBuilder } = require('discord.js');
const { addExp, takeItem } = require('../../utils/db');

module.exports = {
	id: 'exp_vial',
	name: 'Vial of Exp',
	desc: 'Instantly receive 50 Exp.',
	rarity: 'Common',
	price: 50,

	async event(client, interaction) {
		await addExp(client.conn, interaction.member.id, 50);
		await interaction.update({
			embeds: [new EmbedBuilder().setDescription('🎁 You have received **50 EXP**!').setColor('Green')],
			components: [],
		});
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
