const { EmbedBuilder } = require('discord.js');
const { isUsingPlutus, giveCents, takeItem } = require('../../utils/db');

module.exports = {
	id: 'midas_chest',
	name: 'Midas Chest',
	desc: 'Instantly receive ¢2500.',
	rarity: 'Legendary',
	price: 2500,

	async event(client, interaction) {
		const plutus = await isUsingPlutus(client.conn, interaction.member.id);
		await giveCents(client.conn, interaction.member.id, plutus ? 3750 : 2500);
		await interaction.update({ embeds: [new EmbedBuilder().setDescription(`🎁 You have received <:cent:1042902432914620497> \`${2500 * (plutus ? 1.5 : 1)}${plutus ? ' (Plutus Grace x3)' : ''}\`!`).setColor('Green')], components: [] });
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
