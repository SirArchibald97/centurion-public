const { EmbedBuilder } = require('discord.js');
const { addExp, takeItem, checkForAchievement, addAchievement, getExpTanks, getTrackedAchievement, trackAchievement, incrementTrackedAchievement } = require('../../utils/db');
const { achievement } = require('../../utils/embeds');
const { increaseAchievementLevel, increaseTrophyLevel } = require('../../utils/levels');

module.exports = {
	id: 'exp_tank',
	name: 'Tank of EXP',
	desc: 'Instantly receive 300 EXP.',
	rarity: 'Legendary',
	price: 300,

	async event(client, interaction) {
		await addExp(client.conn, interaction.member.id, 300);
		await interaction.update({ embeds: [new EmbedBuilder().setDescription('🎁 You have received **300 EXP**!').setColor('Green')], components: [] });
		await takeItem(client.conn, interaction.member.id, this.id);

		
		const tanksUsed = (await getTrackedAchievement(client.conn, interaction.member.id, "exp_tanks"));
        if (!tanksUsed) {
            await trackAchievement(client.conn, interaction.member.id, "exp_tanks");
        } else {
            if (tanksUsed.count + 1 >= 3) {
                const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "use_3_tanks");
                if (!hasCompleted) {
                    await addAchievement(client, interaction.member.id, "use_3_tanks");
                    await interaction.followUp({ embeds: [await achievement(client.achievements.get("use_3_tanks"))] });
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
                await incrementTrackedAchievement(client.conn, interaction.member.id, "exp_tanks");
            }
        }
        
		
	},
};
