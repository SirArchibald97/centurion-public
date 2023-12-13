const { EmbedBuilder, UserSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { takeCents, takeItem, checkForAchievement, addAchievement } = require('../../utils/db');
const { secretAchievement, achievement } = require('../../utils/embeds');
const { increaseAchievementLevel, increaseTrophyLevel } = require('../../utils/levels');

module.exports = {
	id: 'lightning_stick',
	name: 'Lightning Stick',
	desc: 'Target a user and zap some of their Cents.',
	rarity: 'Epic',
	price: 750,

	async event(client, interaction) {
        const userSelectMenu = new UserSelectMenuBuilder().setCustomId("lightning_user_select").setPlaceholder("Select a user to strike!").setMinValues(1).setMaxValues(1);
		const reply = await interaction.update({
            embeds: [],
            components: [new ActionRowBuilder().addComponents(userSelectMenu)],
            fetchReply: true
        });

		const filter = (int) => int.member.id === interaction.member.id && int.customId === "lightning_user_select";
		const collector = await reply.createMessageComponentCollector({ filter: filter, max: 1 });
		collector.on('end', async (collected) => {
            const user = await collected.first().guild.members.fetch(collected.first().values[0]);
			const randomNumber = Math.floor(Math.random() * (501 - 101) + 1);

			const embed = new EmbedBuilder().setTitle(this.name).setDescription(`⚡ <@${interaction.member.id}> struck <@${user.id}> with lightning and made them drop <:cent:1042902432914620497> **${randomNumber}**!`).setColor('Green');
			await collected.first().update({ content: `<@${interaction.member.id}> <@${user.id}>`, embeds: [embed], components: [] });

			await takeCents(client.conn, user.id, randomNumber);

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
			
			
            
            const attackee = await interaction.guild.members.fetch(user.id);
			if (attackee.roles.cache.has(client.config.directorRole) || attackee.roles.cache.has(client.config.centRole)) {
				const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "lightning_director");
				if (!hasCompleted) {
					await addAchievement(client, interaction.member.id, "lightning_director");
					await interaction.followUp({ embeds: [await achievement(client.achievements.get("lightning_director"))] });
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
