const { getInventory, getBoosts, giveItem, takeItem, addAchievement, checkForAchievement } = require("../utils/db");
const { getMaxInventorySlots, increaseAchievementLevel, increaseTrophyLevel } = require('../utils/levels');
const { achievement, secretAchievement } = require("../utils/embeds");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { log } = require('../utils/log');

module.exports = async (client, message) => {
    return new Promise(async (resolve, reject) => {
        const activeBoosts = await getBoosts(client.conn, message.member.id);
        let chanceOfItem = Math.floor(Math.random() * ((activeBoosts[0]?.type === 'vulture_gift' ? 31 : 61) - 1) + 1);
        
        // uncomment this line to test with Carmel
        //if (message.member.id === "882647074896748625") chanceOfItem = 1;

        if (chanceOfItem === 1) {
            const inventory = await getInventory(client.conn, message.member.id);
            let totalSlots = await getMaxInventorySlots(client.conn, client, message.member);

            const itemChance = Math.floor(Math.random() * (1001 - 1) + 1);
            let rarity = '';
            let dragonBoosts = activeBoosts.filter((b) => b.type === 'midas_magnet'); 

            // legendary = 20%
            // epic = 30%
            // rare = 50%
            if (dragonBoosts.length > 0) {
                if (itemChance <= 200) {
                    rarity = 'Legendary';
                } else if (itemChance <= 500) {
                    rarity = 'Epic';
                } else {
                    rarity = 'Rare';
                }

                // legendary = 2.5%
                // epic = 7.5%
                // rare = 20%
                // uncommon = 30%
                // common = 40%
            } else {
                if (itemChance <= 25) {
                    rarity = 'Legendary';
                } else if (itemChance <= 100) {
                    rarity = 'Epic';
                } else if (itemChance <= 300) {
                    rarity = 'Rare';
                } else if (itemChance <= 600) {
                    rarity = 'Uncommon';
                } else {
                    rarity = 'Common';
                }
            }

            // uncomment this line to test with Carmel
            // change rarity to whatever you want to test
            //if (message.member.id === "882647074896748625") rarity = "Legendary";

            let possibleItems = [];
            for (let [id, item] of client.items.entries()) {
                if (item.rarity === rarity && !item.unfindable) {
                    possibleItems.push(item);
                }
            }

            let randIndex = Math.floor(Math.random() * possibleItems.length);
            let chosenItem = possibleItems[randIndex];

            log(` > Item found: [${chosenItem.rarity}] ${chosenItem.name} (${chosenItem.id})`);

            const hasChosenItem = inventory.filter((item) => item.item === chosenItem.id).length > 0;
            const inventoryFull = inventory.length >= totalSlots && !hasChosenItem;

            let itemEmbed = new EmbedBuilder().setTitle('You found an item' + (inventoryFull ? " but your inventory is full!" : "!")).setColor('Blurple');
            const colours = { Legendary: '33', Epic: '35', Rare: '34', Uncommon: '32', Common: '30', };
            itemEmbed.setDescription(`\`\`\`ansi\n[0;${colours[rarity]}m[${rarity.toUpperCase()}]  [1;37m${chosenItem.name}\n[0m${chosenItem.desc}\`\`\`\nUse \`/use\` or \`/craft\` to use your items!`);

            if (inventory.length >= totalSlots ) {
                let items = new StringSelectMenuBuilder().setCustomId('itemdrop');
                for (let entry of inventory) {
                    let item = client.items.get(entry.item);
                    if (!item.material) {
                        items.addOptions([{ label: `${item.name} (x${entry.quantity})`, value: item.id }]);
                    }
                }
                let menu = new ActionRowBuilder().addComponents(items);
                let button = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('cancel').setLabel('❌').setStyle(ButtonStyle.Danger),
                );

                let reply = await message.reply({ embeds: [itemEmbed], components: [menu, button] });
                let filter = (int) => int.member.id === message.member.id && int.isStringSelectMenu() || int.isButton();
                let collector = reply.createMessageComponentCollector({ filter: filter, max: 1, time: 30000 });
                collector.on('end', async (collected) => {
                    let droppedItem = chosenItem;
                    if (collected.size > 0) {
                        let option = collected.first();
                        if (option.isButton()) {
                            await reply.edit({ embeds: [new EmbedBuilder().setDescription(`📥 Dropped the **${chosenItem.name}**!`).setColor('Red'),], components: [] });
                            resolve(true);
                        } else {
                            let itemToDrop = client.items.get(option.values[0]);
                            droppedItem = itemToDrop;

                            await giveItem(client.conn, message.member.id, chosenItem.id);
                            await takeItem(client.conn, message.member.id, itemToDrop.id);

                            await reply.edit({
                                embeds: [new EmbedBuilder().setDescription(`📥 Dropped the **${itemToDrop.name}(s)** and picked up the **${chosenItem.name}**!`).setColor('Green')],
                                components: []
                            });

                            
                            const hasCompleted = await checkForAchievement(client.conn, message.member.id, "drop_item");
                            if (!hasCompleted) {
                                await addAchievement(client, message.member.id, "drop_item");
                                await message.reply({ embeds: [await achievement(client.achievements.get("drop_item"))] });
                                const levelupEmbed = await increaseAchievementLevel(client, message.member);
                                if (levelupEmbed) {
                                    await message.followUp({ embeds: [levelupEmbed] });
                                }
                                const trophyLevelUp = await increaseTrophyLevel(client, message.member);
                                if (trophyLevelUp) {
                                    await message.reply({ embeds: [trophyLevelUp] });
                                }
                            }
                            


                        }
                    } else {
                        await reply.edit({
                            embeds: [new EmbedBuilder().setDescription(`:x: You ran out of time to claim this **${droppedItem.name}** and it has been automatically dropped!`,).setColor('Red')],
                            components: [],
                        });
                    }

                    
                    if (droppedItem.rarity === "Legendary") {
                        const hasCompleted = await checkForAchievement(client.conn, message.member.id, "drop_legendary_item");
                        if (!hasCompleted) {
                            await addAchievement(client, message.member.id, "drop_legendary_item");
                            await message.reply({ embeds: [await secretAchievement(client.achievements.get("drop_legendary_item"))] });
                            const levelupEmbed = await increaseAchievementLevel(client, message.member);
                            if (levelupEmbed) {
                                await message.followUp({ embeds: [levelupEmbed] });
                            }
                            const trophyLevelUp = await increaseTrophyLevel(client, message.member);
                            if (trophyLevelUp) {
                                await message.reply({ embeds: [trophyLevelUp] });
                            }
                        }
                    }
                    
                });
            } else {
                await message.reply({ embeds: [itemEmbed] });
                await giveItem(client.conn, message.member.id, chosenItem.id);
            }

            const newInventory = await getInventory(client.conn, message.member.id);
            
            const legendaryItems = [];
            for (let entry of newInventory) {
                const item = client.items.get(entry.item);
                if (item.rarity === "Legendary") legendaryItems.push(item);
            }
            if (legendaryItems.length >= 7) {
                const hasCompleted = await checkForAchievement(client.conn, message.member.id, "7_legendary_items");
                if (!hasCompleted) {
                    await addAchievement(client, message.member.id, "7_legendary_items");
                    await message.reply({ embeds: [await secretAchievement(client.achievements.get("7_legendary_items"))] });
                    const levelupEmbed = await increaseAchievementLevel(client, message.member);
                    if (levelupEmbed) {
                        await message.followUp({ embeds: [levelupEmbed] });
                    }
                    const trophyLevelUp = await increaseTrophyLevel(client, message.member);
                    if (trophyLevelUp) {
                        await message.reply({ embeds: [trophyLevelUp] });
                    }
                }
            }
            
            
            let oneOfEach = 0;
            const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
            for (let rarity of rarities) {
                const itemsOfRarity = newInventory.filter(i => client.items.get(i.item).rarity === rarity);
                if (itemsOfRarity.length > 0) oneOfEach++;
            }
            if (oneOfEach === 5) {
                const hasCompleted = await checkForAchievement(client.conn, message.member.id, "one_of_each_rarity");
                if (!hasCompleted) {
                    await addAchievement(client, message.member.id, "one_of_each_rarity");
                    await message.reply({ embeds: [await achievement(client.achievements.get("one_of_each_rarity"))] });
                    const levelupEmbed = await increaseAchievementLevel(client, message.member);
                    if (levelupEmbed) {
                        await message.followUp({ embeds: [levelupEmbed] });
                    }
                    const trophyLevelUp = await increaseTrophyLevel(client, message.member);
                    if (trophyLevelUp) {
                        await message.reply({ embeds: [trophyLevelUp] });
                    }
                }
            }
            
            
            if (chosenItem.rarity === "Legendary") {
                const hasCompleted = await checkForAchievement(client.conn, message.member.id, "find_legendary_item");
                if (!hasCompleted) {
                    await addAchievement(client, message.member.id, "find_legendary_item");
                    await message.reply({ embeds: [await achievement(client.achievements.get("find_legendary_item"))] });
                    const levelupEmbed = await increaseAchievementLevel(client, message.member);
                    if (levelupEmbed) {
                        await message.followUp({ embeds: [levelupEmbed] });
                    }
                    const trophyLevelUp = await increaseTrophyLevel(client, message.member);
                    if (trophyLevelUp) {
                        await message.reply({ embeds: [trophyLevelUp] });
                    }
                }
            }
        } else {
            log(` > No item found (Chance: ${chanceOfItem})`);
        }
        resolve(true);
    });
}