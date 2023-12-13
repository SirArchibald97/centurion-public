const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName("fish").setDescription("Go fishing for treasure!"),

    async execute(client, interaction) {
        await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: You have no fishing rod!").setColor("Red")], ephemeral: true });
    }
}