const { checkForAchievement, addAchievement } = require('../utils/db');
const { achievement } = require('../utils/embeds');

module.exports = async (client, interaction) => {
    let roles = {
        yt: '918986448185737257',
        announcement: '920099121136799855',
        poll: '920099072369639424',
        giveaway: '920849552586706967',
        qotw: '922433461782982656',
        happyhour: '932609070324662312',
        sheher: '922928586623680593',
        hehim: '922928531669925898',
        theythem: '922928610887733308',
        other: '922928631603425301',
        nerds: '945802975199236183',
        streamparty: '1004749978557747210',
        housing: '1063938040101355521',
    };

    let role = client.guilds.cache.first().roles.cache.get(roles[interaction.customId.split(".")[1]]);
    let action;
    if (interaction.member.roles.cache.has(role.id)) {
        await interaction.member.roles.remove(role);
        action = 'removed';
    } else {
        await interaction.member.roles.add(role);
        action = 'added';
    }
    await interaction.reply({ content: `Successfully ${action} the role **${role.name}**!`, ephemeral: true });

    
    const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "claim_reaction_role");
    if (!hasCompleted) {
        await addAchievement(client, interaction.member.id, "claim_reaction_role");
        await interaction.followUp({ content: `<@${interaction.member.id}>`, embeds: [await achievement(client.achievements.get("claim_reaction_role"))], ephemeral: true });
    }
}