module.exports = (client, oldChannel, newChannel) => {
	if (client.config.logBlacklist.includes(newChannel.id) || newChannel.parentId === '921359666137681920') return;
	//client.log.channelUpdate(oldChannel, newChannel);
};
