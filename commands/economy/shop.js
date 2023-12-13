const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, SlashCommandBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { getUser, giveItem, takeCents, getShopBuys, addShopBuy, getShop, getInventory, countShopBuys } = require('../../utils/db');
const { getMaxInventorySlots, increaseAchievementLevel, increaseTrophyLevel } = require('../../utils/levels');

module.exports = {
	data: new SlashCommandBuilder().setName('shop').setDescription('Open the weekly item shop'),

	async execute(client, interaction) {
		//if (interaction.member.id !== "398890149607637013" && interaction.member.id !== "882647074896748625") return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: Sorry, this feature is still under development!").setColor("RED")], ephemeral: true });

		const items = await getShop(client.conn);
		let tier1item = client.items.get(items[0].item), tier2item = client.items.get(items[1].item), tier3item = client.items.get(items[2].item);
		let shopitems = [tier1item, tier2item, tier3item];

		let weeklyRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('1').setEmoji('1️⃣').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('2').setEmoji('2️⃣').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('3').setEmoji('3️⃣').setStyle(ButtonStyle.Secondary),
		);

		let weeklyEmbed = new EmbedBuilder().setTitle('Weekly Item Shop').setColor('Blurple').setDescription(`Next rotation: <t:${DateTime.now().plus({ weeks: 1 }).startOf('week').toSeconds()}:R>`);
		if (interaction.member.presence?.clientStatus.mobile) {
			weeklyEmbed.addFields({ name: `Tier 1`, value: `\`\`\`css\n[${tier1item.rarity.toUpperCase()}] ${tier1item.name} > ¢${tier1item.price}\n${tier1item.desc}\`\`\`` });
			weeklyEmbed.addFields({ name: `Tier 2`, value: `\`\`\`css\n[${tier2item.rarity.toUpperCase()}] ${tier2item.name} > ¢${tier2item.price}\n${tier2item.desc}\`\`\`` });
			weeklyEmbed.addFields({ name: `Tier 3`, value: `\`\`\`css\n[${tier3item.rarity.toUpperCase()}] ${tier3item.name} > ¢${tier3item.price}\n${tier3item.desc}\`\`\`` });
		} else {
			let colours = { Legendary: '33', Epic: '35', Rare: '34', Uncommon: '32', Common: '30' };
			weeklyEmbed.addFields({ name: `Tier 1`, value: `\`\`\`ansi\n[0;${colours[tier1item.rarity]}m[${tier1item.rarity.toUpperCase()}] [1;37m${tier1item.name} [0m> [1;37m¢${tier1item.price}\n[0m${tier1item.desc}\`\`\`` });
			weeklyEmbed.addFields({ name: `Tier 2`, value: `\`\`\`ansi\n[0;${colours[tier2item.rarity]}m[${tier2item.rarity.toUpperCase()}] [1;37m${tier2item.name} [0m> [1;37m¢${tier2item.price}\n[0m${tier2item.desc}\`\`\`` });
			weeklyEmbed.addFields({ name: `Tier 3`, value: `\`\`\`ansi\n[0;${colours[tier3item.rarity]}m[${tier3item.rarity.toUpperCase()}] [1;37m${tier3item.name} [0m> [1;37m¢${tier3item.price}\n[0m${tier3item.desc}\`\`\`` });
		}

		const shopMessage = await interaction.reply({ embeds: [weeklyEmbed], components: [weeklyRow], ephemeral: true, fetchReply: true });

        /* CHOOSE AN ITEM */
		const filter = (int) => int.member.id === interaction.member.id;
		const collector = shopMessage.createMessageComponentCollector({ filter: filter, max: 1, time: 60000 });
		collector.on('end', async (collected) => {
			if (collected.size === 0) {
				return await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(':x: Operation timed out!').setColor('Red')], components: [], ephemeral: true });
			} else {

                /* CHOOSE A QUANTITY */
                const selectedItem = shopitems[parseInt(collected.first().customId) - 1];
                const quantityMessage = await collected.first().update({ embeds: shopMessage.embeds, components: [
                    new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("shop-quantity").setPlaceholder("Select quantity").addOptions([
                        { label: `1x (¢${selectedItem.price})`, value: "1" },
                        { label: `2x (¢${selectedItem.price * 2})`, value: "2" },
                        { label: `3x (¢${selectedItem.price * 3})`, value: "3" }
                    ]))
                ], ephemeral: true, fetchReply: true });
                const quantityCollector = quantityMessage.createMessageComponentCollector({ filter: filter, max: 1, time: 60000 });
                quantityCollector.on("end", async quantityCollected => {
                    if (quantityCollected.size === 0) {
                        return await quantityMessage.edit({ embeds: [new EmbedBuilder().setDescription(':x: Operation timed out!').setColor('Red')], components: [], ephemeral: true });
                    } else {

                        /* CONFIRM */
                        let confirmRow = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('shop-confirm').setLabel('Confirm').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId('shop-cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger),
                        );
                        const quantity = quantityCollected.first().values[0];
        
                        const confirmMessage = await quantityCollected.first().update({ embeds: [new EmbedBuilder().setDescription(`Confirm buy **${quantity} ${selectedItem.name}** for <:cent:1042902432914620497> **${selectedItem.price * Number(quantity)}**?`).setColor('Blurple'),], components: [confirmRow], ephemeral: true, fetchReply: true });
                        const confirmCollector = confirmMessage.createMessageComponentCollector({ filter: filter, max: 1, time: 60000 });
                        confirmCollector.on('end', async (confirmCollected) => {
                            if (confirmCollected.size === 0) {
                                return await confirmMessage.edit({ embeds: [new EmbedBuilder().setDescription(':x: Operation timed out!').setColor('Red')], components: [], ephemeral: true });
                            } else {
                                const inventory = await getInventory(client.conn, interaction.member.id);
                                const hasItem = inventory.filter(i => i.item === selectedItem.id).length > 0;
                                const maxSlots = await getMaxInventorySlots(client.conn, client, interaction.member);
        
                                const shopBuys = await getShopBuys(client.conn, interaction.member.id);
                                const tiers = ['tier1', 'tier2', 'tier3'];
                                const tierLimits = [3, 2, 1];

                                if (confirmCollected.first().customId === 'shop-confirm') {
                                    const stats = (await getUser(client.conn, interaction.member.id))[0];
                                    if (stats.cents < selectedItem.price * Number(quantity)) {
                                        return await confirmCollected.first().update({
                                            embeds: [new EmbedBuilder().setDescription(":x: You don't have enough Cents to buy this!").setColor('Red')],
                                            components: [],
                                            ephemeral: true,
                                        });
                                    } else if (inventory.length === maxSlots && !hasItem) {
                                        return await confirmCollected.first().update({ embeds: [new EmbedBuilder().setDescription(":x: Your inventory is full!").setColor("Red")], components: [], ephemeral: true });
        
                                    } else {
                                        if (shopBuys.length > 0) {
                                            if (shopBuys[0][tiers[Number(collected.first().customId) - 1]] >= tierLimits[Number(collected.first().customId) - 1])
                                                return await confirmCollected.first().update({
                                                    embeds: [new EmbedBuilder().setDescription(':x: You have reached the maximum amount of this item you can buy!').setColor('Red')], components: [], ephemeral: true,
                                                });
        
                                            if (shopBuys[0][tiers[Number(collected.first().customId - 1)]] + Number(quantity) > tierLimits[Number(collected.first().customId - 1)])
                                                return await confirmCollected.first().update({
                                                    embeds: [new EmbedBuilder().setDescription(":x: You cannot buy that many of this item!").setColor("Red")], components: [], ephemeral: true,
                                                });

                                            await addShopBuy(client.conn, interaction.member.id, tiers[Number(collected.first().customId) - 1], Number(quantity));
                                        } else {
                                            if (Number(quantity) > tierLimits[Number(collected.first().customId) - 1]) 
                                                return await confirmCollected.first().update({
                                                    embeds: [new EmbedBuilder().setDescription(":x: You cannot buy that many of this item!").setColor("Red")], components: [], ephemeral: true,
                                                });

                                            await countShopBuys(client.conn, interaction.member.id, tiers[Number(collected.first().customId) - 1], Number(quantity));
                                        }

                                        for (let i = 0; i < Number(quantity); i++) { await giveItem(client.conn, interaction.member.id, selectedItem.id); }
                                        await takeCents(client.conn, interaction.member.id, selectedItem.price * Number(quantity));
                                        await confirmCollected.first().update({
                                            embeds: [new EmbedBuilder().setDescription(`✅ Successfully purchased ${Number(quantity)} **${selectedItem.name}**!`).setColor('Green')],
                                            components: [],
                                            ephemeral: true,
                                        });

                                        const newInventory = await getInventory(client.conn, interaction.member.id);
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
                                                const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                                                if (trophyLevelUp) {
                                                    await interaction.followUp({ embeds: [trophyLevelUp] });
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
                                                const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                                                if (trophyLevelUp) {
                                                    await interaction.followUp({ embeds: [trophyLevelUp] });
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    return await confirmCollected.first().update({
                                        embeds: [new EmbedBuilder().setDescription(':x: Purchase cancelled!').setColor('Red')],
                                        components: [],
                                        ephemeral: true,
                                    });
                                }
                            }
                        });
                    }                    
                });
			}
		});
	},
};
