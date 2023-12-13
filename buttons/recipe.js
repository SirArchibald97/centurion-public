const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { recipeCycle } = require("../utils/embeds");

module.exports = async (client, interaction) => {
    const pages = await recipeCycle(client, interaction);
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
		new ButtonBuilder().setCustomId("recipe.left." + newPage).setEmoji("⬅️").setStyle(ButtonStyle.Primary),
		new ButtonBuilder().setCustomId("recipe.right." + newPage).setEmoji("➡️").setStyle(ButtonStyle.Primary)
	)
	await interaction.update({ embeds: [pages[newPage]], components: [buttons], ephemeral: true });
}