const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { getInventory, takeItem, giveItem, checkForAchievement, addAchievement, removePetItem, getPetPouch } = require('../../utils/db');
const { achievement } = require('../../utils/embeds');
const { increaseAchievementLevel, increaseTrophyLevel } = require('../../utils/levels');

module.exports = {
	id: 'upgrade_token',
	name: 'Upgrade Token',
	desc: 'Upgrade the rarity of a Cent or EXP item by one level.',
	rarity: 'Legendary',
	unfindable: true,

	async event(client, interaction) {
		let expBoosts = ['common_exp_boost', 'uncommon_exp_boost', 'rare_exp_boost', 'epic_exp_boost', 'legendary_exp_boost',];
		let expItems = ['exp_vial', 'exp_bottle', 'exp_bucket', 'exp_barrel', 'exp_tank'];
		let blacklist = ['legendary_exp_boost', 'exp_tank'];

		const inventory = await getInventory(client.conn, interaction.member.id);
		let items = inventory.filter((item) => (expItems.includes(item.item) || expBoosts.includes(item.item)) && !blacklist.includes(item.item),);
		if (items.length === 0) return await interaction.update({ embeds: [new EmbedBuilder().setDescription(":x: You don't have any upgradable items!").setColor('Red')], components: [], ephemeral: true });

		let row = new ActionRowBuilder();
		let menu = new StringSelectMenuBuilder().setCustomId('menu').setPlaceholder('Select an item...');
		for (let item of items) {
			let fetchedItem = client.items.get(item.item);
			if (!blacklist.includes(fetchedItem.id)) menu.addOptions([{ label: fetchedItem.name, value: fetchedItem.id }]);
		}
		row.addComponents(menu);

		await interaction.update({ embeds: [new EmbedBuilder().setTitle(this.name).setDescription('Select an item to upgrade!').setColor('Blurple')], components: [row], ephemeral: true });

		let reply = await interaction.fetchReply();
		const filter = (int) => int.member.id === interaction.member.id;
		let collector = reply.createMessageComponentCollector({ filter: filter, max: 1 });
		collector.on('end', async (collected) => {
			let item = client.items.get(collected.first().values[0]);

			let newItem;
			if (item.id.startsWith('exp')) {
				newItem = client.items.get(expItems[expItems.indexOf(item.id) + 1]);
			} else if (item.id.endsWith('boost')) {
				newItem = client.items.get(expBoosts[expBoosts.indexOf(item.id) + 1]);
			}

			await takeItem(client.conn, interaction.member.id, item.id);
			await giveItem(client.conn, interaction.member.id, newItem.id);
			await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Upgraded one **${item.name}** to one **${newItem.name}**!`).setColor('Green')], components: [] });

			
			const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "upgrade_with_token");
			if (!hasCompleted) {
				await addAchievement(client, interaction.member.id, "upgrade_with_token");
				await interaction.followUp({ embeds: [await achievement(client.achievements.get("upgrade_with_token"))] });
                const levelupEmbed = await increaseAchievementLevel(client, interaction.member);
                if (levelupEmbed) {
                    await interaction.followUp({ embeds: [levelupEmbed] });
                }
                const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                if (trophyLevelUp) {
                    await interaction.followUp({ embeds: [trophyLevelUp] });
                }
			}
            
			
		});

		await removePetItem(client.conn, interaction.member.id, this.id, 1, await getPetPouch(client.conn, interaction.member.id));
	},
};
