const { getDungeonsData } = require('../../utils/db');
const { rankPage, inventoryPage, petPage, achievementPage, dungeonsPage } = require('../../utils/embeds');
const { getMaxInventorySlots } = require('../../utils/levels');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName("profile").setDescription("View user information")
		.addStringOption(page => page.setName("page").setDescription("Select a page").setRequired(false)
			.addChoices(
                { name: "Rank", value: "rank" },
                { name: "Inventory", value: "inventory" },
                { name: "Pets", value: "pets" },
                { name: "Achievements", value: "achievements" },
                { name: "Dungeons", value: "dungeons" }
            ))
		.addUserOption(user => user.setName("user").setDescription("Select a user").setRequired(false)),

	async execute(client, interaction) {
        if (interaction.options.getMember("user")?.user.bot) return interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: You cannot view the profile of this person!").setColor("Red")], ephemeral: true });

		await interaction.deferReply();
		const member = interaction.options.getMember("user") || interaction.member;

		const pages = {
			"rank": await rankPage(client, interaction),
			"inventory": await inventoryPage(client, interaction, (await getMaxInventorySlots(client.conn, client, member))),
			"pets": await petPage(client, interaction),
			"achievements": await achievementPage(client, interaction),
            "dungeons": await dungeonsPage(client, member, (await getDungeonsData(client.conn, member.id))[0]),
		};

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId("profile.rank." + interaction.member.id + "." + member.id).setEmoji("🏅").setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId("profile.inventory." + interaction.member.id + "." + member.id).setEmoji("📦").setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId("profile.pets." + interaction.member.id + "." + member.id).setEmoji("🐶").setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId("profile.achievements." + interaction.member.id + "." + member.id).setEmoji("🏆").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("profile.dungeons." + interaction.member.id + "." + member.id).setEmoji("⚔️").setStyle(ButtonStyle.Primary),
		);
		await interaction.editReply({ embeds: [pages[interaction.options.getString("page") || "rank"]], components: [row] });
	}
}