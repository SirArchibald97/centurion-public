const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { rankPage, inventoryPage, petPage, achievementPage } = require('../../utils/embeds');
const { getMaxInventorySlots } = require('../../utils/levels');

module.exports = {
    data: new SlashCommandBuilder().setName("inventory").setDescription("View your inventory").addUserOption(user => user.setName("user").setDescription("Select a user").setRequired(false)),

    async execute(client, interaction) {
        if (interaction.options.getMember("user")?.user.bot) return interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: You cannot view the profile of this person!").setColor("Red")], ephemeral: true });

        await interaction.deferReply();
        const user = interaction.options.getMember("user") || interaction.member;

        const pages = {
			"rank": await rankPage(client, interaction),
			"inventory": await inventoryPage(client, interaction, (await getMaxInventorySlots(client.conn, client, user))),
			"pets": await petPage(client, interaction),
			"achievements": await achievementPage(client, interaction),
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("profile.rank." + interaction.member.id + "." + user.id).setEmoji("🏅").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("profile.inventory." + interaction.member.id + "." + user.id).setEmoji("📦").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("profile.pets." + interaction.member.id + "." + user.id).setEmoji("🐶").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("profile.achievements." + interaction.member.id + "." + user.id).setEmoji("🏆").setStyle(ButtonStyle.Primary)
        );
        await interaction.editReply({ embeds: [pages["inventory"]], components: [row] });
    }
}