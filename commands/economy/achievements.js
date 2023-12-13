const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require("discord.js");
const { achievementCycle } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder().setName("achievements").setDescription("View your achievement progress")
        .addUserOption(user => user.setName("user").setDescription("Select a user").setRequired(false)),

    async execute(client, interaction) {
        //if (interaction.member.id !== "398890149607637013" && interaction.member.id !== "303468436233912330") return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: You are not allowed to use this command!").setColor("RED")], ephemeral: true });

        const member = interaction.options.getMember("user") || interaction.member;
        const pages = await achievementCycle(client, interaction, member);
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("achievement.left.0." + member.id).setEmoji("⬅️").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("achievement.right.0." + member.id).setEmoji("➡️").setStyle(ButtonStyle.Primary)
        )
        await interaction.reply({ embeds: [pages[0]], components: (pages.length > 1 ? [buttons] : []), ephemeral: true });
    }
}