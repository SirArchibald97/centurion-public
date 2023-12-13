const { EmbedBuilder, ActionRowBuilder, UserSelectMenuBuilder } = require('discord.js');
const { isUsingPlutus, giveCents, addExp, takeItem, checkForAchievement, addAchievement } = require('../../utils/db');
const { achievement } = require('../../utils/embeds');
const { increaseAchievementLevel, increaseTrophyLevel } = require('../../utils/levels');

module.exports = {
	id: 'simple_gift',
	name: 'Simple Gift',
	desc: 'Give this present to another user and both receive a small amount of Cents and EXP.',
	rarity: 'Common',
	price: 50,

	async event(client, interaction) {
        const userSelectMenu = new UserSelectMenuBuilder().setCustomId("gift_user_select").setPlaceholder("Select a user to gift to!").setMinValues(1).setMaxValues(1);
		const reply = await interaction.update({
            embeds: [],
            components: [new ActionRowBuilder().addComponents(userSelectMenu)],
            fetchReply: true
        });

		const filter = (int) => int.member.id === interaction.member.id && int.customId === "gift_user_select";
		const collector = await reply.createMessageComponentCollector({ filter: filter, max: 1 });
		collector.on('end', async (collected) => {
			const user = await collected.first().guild.members.fetch(collected.first().values[0]);
			const randomNumber = interaction.member.id !== "1012803313038798868" ? Math.floor(Math.random() * (101 - 1) + 1) : 1;

			const executorPlutus = await isUsingPlutus(client.conn, interaction.member.id);
			const executeePlutus = await isUsingPlutus(client.conn, user.id);
			const embed = new EmbedBuilder()
				.setTitle(this.name)
				.setDescription(`🎁 <@${interaction.member.id}> gave a gift to <@${user.id}> and they both received <:cent:1042902432914620497> **${randomNumber}** and **${randomNumber} EXP**!`)
				.setColor('Green');
			await collected.first().update({ content: `<@${interaction.member.id}> <@${user.id}>`, embeds: [embed], components: [] });

			await giveCents(client.conn, interaction.member.id, executorPlutus ? randomNumber * 1.5 : randomNumber);
			await giveCents(client.conn, user.id, executeePlutus ? randomNumber * 1.5 : randomNumber);
			await addExp(client.conn, interaction.member.id, randomNumber);
			await addExp(client.conn, user.id, randomNumber);
			await takeItem(client.conn, interaction.member.id, this.id, 1);

			
			if (randomNumber === 1) {
				const hasCompletedUser = await checkForAchievement(client.conn, interaction.member.id, "gift_1_cent");
				const hasCompletedUsee = await checkForAchievement(client.conn, user.id, "gift_1_cent");
				if (!hasCompletedUser) {
					await addAchievement(client, interaction.member.id, "gift_1_cent");
					await interaction.channel.send({ content: `<@${interaction.member.id}>`, embeds: [await achievement(client.achievements.get("gift_1_cent"))] });
                    const levelupEmbed = await increaseAchievementLevel(client, interaction.member);
                    if (levelupEmbed) {
                        await interaction.followUp({ embeds: [levelupEmbed] });
                    }
                    const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                    if (trophyLevelUp) {
                        await interaction.followUp({ embeds: [trophyLevelUp] });
                    }
				}
				if (!hasCompletedUsee) {
					await addAchievement(client, user.id, "gift_1_cent");
					await interaction.channel.send({ content: `<@${user.id}>`, embeds: [await achievement(client.achievements.get("gift_1_cent"))] });
                    const levelupEmbed = await increaseAchievementLevel(client, interaction.member);
                    if (levelupEmbed) {
                        await interaction.followUp({ embeds: [levelupEmbed] });
                    }
                    const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                    if (trophyLevelUp) {
                        await interaction.followUp({ embeds: [trophyLevelUp] });
                    }
				}
			}
		});
	},
};
