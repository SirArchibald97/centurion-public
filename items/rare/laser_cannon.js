const { EmbedBuilder, UserSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { takeCents, removePetItem, checkForAchievement, addAchievement, getPetPouch } = require('../../utils/db');
const { secretAchievement, achievement } = require('../../utils/embeds');
const { increaseAchievementLevel, increaseTrophyLevel } = require('../../utils/levels');

module.exports = {
	id: 'laser_cannon',
	name: 'Laser Cannon',
	desc: 'Shoot a laser at a user to make them lose some Cents.',
	rarity: 'Rare',
	unfindable: true,

	async event(client, interaction) {
        const userSelectMenu = new UserSelectMenuBuilder().setCustomId("laser_cannon_user_select").setPlaceholder("Select a user to shoot!").setMinValues(1).setMaxValues(1);
		const reply = await interaction.update({
            embeds: [],
            components: [new ActionRowBuilder().addComponents(userSelectMenu)],
            fetchReply: true
        });

		const filter = (int) => int.member.id === interaction.member.id && int.customId === "laser_cannon_user_select";
		let collector = await reply.createMessageComponentCollector({ filter: filter, max: 1 });
		collector.on('end', async (collected) => {
			const user = await collected.first().guild.members.fetch(collected.first().values[0]);
			const randomNumber = Math.floor(Math.random() * (101 - 1) + 1);

			const embed = new EmbedBuilder().setTitle('Laser Cannon').setDescription(`⚡ <@${interaction.member.id}> shot a laser at <@${user.id}> and made them drop <:cent:1042902432914620497> **${randomNumber}**!`,).setColor('Green');
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

		await removePetItem(client.conn, interaction.member.id, this.id, 1, await getPetPouch(client.conn, interaction.member.id));
	},
};
