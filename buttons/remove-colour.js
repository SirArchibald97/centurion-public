const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { checkForAchievement, addAchievement } = require("../utils/db");
const { secretAchievement } = require("../utils/embeds");

module.exports = async (client, interaction) => {
    const colourRoles = [
        { name: 'Brown', id: '934634055163600926', type: 's' },
        { name: 'Lime', id: '934624353792950322', type: 's' },
        { name: 'Blue', id: '934624373556523019', type: 's' },
        { name: 'Cyan', id: '934624376479948822', type: 's' },
        { name: 'Pink', id: '934624358956159077', type: 's' },
        { name: 'Orange', id: '943190629016543232', type: 's' },

        { name: 'Black', id: '934624365570555944', type: 'p' },
        { name: 'Dark Grey', id: '934633408724889640', type: 'p' },
        { name: 'Gold', id: '934634371766448198', type: 'p' },
        { name: 'Silver', id: '934624368238161931', type: 'p' },
        { name: 'Bronze', id: '934624371128025158', type: 'p' },
        { name: 'White', id: '934624362303217675', type: 'p' },
        { name: 'Dark Blue', id: '934635165051920384', type: 'p' },
        { name: 'Dark Red', id: '934635316822806570', type: 'p' },
    ];

    let roleRemoved = false;
    for (let role of colourRoles) {
        if (interaction.member.roles.cache.has(role.id)) {
            await interaction.member.roles.remove(role.id);
            roleRemoved = true;
        }
    }
    if (!roleRemoved) return await interaction.reply({ content: `You don't have any colour roles!`, ephemeral: true });

    const confirm = await interaction.reply({
        embeds: [new EmbedBuilder().setDescription("Are you sure you want to do this? Colour roles are non-refundable!").setColor("Blurple")],
        components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("c-confirm-color-role").setLabel("CONFIRM").setStyle(ButtonStyle.Success))],
        ephemeral: true, fetchReply: true
    });
    const filter = (i) => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });
    collector.on("end", async (collected) => {
        if (collected.size === 0) {
            await confirm.delete();
        } else {
            await collected.first().update({ embeds: [new EmbedBuilder().setDescription("Removed all colour roles!").setColor("Red")], components: [] });

            
            const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "remove_colour_role");
            if (!hasCompleted) {
                await addAchievement(client, interaction.member.id, "remove_colour_role");
                await interaction.followUp({ embeds: [await secretAchievement(client.achievements.get("remove_colour_role"))], ephemeral: true });
            }
            
        }
    });
}