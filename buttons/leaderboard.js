const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getExpLeaderboard, getCentLeaderboard, getAPLeaderboard } = require("../utils/db");

module.exports = async (client, interaction) => {
    const leaderboardType = interaction.customId.split(".")[1];
    let everyone;
    if (leaderboardType === "exp") {
        everyone = await getExpLeaderboard(client.conn);
    } else if (leaderboardType === "cents") {
        everyone = await getCentLeaderboard(client.conn);
    } else {
        everyone = await getAPLeaderboard(client.conn);
    }

    const cycleDirection = interaction.customId.split(".")[2];
    let startingIndex = parseInt(interaction.customId.split(".")[3]);
    if (cycleDirection === "prev") {
        startingIndex -= 10;
        if (startingIndex < 0) startingIndex = everyone.length - 10;
    } else {
        startingIndex += 10;
        if (startingIndex > everyone.length - 10) startingIndex = 0;
    }

    const filtered = everyone.slice(startingIndex, startingIndex + 10);
    const you = everyone.filter(p => p.id === interaction.member.id)[0];

    let onPage = false;
    if (filtered.filter(p => p.id === interaction.member.id).length > 0) onPage = true;

    const desc = filtered.map((person) => `#${everyone.indexOf(person) + 1} <@${person.id}> > **Level ${person.level}** \`(${Math.floor(person.xp).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')})\``).join("\n");

    await interaction.update({
        embeds: [new EmbedBuilder().setTitle(`Name > Level (Total EXP)`).setColor('Blurple').setTimestamp().setFooter({ text: `Viewing ${startingIndex + 1}-${startingIndex + 10}` })
            .setDescription(desc + (!onPage ? `\n\n**Your position:**\n#${everyone.indexOf(you) + 1} <@${you.id}> > **Level ${you.level}** \`(${Math.floor(you.xp).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')})\`` : ""))
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("leaderboard.exp.prev." + startingIndex).setEmoji("◀️").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("leaderboard.exp.next." + startingIndex).setEmoji("▶️").setStyle(ButtonStyle.Primary)
            )
        ]
    });
}