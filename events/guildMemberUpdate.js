const { Events } = require("discord.js");

module.exports = async (client, oldMember, newMember) => {

    /* BOOST */
    if (!oldMember.roles.cache.has(client.config.boosterRole) && newMember.roles.cache.has(client.config.boosterRole)) {
        await newMember.guild.channels.cache.get("918967225774391359").send({
            content: `:tada: Thank you <@${newMember.id}> for boosting the server! You can check out some of your new perks in <#919197728981004308>`
        });
    }

    /* NEW MEMBER */
    if (!oldMember.roles.cache.has("918984623323754617") && newMember.roles.cache.has("918984623323754617")) {
        await newMember.guild.channels.cache.get("918967225774391359").send({
            content: `:wave: Welcome <@${newMember.id}> to the server!`
        })
    }
}

module.exports.type = Events.GuildMemberUpdate;