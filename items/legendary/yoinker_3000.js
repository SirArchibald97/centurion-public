const { EmbedBuilder, UserSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { takeCents, giveCents, takeItem, checkForAchievement, addAchievement, getUser } = require('../../utils/db');
const { achievement } = require('../../utils/embeds');
const { increaseAchievementLevel, increaseTrophyLevel } = require('../../utils/levels');

module.exports = {
	id: 'yoinker_3000',
	name: 'Yoinker 3000',
	desc: 'Target a user and steal some of their Cents.',
	rarity: 'Legendary',
	price: 1000,

	async event(client, interaction) {
        const userSelectMenu = new UserSelectMenuBuilder().setCustomId("yoinker_user_select").setPlaceholder("Select a user to yoink cents from!").setMinValues(1).setMaxValues(1);
		const reply = await interaction.update({
            embeds: [],
            components: [new ActionRowBuilder().addComponents(userSelectMenu)],
            fetchReply: true
        });

		const filter = (int) => int.member.id === interaction.member.id && int.customId === "yoinker_user_select";
		const collector = await reply.createMessageComponentCollector({ filter: filter, max: 1 });
		collector.on('end', async (collected) => {
            const user = await collected.first().guild.members.fetch(collected.first().values[0]);
			let randomNumber = Math.floor(Math.random() * (1001 - 1) + 1);
            if (user.id === interaction.member.id) {
                const currentCents = (await getUser(client.conn, interaction.member.id))[0].cents;
                if (currentCents < randomNumber) {
                    randomNumber = currentCents;
                }
            }

			const embed = new EmbedBuilder().setTitle(this.name).setDescription(`💰 <@${interaction.member.id}> stole **¢${randomNumber}** from <@${user.id}>!`).setColor('Green');
			await collected.first().update({ content: `<@${interaction.member.id}> <@${user.id}>`, embeds: [embed], components: [] });

			await takeCents(client.conn, user.id, randomNumber);
			await giveCents(client.conn, interaction.member.id, randomNumber);

			
			if (interaction.member.id === user.id) {
				const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "negative_item_on_self");
				if (!hasCompleted) {
					await addAchievement(client, interaction.member.id, "negative_item_on_self");
					await interaction.followUp({ embeds: [await secretAchievement(client.achievements.get("negative_item_on_self"))] });
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
			
			
			if (randomNumber < 100) {
				const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "use_yoinker");
				if (!hasCompleted) {
					await addAchievement(client, interaction.member.id, "use_yoinker");
					await interaction.followUp({ embeds: [await achievement(client.achievements.get("use_yoinker"))] });
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
			
			
			if (user.id === "303468436233912330") {
				const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "negative_item_centranos");
				if (!hasCompleted) {
					await addAchievement(client, interaction.member.id, "negative_item_centranos");
					await interaction.followUp({ embeds: [await achievement(client.achievements.get("negative_item_centranos"))] });
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
		await takeItem(client.conn, interaction.member.id, this.id, 1);
	},
};
