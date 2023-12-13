const { EmbedBuilder } = require('discord.js');
const { getBoosts, addBoost, takeItem, checkForAchievement, addAchievement } = require('../../utils/db');
const { achievement } = require('../../utils/embeds');
const { increaseAchievementLevel, increaseTrophyLevel } = require('../../utils/levels');

module.exports = {
	id: 'epic_exp_boost',
	name: 'Epic EXP Boost',
	desc: 'Provides an extra 5 EXP per message for 3 hours.',
	rarity: 'Epic',
	price: 600,

	async event(client, interaction) {
		const boosts = await getBoosts(client.conn, interaction.member.id);
		if (boosts.length > 0) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(':x: You already have an active boost!').setColor('Red')], components: [], ephemeral: true });

		await addBoost(client.conn, interaction.member.id, this.id, 5, 3 * 60);
		await interaction.update({ embeds: [new EmbedBuilder().setTitle('Activated Epic EXP Boost!').setDescription('You will gain +5 EXP per message for 3 hours!').setColor('Green')], components: [] });
		await takeItem(client.conn, interaction.member.id, this.id);

		
		const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "use_epic_boost");
		if (!hasCompleted) {
			await addAchievement(client, interaction.member.id, "use_epic_boost");
			await interaction.followUp({ embeds: [await achievement(client.achievements.get("use_epic_boost"))] });
            const levelupEmbed = await increaseAchievementLevel(client, interaction.member);
            if (levelupEmbed) {
                await interaction.followUp({ embeds: [levelupEmbed] });
            }
            const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
            if (trophyLevelUp) {
                await interaction.followUp({ embeds: [trophyLevelUp] });
            }
		}
		
	},
};
