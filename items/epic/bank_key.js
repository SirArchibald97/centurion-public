const { EmbedBuilder } = require('discord.js');
const { getUser, openBankAccount, takeItem } = require('../../utils/db');

module.exports = {
	id: 'bank_key',
	name: 'Bank Key',
	desc: 'A special key used to open a Bank Account.',
	rarity: 'Epic',
    price: 500,

	async event(client, interaction) {
		const player = (await getUser(client.conn, interaction.member.id))[0];
		if (player.hasBank === 1) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(':x: You already have a bank account!').setColor('Red')], components: [], ephemeral: true });
		if (player.level < 20) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(':x: You must be at least `Level 20` to open a bank account!').setColor('Red'),], components: [], ephemeral: true });

		await openBankAccount(client.conn, interaction.member.id);
		await interaction.update({ embeds: [new EmbedBuilder().setDescription('✅ You have opened a bank account!').setColor('Green')], components: [], });
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
