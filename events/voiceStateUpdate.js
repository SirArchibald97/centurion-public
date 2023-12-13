const { Events } = require('discord.js');
const { checkForAchievement, addAchievement } = require('../utils/db');
const { achievement } = require('../utils/embeds');
const { increaseAchievementLevel } = require("../utils/levels");

module.exports = async (client, oldState, newState) => {
    
	if (newState.channelId === "919331053607485502") {
		const hasCompleted = await checkForAchievement(client.conn, newState.member.id, "enter_void");
		if (!hasCompleted) {
			await addAchievement(client, newState.member.id, "enter_void");
            await increaseAchievementLevel(client, message.member);
			await newState.guild.channels.cache.get("918967225774391359").send({ content: `<@${newState.member.id}>`, embeds: [await achievement(client.achievements.get("enter_void"))] });
		}
	}
    
};

module.exports.type = Events.VoiceStateUpdate;