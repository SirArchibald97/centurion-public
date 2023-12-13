const { achievementCycle } = require('../utils/embeds');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = async (client, interaction) => {
	const member = await interaction.guild.members.fetch(interaction.customId.split(".")[3]);
	const pages = await achievementCycle(client, interaction, member);
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
		new ButtonBuilder().setCustomId("achievement.left." + newPage + "." + member.id).setEmoji("⬅️").setStyle(ButtonStyle.Primary),
		new ButtonBuilder().setCustomId("achievement.right." + newPage + "." + member.id).setEmoji("➡️").setStyle(ButtonStyle.Primary)
	)
	await interaction.update({ embeds: [pages[newPage]], components: [buttons], ephemeral: true });
}