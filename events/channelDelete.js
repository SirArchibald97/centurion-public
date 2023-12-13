module.exports = (client, channel) => {
	if (client.config.logBlacklist.includes(channel.id) || channel.parentId === '921359666137681920') return;
	//client.log.channelDelete(channel);
};
