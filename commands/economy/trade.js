const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require("discord.js");
const { getInventory, listTrade, getTrades, takeItem, getTradesByUser, updateTrade } = require("../../utils/db");
const { tradePages, tradeButtons } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder().setName("trade").setDescription("List items to sell or browse items to buy")
        .addSubcommand(sell => sell.setName("sell").setDescription("List some items to sell"))
        .addSubcommand(buy => buy.setName("buy").setDescription("Browse items to buy")
            .addUserOption(user => user.setName("user").setDescription("Select a user to browse their trades").setRequired(false))
            .addStringOption(rarity => rarity.setName("rarity").setDescription("Select a rarity to browse").addChoices({ name: "Common", value: "Common" }, { name: "Uncommon", value: "Uncommon" }, { name: "Rare", value: "Rare" }, { name: "Epic", value: "Epic" }, { name: "Legendary", value: "Legendary" }).setRequired(false))
        ),

    async execute(client, interaction) {
        //if (interaction.member.id !== "398890149607637013") return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: This feature is currently disabled!").setColor("Red")], ephemeral: true });
    
        if (interaction.options.getSubcommand() === "sell") {
            const inventory = await getInventory(client.conn, interaction.member.id);
            if (inventory.length === 0) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: You have no items to sell!").setColor("Red")], ephemeral: true });

            const itemOptions = [];
            for (const entry of inventory) {
                const item = client.items.get(entry.item);
                itemOptions.push({ label: `${item.name} (x${entry.quantity})`, value: item.id });
            }
            const items = new StringSelectMenuBuilder().setCustomId("trade-sell").setPlaceholder("Select an item to sell").addOptions(itemOptions);
            const itemSelect = await interaction.reply({  
                components: [new ActionRowBuilder().addComponents(items)],
                ephemeral: true,
                fetchReply: true
            });

            const itemsFilter = i => i.customId === "trade-sell" && i.member.id === interaction.member.id;
            const itemsCollector = itemSelect.createMessageComponentCollector({ filter: itemsFilter, time: 60_000 * 5, max: 1 });
            itemsCollector.on("end", async collected => {
                const itemToSell = collected.first().values[0];
                let quantity = 1;

                const quantitySelect = await collected.first().update({
                    embeds: [new EmbedBuilder().setDescription(`Select a quantity of **${client.items.get(itemToSell).name}** to sell\nSelected amount: \`${quantity}\``).setColor("Blurple")],
                    components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId("c-trade-sell.decrease.5").setLabel("⬅️ 5").setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId("c-trade-sell.decrease.1").setLabel("⬅️ 1").setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId("c-trade-sell.confirm").setEmoji("✅").setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId("c-trade-sell.increase.1").setLabel("1 ➡️").setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId("c-trade-sell.increase.5").setLabel("5 ➡️").setStyle(ButtonStyle.Primary),
                    )],
                    fetchReply: true
                });

                const quantityFilter = i => i.customId.startsWith("c-trade-sell.") && i.member.id === interaction.member.id;
                const quantityCollector = quantitySelect.createMessageComponentCollector({ filter: quantityFilter, time: 60_000 * 5 });
                quantityCollector.on("collect", async i => {
                    if (i.customId === "c-trade-sell.confirm") return quantityCollector.stop();

                    const amount = parseInt(i.customId.split(".")[2]);
                    if (i.customId.startsWith("c-trade-sell.decrease")) {
                        if (quantity - amount < 1) {
                            quantity = 1;
                        } else {
                            quantity -= amount;
                        }
                    }
                    if (i.customId.startsWith("c-trade-sell.increase")) {
                        if (quantity + amount > inventory.find(entry => entry.item === itemToSell).quantity) {
                            quantity = inventory.find(entry => entry.item === itemToSell).quantity;
                        } else {
                            quantity += amount;
                        }
                    }

                    const newQuantitySelect = EmbedBuilder.from(i.message.embeds[0]).setDescription(`Select a quantity of **${client.items.get(itemToSell).name}** to sell\nSelected amount: \`${quantity}\``);
                    await i.update({ embeds: [newQuantitySelect], components: i.message.components });
                });
                quantityCollector.on("end", async collected => {
                    if (collected.size === 0) return await quantitySelect.edit({ embeds: [new EmbedBuilder().setDescription(":x: Operation timed out!").setColor("Red")], components: [] });
                
                    let price = Math.floor(client.items.get(itemToSell).price / 4);
                    const minPrice = Math.floor(client.items.get(itemToSell).price / 4);
                    const priceSelect = await collected.last().update({
                        embeds: [new EmbedBuilder().setDescription(`Select a price per item for **${quantity}x ${client.items.get(itemToSell).name}**\nSelected price: \`${price}\``).setColor("Blurple")],
                        components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId("c-trade-price.decrease.500").setLabel("⬅️ 500").setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId("c-trade-price.decrease.25").setLabel("⬅️ 25").setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId("c-trade-price.confirm").setEmoji("✅").setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId("c-trade-price.increase.25").setLabel("25 ➡️").setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId("c-trade-price.increase.500").setLabel("500 ➡️").setStyle(ButtonStyle.Primary),
                        )],
                        fetchReply: true
                    });

                    const priceFilter = i => i.customId.startsWith("c-trade-price.") && i.member.id === interaction.member.id;
                    const priceCollector = priceSelect.createMessageComponentCollector({ filter: priceFilter, time: 60_000 });
                    priceCollector.on("collect", async i => {
                        if (i.customId === "c-trade-price.confirm") return priceCollector.stop();

                        const amount = parseInt(i.customId.split(".")[2]);
                        if (i.customId.startsWith("c-trade-price.decrease")) {
                            if (price - amount < minPrice) {
                                price = minPrice;
                            } else {
                                price -= amount;
                            }
                        }
                        if (i.customId.startsWith("c-trade-price.increase")) {
                            price += amount;
                        }

                        const newPriceSelect = EmbedBuilder.from(i.message.embeds[0]).setDescription(`Select a price per item for **${quantity}x ${client.items.get(itemToSell).name}**\nSelected price: \`${price}\``);
                        await i.update({ embeds: [newPriceSelect], components: i.message.components });
                    });
                    priceCollector.on("end", async collected => {
                        if (collected.size === 0) return await priceSelect.edit({ embeds: [new EmbedBuilder().setDescription(":x: Operation timed out!").setColor("Red")], components: [] });
                    
                        await collected.last().update({
                            embeds: [
                                new EmbedBuilder().setTitle("Items listed!").setDescription("Your items have been listed for sale!").setColor("Green")
                                .addFields(
                                    { name: "Item", value: `${client.items.get(itemToSell).name} (x${quantity})`, inline: true },
                                    { name: "Price", value: `<:cent:1042902432914620497> ${price}`, inline: true }
                                )
                            ],
                            components: []
                        });

                        const usersTrades = await getTradesByUser(client.conn, interaction.member.id);
                        const sameTrade = usersTrades.find(t => t.item === itemToSell && t.price === price);
                        if (sameTrade) {
                            await updateTrade(client.conn, sameTrade.trade_id, quantity);
                        } else {
                            const { v4: uuid } = require("uuid");
                            await listTrade(client.conn, uuid(), interaction.member.id, itemToSell, quantity, price);
                        }
                        await takeItem(client.conn, interaction.member.id, itemToSell, quantity);
                    });
                });
            });


        } else if (interaction.options.getSubcommand() === "buy") {
            const member = interaction.options.getMember("user");
            const rarity = interaction.options.getString("rarity");

            const trades = await getTrades(client.conn);
            const filteredTrades = trades.filter(t => {
                if (!member && !rarity) return true;
                
                let memberMatch = false, rarityMatch = false;
                if (member) {
                    memberMatch = t.user === member.id;
                }
                if (rarity) {
                    rarityMatch = client.items.get(t.item).rarity === rarity;
                }
                return memberMatch || rarityMatch;
            });

            const pages = await tradePages(client, filteredTrades);
            const rows = await tradeButtons(client, filteredTrades);

            const noTradesReason = member || rarity ? "No trades found with those filters!" : "No one is trading at the moment!";
            const noTradesEmbed = new EmbedBuilder().setTitle("💰 Browse Trades").setDescription(noTradesReason).setColor("Blurple").setTimestamp();
            
            const filters = `${member ? `.m-${member.id}` : ""}${rarity ? `.r-${rarity}` : ""}`;
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("trades.left.0." + interaction.member.id + filters).setEmoji("⬅️").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("tradenull1").setLabel("\u200b").setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId("tradenull2").setLabel("\u200b").setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId("tradenull3").setLabel("\u200b").setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId("trades.right.0." + interaction.member.id + filters).setEmoji("➡️").setStyle(ButtonStyle.Primary),
            );

            await interaction.reply({
                embeds: [pages.length > 0 ? pages[0] : noTradesEmbed], 
                components: (pages.length > 0 ? [buttons, rows[0]] : []),
                ephemeral: true
            });
        }
    }
}