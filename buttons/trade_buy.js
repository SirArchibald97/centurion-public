const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getTradeById, takeCents, giveItem, removeTrade, decrementTradeQuantity } = require("../utils/db");

module.exports = async (client, interaction) => {
    let tradeId = interaction.customId.split(".")[1];
    if (tradeId.startsWith("null")) tradeId = null;

    const trade = await getTradeById(client.conn, tradeId);
    if (!trade) return await interaction.reply({ content: `This trade is no longer available!`, ephemeral: true });
    if (trade.user === interaction.member.id) return await interaction.reply({ content: `You can't buy your own items!`, ephemeral: true });

    let quantity = 1;
    const quantityReply = await interaction.update({
        embeds: [new EmbedBuilder().setDescription(`Select a quantity of **${client.items.get(trade.item).name}** to buy\nSelected amount: \`${quantity}\``).setColor("Blurple")],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("c-trade-buy.decrease.5").setLabel("⬅️ 5").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("c-trade-buy.decrease.1").setLabel("⬅️ 1").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("c-trade-buy.confirm").setEmoji("✅").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("c-trade-buy.increase.1").setLabel("1 ➡️").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("c-trade-buy.increase.5").setLabel("5 ➡️").setStyle(ButtonStyle.Primary),
            )
        ],
        fetchReply: true,
    })
    const filter = (i) => i.member.id === interaction.member.id;
    const quantityCollector = quantityReply.createMessageComponentCollector({ filter: filter, time: 60_000 * 5 });
    quantityCollector.on("collect", async (i) => {
        if (i.customId === "c-trade-buy.confirm") return quantityCollector.stop();

        const amount = parseInt(i.customId.split(".")[2]);
        if (i.customId.startsWith("c-trade-buy.decrease")) {
            quantity = quantity - amount < 1 ? 1 : quantity - amount;
        }
        if (i.customId.startsWith("c-trade-buy.increase")) {
            quantity = quantity + amount > trade.quantity ? trade.quantity : quantity + amount;
        }

        const newQuantitySelect = EmbedBuilder.from(i.message.embeds[0]).setDescription(`Select a quantity of **${client.items.get(trade.item).name}** to buy\nSelected amount: \`${quantity}\``);
        await i.update({ embeds: [newQuantitySelect], components: i.message.components });
    });

    quantityCollector.on("end", async (collected) => {
        if (collected.size === 0) return await quantityReply.update({ embeds: [new EmbedBuilder().setDescription(":x: Operation timed out!").setColor("Red")], components: [] });
        if (collected.last().customId !== "c-trade-buy.confirm") return await quantityReply.update({ embeds: [new EmbedBuilder().setDescription(":x: Operation timed out!").setColor("Red")], components: [] });
    
        await takeCents(client.conn, interaction.member.id, trade.price * quantity);
        await giveItem(client.conn, interaction.member.id, trade.item, false, quantity);
        if (trade.quantity === quantity) {
            await removeTrade(client.conn, trade.trade_id);
        } else {
            await decrementTradeQuantity(client.conn, trade.trade_id, quantity);
        }
        await collected.last().update({ embeds: [new EmbedBuilder().setDescription(`:white_check_mark: You bought **${quantity}x ${client.items.get(trade.item).name}** for **${trade.price * quantity}** cents!`).setColor("Green")], components: [] });
    });
}