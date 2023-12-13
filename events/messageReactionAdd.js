const { Events } = require("discord.js");

module.exports = async (client, reaction, user) => {
	const channels = ["919042426314821653"];
	if (!channels.includes(reaction.message.channel)) return;

	let hasReacted = false;
	for (let [id, messageReaction] of reaction.message.reactions.cache) {
		const reactions = await messageReaction.users.fetch();
		if (reactions.has(user.id) && messageReaction.emoji.id !== reaction.emoji.id && !user.bot) hasReacted = true;
	}
	if (hasReacted) await reaction.users.remove(user);
}

module.exports.type = Events.MessageReactionAdd;