const { EmbedBuilder } = require('discord.js');
const { giveCents, takeItem, getCommunityItems, addCommunityItem, removeCommunityItems, countCommunityItems, addAchievement, checkForAchievement, getTrackedAchievement, trackAchievement, incrementTrackedAchievement } = require('../../utils/db');
const { achievement } = require('../../utils/embeds');
const { increaseAchievementLevel, increaseTrophyLevel } = require('../../utils/levels');

module.exports = {
	id: 'coinicopia',
	name: 'Coinicopia',
	desc: 'Spawns a shower of coins for anyone to collect!',
	rarity: 'Legendary',
	price: 2500,


	async event(client, interaction) {
		await interaction.update({ embeds: [new EmbedBuilder().setDescription(`:white_check_mark: You have used a **${this.name}**!`).setColor('Green'),], components: [] });
 
		const words = ['amongus', 'centranos', 'hypixel', 'gm', 'doughnut', 'bedwars', 'coconut', 'youtube', 'hehehehaw', 'archieisthebest', 'bald'];
		const chosenWord = words[Math.floor(Math.random() * (words.length - 1) + 1) - 1];

		let startEmbed = new EmbedBuilder()
			.setTitle(`${interaction.member.user.username} used a ${this.name}!`)
			.setDescription(`Type the random phrase to fill the ${this.name} and collect some free cents!\n\`\`\`${chosenWord}\`\`\`\nThe more people help fill it, the more coins everyone gets!`,)
			.setColor('Gold');

		const reply = await interaction.guild.channels.cache.get(client.config.generalChannel).send({ embeds: [startEmbed], components: [] });
		let people = [];
		const filter = (message) => message.content.toLowerCase() === chosenWord;
		const collector = reply.channel.createMessageCollector({ filter: filter, time: 30000 });

		collector.on('collect', async (message) => {
			if (!people.includes(message.member.id)) {
				await message.react('⭐');
				people.push(message.member.id);
			}
		});

		collector.on('end', async (collected) => {
			const cents = Math.floor(1000 * (1.25 ** (people.length)));
			for (let [id, message] of collected.entries()) { await giveCents(client.conn, message.member.id, Math.round(cents / people.length)); }

			let endEmbed;
			if (people.length < 1) {
				endEmbed = new EmbedBuilder().setDescription(`:rolling_eyes: Nobody helped fill the ${this.name}, not even the one who used it...`).setColor('Red');
			} else {
				endEmbed = new EmbedBuilder().setTitle(`The ${this.name} has been filled!`).setDescription(`**${people.length} people** helped fill the ${this.name} with <:cent:1042902432914620497> **${Math.floor(cents)}**!\nEach person will get <:cent:1042902432914620497> **${Math.floor(cents / people.length)}**!`).setColor('Gold');
			}

			await reply.reply({ embeds: [endEmbed] });
		});
		await takeItem(client.conn, interaction.member.id, this.id);

		
        const communityItemUsed = await getTrackedAchievement(client.conn, interaction.member.id, "community_items");
            if (communityItemUsed) {
                if (communityItemUsed.count + 1 >= 3) {
                    const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "3_community_items");
                    if (!hasCompleted) {
                        await addAchievement(client, interaction.member.id, "3_community_items");
                        await interaction.followUp(({ embeds: [await achievement(client.achievements.get("3_community_items"))] }));
                        const levelupEmbed = await increaseAchievementLevel(client, interaction.member);
                        if (levelupEmbed) {
                            await interaction.followUp({ embeds: [levelupEmbed] });
                        }
                        const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                        if (trophyLevelUp) {
                            await interaction.followUp({ embeds: [trophyLevelUp] });
                        }
                    }
                } else {
                    await incrementTrackedAchievement(client.conn, interaction.member.id, "community_items");
                }
            } else {
                await trackAchievement(client.conn, interaction.member.id, "community_items");
            }		
	},
};
