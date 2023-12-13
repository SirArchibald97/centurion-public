const { EmbedBuilder } = require('discord.js');
const { isUsingPlutus, takeItem, giveCents } = require('../../utils/db');

module.exports = {
	id: 'midas_capsule',
	name: 'Midas Capsule',
	desc: 'Instantly receive ¢1000.',
	rarity: 'Epic',
	price: 1000,

	async event(client, interaction) {
		const plutus = await isUsingPlutus(client.conn, interaction.member.id);
		await giveCents(client.conn, interaction.member.id, plutus ? 1500 : 1000);
		await interaction.update({ embeds: [new EmbedBuilder().setDescription(`🎁 You have received <:cent:1042902432914620497> **${1000 * (plutus ? 1.5 : 1)}${plutus ? ' (Plutus Grace x3)' : ''}**!`).setColor("Green")], components: [] });
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
