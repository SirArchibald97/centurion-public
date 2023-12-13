const { getDungeonsData } = require('../utils/db');
const { rankPage, inventoryPage, petPage, achievementPage, fishingPage, dungeonsPage } = require('../utils/embeds');
const { getMaxInventorySlots } = require('../utils/levels');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = async (client, interaction) => {
	const selectedPage = interaction.customId.split(".")[1];
	const commandUser = interaction.customId.split(".")[2];
	const userId = interaction.customId.split(".")[3];
	if (interaction.member.id !== commandUser) return await interaction.reply({ content: "This is not your command!", ephemeral: true });

	const pages = {
		"rank": await rankPage(client, interaction, true),
		"inventory": await inventoryPage(client, interaction, (await getMaxInventorySlots(client.conn, client, await interaction.guild.members.fetch(userId))), true),
		"pets": await petPage(client, interaction, true),
		"achievements": await achievementPage(client, interaction, true),
        "dungeons": await dungeonsPage(client, await interaction.guild.members.fetch(userId), (await getDungeonsData(client.conn, userId))[0]),
	};

	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId("profile.rank." + commandUser + "." + userId).setEmoji("🏅").setStyle(ButtonStyle.Primary),
		new ButtonBuilder().setCustomId("profile.inventory." + commandUser + "." + userId).setEmoji("📦").setStyle(ButtonStyle.Primary),
		new ButtonBuilder().setCustomId("profile.pets." + commandUser + "." + userId).setEmoji("🐶").setStyle(ButtonStyle.Primary),
		new ButtonBuilder().setCustomId("profile.achievements." + commandUser + "." + userId).setEmoji("🏆").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("profile.dungeons." + commandUser + "." + userId).setEmoji("⚔️").setStyle(ButtonStyle.Primary)
	);

	await interaction.update({ embeds: [pages[selectedPage]], components: [row] });
}