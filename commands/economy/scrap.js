const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { getInventory, getSettings, giveCents, takeItem, checkForAchievement, addAchievement, getBoosts, removeBoost } = require('../../utils/db');
const { achievement } = require('../../utils/embeds');
const { increaseAchievementLevel, increaseTrophyLevel } = require('../../utils/levels');

module.exports = {
	data: new SlashCommandBuilder().setName('scrap').setDescription('Scrap an item')
        .addSubcommand(boost => boost.setName('boost').setDescription('Remove your active boost!'))
        .addSubcommand(item => item.setName('item').setDescription('Scrap an item!')),

	async execute(client, interaction) {
		//if (interaction.member.id !== "398890149607637013") return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: Sorry, this feature is temporarily disabled!").setColor("RED")], ephemeral: true });

        if (interaction.options.getSubcommand() === 'item') {
            const inventory = await getInventory(client.conn, interaction.member.id);
            if (inventory.length === 0) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You have no items to scrap!').setColor('Red')], ephemeral: true });

            let menu = new StringSelectMenuBuilder().setCustomId('sell-inventory').setPlaceholder('Select an item to scrap');
            let scrapableItems = false;
            for (let entry of inventory) {
                let item = client.items.get(entry.item);
                if (!item.id.endsWith("_pet")) {
                    scrapableItems = true;
                    menu.addOptions([{ label: `${item.name} (x${entry.quantity}) - ¢${item.price ? item.price / 4 : 0}`, value: item.id }]);
                }
            }
            let row = new ActionRowBuilder().addComponents(menu);
            if (!scrapableItems) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You have no items to scrap!').setColor('Red')], ephemeral: true });

            let reply = await interaction.reply({ components: [row], ephemeral: true, fetchReply: true });
            const filter = (int) => int.member.id === interaction.member.id;
            let collector = reply.createMessageComponentCollector({ filter: filter, max: 1 });
            collector.on('end', async (collected) => {
                let item = client.items.get(collected.first().values[0]);
                let inventorySlot = inventory.find(i => i.item === item.id);

                const quantityButtons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("c-decrease-5").setLabel("⬅️ 5").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("c-decrease-1").setLabel("⬅️ 1").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("c-quantity-confirm").setEmoji("✅").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("c-increase-1").setLabel("➡️ 1").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("c-increase-5").setLabel("➡️ 5").setStyle(ButtonStyle.Primary),
                );
                let quantity = 1;
                const quantityEmbed = (total) => { return new EmbedBuilder().setDescription(`Scrapping item: **${item.name}**\nSelected quantity: **${quantity}**\nTotal cost: <:cent:1042902432914620497> **${total}**`).setColor("Blurple"); }
                const quantityReply = await collected.first().update({ embeds: [quantityEmbed(Math.floor(quantity * ((item.price ? item.price : 0) / 4)))], components: [quantityButtons], ephemeral: true, fetchReply: true });
                
                const quantityCollector = quantityReply.createMessageComponentCollector({ filter: filter, time: 60000 });
                quantityCollector.on("collect", async (quantityInteraction) => {
                    if (quantityInteraction.customId === "c-quantity-confirm") {
                        quantityCollector.stop();

                    } else {
                        if (quantityInteraction.customId === "c-decrease-1") {
                            if (quantity > 1) quantity--;
                        } else if (quantityInteraction.customId === "c-decrease-5") {
                            if (quantity > 5) quantity -= 5;
                            else quantity = 1;
                        } else if (quantityInteraction.customId === "c-increase-1") {
                            if (quantity + 1 <= inventorySlot.quantity) quantity++;
                        } else if (quantityInteraction.customId === "c-increase-5") {
                            if (quantity + 5 <= inventorySlot.quantity) quantity += 5;
                            else quantity = inventorySlot.quantity;
                        }
                        await quantityInteraction.update({ embeds: [quantityEmbed(quantity * ((item.price ? item.price : 0) / 4))], components: [quantityButtons], ephemeral: true });
                    }
                });

                quantityCollector.on("end", async (collected) => {
                    let total = Math.floor(quantity * ((item.price ? item.price : 0) / 4));

                    const settings = (await getSettings(client.conn, interaction.member.id))[0];
                    if (settings?.ITEM_CONFIRM === 1) {
                        let confirmRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('c-sell-confirm').setLabel('CONFIRM').setStyle(ButtonStyle.Primary),);
                        let confirmEmbed = new EmbedBuilder().setDescription(`Press confirm below within 30 seconds to confirm the scrap of **${quantity}x ${item.name}** for <:cent:1042902432914620497> **${total}**!`).setColor('Blurple');
                        let confirmReply = await collected.last().update({ embeds: [confirmEmbed], components: [confirmRow], fetchReply: true });

                        const confirmCollector = confirmReply.createMessageComponentCollector({ filter: filter, max: 1, time: 30000 });
                        confirmCollector.on('end', async (confirmCollected) => {
                            if (confirmCollected.size > 0) {
                                const newInventory = await getInventory(client.conn, interaction.member.id);
                                let itemIDs = [];
                                newInventory.forEach((item) => itemIDs.push(item.item));
                                if (!itemIDs.includes(item.id)) return await confirmCollected.first().update({ embeds: [new EmbedBuilder().setDescription(':x: You no longer have this item!').setColor('Red')], components: [], ephemeral: true });

                                if (newInventory.find(i => i.item === item.id).quantity < quantity) {
                                    total = Math.floor(newInventory.find(i => i.item === item.id).quantity * ((item.price ? item.price : 0) / 4));
                                    quantity = newInventory.find(i => i.item === item.id).quantity;
                                }
                                await giveCents(client.conn, interaction.member.id, total);
                                for (let i = 0; i < quantity; i++) await takeItem(client.conn, interaction.member.id, item.id);
                                await confirmCollected.first().update({ embeds: [new EmbedBuilder().setDescription(`🔧 Scrapped **${quantity}x ${item.name}** for <:cent:1042902432914620497> **${total}**!`).setColor('Green')], components: [] });

                                
                                const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "scrap_item");
                                if (!hasCompleted) {
                                    await addAchievement(client, interaction.member.id, "scrap_item");
                                    await interaction.followUp({ embeds: [await achievement(client.achievements.get("scrap_item"))] });
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
                                await confirmReply.edit({ embeds: [new EmbedBuilder().setDescription(':x: Operation timed out!').setColor('Red')], components: [] });
                            }
                        });
                    } else {
                        const inventory = await getInventory(client.conn, interaction.member.id);
                        let itemIDs = [];
                        inventory.forEach((item) => itemIDs.push(item.item));
                        if (!itemIDs.includes(item.id)) return await collected.first().message.edit({ embeds: [new EmbedBuilder().setDescription(':x: You no longer have this item!').setColor('Red')], components: [], ephemeral: true });

                        await giveCents(client.conn, interaction.member.id, total);
                        for (let i = 0; i < quantity; i++) await takeItem(client.conn, interaction.member.id, item.id);
                        await collected.first().update({ embeds: [new EmbedBuilder().setDescription(`🔧 Scrapped **${quantity}x ${item.name}** for <:cent:1042902432914620497> **${total}**!`).setColor('Green')], components: [] });
                        
                        
                        const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "scrap_item");
                        if (!hasCompleted) {
                            await addAchievement(client, interaction.member.id, "scrap_item");
                            await interaction.followUp({ embeds: [await achievement(client.achievements.get("scrap_item"))] });
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
            });
        
        } else {
            const boosts = await getBoosts(client.conn, interaction.member.id);
            if (boosts.length === 0) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: You have no active boosts!").setColor("Red")], ephemeral: true });

            const confirm = await interaction.reply({
                embeds: [new EmbedBuilder().setDescription("Are you sure you want to do that? This action is irreversible!").setColor("Orange")],
                components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("c-scrap-confirm").setLabel("CONFIRM").setStyle(ButtonStyle.Success))],
                ephemeral: true, fetchReply: true
            });
            const filter = (int) => int.member.id === interaction.member.id;
            const collector = confirm.createMessageComponentCollector({ filter: filter, max: 1, time: 60000 });
            collector.on("end", async (collected) => {
                if (collected.size === 0) {
                    try { await confirm.edit({ embeds: [new EmbedBuilder().setDescription(":x: Operation timed out!").setColor("Red")], components: [] }); } catch (err) { };
                } else {
                    await removeBoost(client.conn, interaction.member.id);
                    const boostItem = client.items.get(boosts[0].type);
                    await collected.first().update({ embeds: [new EmbedBuilder().setDescription(`🔧 Scrapped your active \`${boostItem.name}\`!`).setColor('Green')], components: [], ephemeral: true });
                }
            });
        } 
	},
};
