const { getTrades } = require("../utils/db");
const { tradeButtons, tradePages } = require("../utils/embeds");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ConnectionService } = require("discord.js");

module.exports = async (client, interaction) => {
    const memberId = interaction.customId.split(".")[3];

    const trades = await getTrades(client.conn);
    let filters = interaction.customId.split(".").slice(4);
    if (filters) {
        let memberFilter = null, rarityFilter = null;
        if (filters.length === 2) {
            memberFilter = filters[0].split("-")[1];
            rarityFilter = filters[1].split("-")[1];
        } else if (filters.length === 1) {
            if (filters[0].startsWith("m-")) {
                memberFilter = filters[0].split("-")[1];
            } else {
                rarityFilter = filters[0].split("-")[1];
            }
        }


        trades.filter(t => {
            let memberMatch = false, rarityMatch = false;
            if (memberFilter) {
                memberMatch = t.user === memberFilter;
            }
            if (rarityFilter) {
                rarityMatch = client.items.get(t.item).rarity === rarityFilter;
            }
            return memberMatch || rarityMatch;
        });

        filters = `.${filters.join(".")}`;
    }

    const pages = await tradePages(client, trades);
    const rows = await tradeButtons(client, trades);

    let currentPage = Number(interaction.customId.split(".")[2]);
    let newPage;
	if (interaction.customId.split(".")[1] === "left") {
		newPage = currentPage - 1;
		if (newPage < 0) newPage = pages.length - 1;
	} else {
		newPage = currentPage + 1;
		if (newPage > pages.length - 1) newPage = 0;
	}

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`trades.left.${newPage}.` + interaction.member.id + filters).setEmoji("⬅️").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("tradenull1").setLabel("\u200b").setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId("tradenull2").setLabel("\u200b").setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId("tradenull3").setLabel("\u200b").setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId(`trades.right.${newPage}.` + interaction.member.id + filters).setEmoji("➡️").setStyle(ButtonStyle.Primary),
    );
    await interaction.update({ embeds: [pages[newPage]], components: [buttons, rows[newPage]] });
} 