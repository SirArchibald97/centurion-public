const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, SlashCommandBuilder } = require("discord.js");
const { addAchievement, getAchievements } = require("../../utils/db");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("grant")
        .setDescription("Grant a user an achievement!")
        .addUserOption(user => user.setName("user").setDescription("Select a user").setRequired(true))
        .addStringOption(type => type.setName("type").setDescription("Select a type").setRequired(true).addChoices({ name: "Normal", value: "normal" }, { name: "Secret", value: "secret" })),

    async execute(client, interaction) {
        if (!interaction.member.roles.cache.has(client.config.directorRole) && !interaction.member.roles.cache.has(client.config.centRole))
            return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: You do not have permission to use this command!").setColor("Red")], ephemeral: true });

        const user = interaction.options.getMember("user");
        const type = interaction.options.getString("type");

        const achievementRows = [];
        let count = 0, options = [];
        let selectMenu = new StringSelectMenuBuilder().setCustomId("grant-achievement-" + achievementRows.length).setPlaceholder("Select an achievement");
        for (let [id, achievement] of client.achievements.filter(a => (type === "normal" ? !a.secret : a.secret) && !a.tiered).entries()) {
            options.push({ label: `${achievement.name}`, description: `${achievement.id}`, value: `${achievement.id}` });
            count++;
            if (count == 25) {
                achievementRows.push(new ActionRowBuilder().addComponents(selectMenu.addOptions(options)));
                selectMenu = new StringSelectMenuBuilder().setCustomId("grant-achievement-" + achievementRows.length).setPlaceholder("Select an achievement");
                count = 0;
                options = [];
            }
        }
        if (options.length > 0) achievementRows.push(new ActionRowBuilder().addComponents(selectMenu.addOptions(options)));


        const reply = await interaction.reply({ embeds: [new EmbedBuilder().setDescription("Select an achievement to grant").setColor("Blurple")], components: achievementRows, fetchReply: true, ephemeral: true });
        const filter = (int) => int.member.id === interaction.member.id;
        const collector = reply.createMessageComponentCollector({ filter: filter, time: 60000, max: 1 });
        collector.on("end", async (collected) => {
            if (collected.size == 0) {
                await reply.edit({ embeds: [new EmbedBuilder().setDescription("Operation timed out!").setColor("Red")], components: [] });
            } else {
                const achievements = await getAchievements(client.conn, user.id);
                if (achievements.find(a => a.id == collected.first().values[0])) return await collected.first().update({ embeds: [new EmbedBuilder().setDescription(`:x: <@${user.id}> has already recieved that achievement!`).setColor("Red")], components: [] });

                const chosenAchievement = client.achievements.get(collected.first().values[0]);
                await addAchievement(client, user.id, chosenAchievement.id);
                await collected.first().update({ embeds: [new EmbedBuilder().setDescription(`🏆 Granted ${user} the achievement **${chosenAchievement.name}**!`).setColor("Green")], components: [] });
            }
        });
    }
}