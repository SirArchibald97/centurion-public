const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require("discord.js");
const { recipeCycle } = require("../../utils/embeds");

module.exports = {
    data: new SlashCommandBuilder().setName("recipes").setDescription("View all recipes"),

    async execute(client, interaction) {
        const pages = await recipeCycle(client, interaction);
        await interaction.reply({ embeds: [pages[0]], components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("recipe.left.0").setEmoji("⬅️").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("recipe.right.0").setEmoji("➡️").setStyle(ButtonStyle.Primary)
            )
        ], ephemeral: true });
    }
}