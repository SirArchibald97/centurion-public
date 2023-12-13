const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getSphinxRiddles, isUsingPlutus, addExp, giveCents, takeItem } = require('../../utils/db');

module.exports = {
	id: 'sphinx_key',
	name: 'Sphinx Key',
	desc: 'Creates a riddle you can only answer once for an EXP and Cent reward!',
	rarity: 'Rare',
	price: 200,

	async event(client, interaction) {
		const riddles = await getSphinxRiddles(client.conn);
		const randomIndex = Math.floor(Math.random() * riddles.length);

		const riddleParts = riddles[randomIndex].content.split('|');
		const answers = riddleParts[1].split(',');
		const correctAnswer = answers[riddleParts[2]];

		let embed = new EmbedBuilder().setTitle('The Sphinx Key has summoned a riddle!').setDescription(`Answer the riddle below to recieve an EXP and Cent reward!\n\n\`\`\`${riddleParts[0]}\`\`\``).setColor('Blurple');
		let row = new ActionRowBuilder().addComponents(
			new StringSelectMenuBuilder().setCustomId('riddle').setPlaceholder('Choose an answer...')
				.setOptions([
					{ label: answers[0], value: answers[0] },
					{ label: answers[1], value: answers[1] },
					{ label: answers[2], value: answers[2] },
				]),
		);

		await interaction.update({ embeds: [embed], components: [row] });

		let reply = await interaction.fetchReply();
		const filter = (int) => int.member.id === interaction.member.id;
		let collector = reply.createMessageComponentCollector({ filter: filter, max: 1 });
		collector.on('end', async (collected) => {
			let enteredAnswer = collected.first().values[0];
			const plutus = await isUsingPlutus(client.conn, interaction.member.id);
			if (enteredAnswer === correctAnswer) {
				await addExp(client.conn, interaction.member.id, 200);
				await giveCents(client.conn, interaction.member.id, plutus ? 300 : 200);
				await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setDescription(`🎁 You have correctly completed the riddle! You have recieved **200 EXP** and <:cent:1042902432914620497> **${200 * (plutus ? 1.5 : 1)}${plutus ? ' (Plutus Grace x3)' : ''}**.`)
							.setColor('Green')
					],
					components: [],
				});
			} else {
				await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(':x: You have failed the riddle! No reward for you!').setColor('Red')], components: [] });
			}
		});
		await takeItem(client.conn, interaction.member.id, this.id);
	},
};
