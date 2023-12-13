const { EmbedBuilder } = require('discord.js');
const { isUsingPlutus, getUser, giveCents, takeCents, takeItem } = require('../../utils/db');

module.exports = {
	id: 'tyches_chance',
	name: "Tyche's Chance",
	desc: 'Take a 50/50 chance to either earn 1000 Cents or lose 1000 Cents.',
	rarity: 'Epic',
	craftable: true,
	recipe: [{ item: 'playing_card', quantity: 3 }],
	price: 1000,
	unfindable: true,

	async event(client, interaction) {
		const chance = Math.floor(Math.random() * 2);
		const plutus = await isUsingPlutus(client.conn, interaction.member.id);
		const currentPurse = (await getUser(client.conn, interaction.member.id))[0].cents;

		if (currentPurse < 1000 * (plutus ? 1.5 : 1))
			return await interaction.update({ embeds: [new EmbedBuilder().setDescription(`:x: You do not have <:cent:1042902432914620497> **${1000 * (plutus ? 1.5 : 1)}** in your purse.`).setColor('Red')], components: [], ephemeral: true });

		if (chance === 0) {
			await interaction.update({
				embeds: [new EmbedBuilder().setDescription(`🎲 You won! Congratulations on earning <:cent:1042902432914620497> **${1000 * (plutus ? 1.5 : 1)}${plutus ? ' (Plutus Grace x3)' : ''}**!`,).setColor('Green')],
				components: [],
			});
			await giveCents(client.conn, interaction.member.id, plutus ? 1500 : 1000);
		} else {
			await interaction.update({
				embeds: [new EmbedBuilder().setDescription(`🎲 You lost! And there go your <:cent:1042902432914620497> **${1000 * (plutus ? 1.5 : 1)}${plutus ? ' (Plutus Grace x3)' : ''}**!`,).setColor('Red')],
				components: [],
			});
			await takeCents(client.conn, interaction.member.id, plutus ? (1500 > currentPurse ? currentPurse : 1500) : (1000 > currentPurse ? currentPurse : 1000));
		}
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
