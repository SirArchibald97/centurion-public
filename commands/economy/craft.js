const { EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');
const { getInventory, getPets, takeItem, giveItem, checkForAchievement, addAchievement } = require('../../utils/db');
const { achievement } = require('../../utils/embeds');
const { increaseAchievementLevel, increaseTrophyLevel } = require(`../../utils/levels`);

module.exports = {
	func: true,
	async data(client) {
		let command = new SlashCommandBuilder().setName('craft').setDescription('Craft an item!');
		let menu = new SlashCommandStringOption().setName('item').setDescription('Select an item').setRequired(true);
		let craftableItems = client.items.filter((item) => item.craftable === true);
		for (let [id, item] of craftableItems.entries()) {
			if (item.craftable === true) menu.addChoices({ name: item.name, value: item.id });
		}
		command.addStringOption(menu);
		return command;
	},

	async execute(client, interaction) {
		const inventory = await getInventory(client.conn, interaction.member.id);
		const pets = await getPets(client.conn, interaction.member.id);
		let item = client.items.get(interaction.options.getString('item'));

		let recipe = [];
		for (let entry of item.recipe) {
			let requiredItem = inventory.find((i) => i.item === entry.item && i.quantity >= entry.quantity);
			recipe.push({ item: entry.item, quantity: requiredItem?.quantity || 0 });
		}

		for (let entry of item.recipe) {
			if (recipe[item.recipe.indexOf(entry)].quantity < entry.quantity) {
				let list = '';
				for (let material of item.recipe) {
					let requiredItem = inventory.find((i) => i.item === material.item);
					if (requiredItem) {
						if (requiredItem.quantity < material.quantity) {
							list += `> ${material.quantity - requiredItem.quantity}x ${client.items.get(material.item).name}\n`;
						}
					} else {
						list += `> ${material.quantity}x ${client.items.get(material.item).name}\n`;
					}
				}
				return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(`:x: You are missing some items to craft this: \n\`\`\`${list}\`\`\``).setColor('Red')] });
			}
		}

		if (item.id.endsWith('_pet')) {
			if (pets.filter((p) => p.type === item.id).length > 0) {
				return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You can only craft one of this item!').setColor('Red')] });
			} else {
                for (let material of item.recipe) {
                    for (let i = 0; i < material.quantity; i++) {
                        await takeItem(client.conn, interaction.member.id, client.items.get(material.item).id);
                    }
                }

				await giveItem(client.conn, interaction.member.id, item.id, true);
                await interaction.reply({ embeds: [new EmbedBuilder().setDescription(`✅ Successfully crafted a${item.name.match('^[aieouAIEOU].*') ? 'n' : ''} **${item.name}**!`).setColor('Green')] });
                
                
                if (pets.length === 1) {
                    const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "craft_pet");
                    if (!hasCompleted) {
                        await addAchievement(client, interaction.member.id, "craft_pet");
                        await interaction.followUp({ embeds: [await achievement(client.achievements.get("craft_pet"))] });
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
                

                
                if (pets.length + 1 >= 5) {
                    const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "craft_5_pets");
                    if (!hasCompleted) {
                        await addAchievement(client, interaction.member.id, "craft_5_pets");
                        await interaction.followUp({ embeds: [await achievement(client.achievements.get("craft_5_pets"))] });
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
                
                
				
				if (item.id === "dragon_pet") {
					const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "craft_dragon");
					if (!hasCompleted) {
						await addAchievement(client, interaction.member.id, "craft_dragon");
						await interaction.followUp({ embeds: [await achievement(client.achievements.get("craft_dragon"))] });
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
                
				
			}
		} else {
            for (let material of item.recipe) {
                for (let i = 0; i < material.quantity; i++) {
                    await takeItem(client.conn, interaction.member.id, client.items.get(material.item).id);
                }
            }

			await giveItem(client.conn, interaction.member.id, item.id);
            await interaction.reply({ embeds: [new EmbedBuilder().setDescription(`✅ Successfully crafted a${item.name.match('^[aieouAIEOU].*') ? 'n' : ''} **${item.name}**!`).setColor('Green')] });

			
			const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "craft_item");
			if (!hasCompleted) {
				await addAchievement(client, interaction.member.id, "craft_item");
				await interaction.followUp({ embeds: [await achievement(client.achievements.get("craft_item"))] });
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
	},
};
