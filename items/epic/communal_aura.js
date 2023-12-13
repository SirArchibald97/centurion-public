const { EmbedBuilder } = require('discord.js');
const { getBoosts, getHappyHours, addBoost, takeItem, getCommunityItems, countCommunityItems, removeCommunityItems, addCommunityItem, checkForAchievement, addAchievement, getTrackedAchievement, incrementTrackedAchievement, trackAchievement } = require('../../utils/db');
const { achievement } = require('../../utils/embeds');
const { increaseAchievementLevel, increaseTrophyLevel } = require('../../utils/levels');

module.exports = {
	id: 'communal_aura',
	name: 'Communal Aura',
	desc: 'Doubles all EXP earned by everyone for 60 minutes.',
	rarity: 'Epic',
	price: 500,

	async event(client, interaction) {
		const boosts = await getBoosts(client.conn, interaction.member.id);
		let auraBoosts = boosts.filter((boost) => boost.type === 'aura');

		const happyhours = await getHappyHours(client.conn);
		if (happyhours.length > 0) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(`:x: You can not activate the ${this.name} during a happy hour.`).setColor("Red")], components: [], ephemeral: true });
		if (auraBoosts.length > 0) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(`:x: There is a ${this.name} already active!`).setColor('Red')], components: [], ephemeral: true });

		await addBoost(client.conn, interaction.member.id, this.id, 1, 60);
		await interaction.update({ embeds: [new EmbedBuilder().setTitle(`Activated ${this.name}!`).setDescription('Everyone will now earn double EXP for 30 minutes!').setColor('Green')], components: [] });
		await takeItem(client.conn, interaction.member.id, this.id);

	    
        const communityItems = await getTrackedAchievement(client.conn, interaction.member.id, "community_items");
        if (communityItems) {
            await incrementTrackedAchievement(client.conn, interaction.member.id, "community_items");
            if (communityItems.count + 1 >= 3) {
                const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "3_community_items");
                if (!hasCompleted) {
                    await addAchievement(client, interaction.member.id, "3_community_items");
                    await interaction.followUp({ content: `<@${interaction.member.id}>`, embeds: [await achievement(client.achievements.get("3_community_items"))] });
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

        } else {
            await trackAchievement(client.conn, interaction.member.id, "community_items");
        }
        
	},
};
