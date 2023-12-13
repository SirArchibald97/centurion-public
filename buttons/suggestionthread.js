module.exports = async (client, interaction) => {
	if (interaction.message.hasThread) return await interaction.reply({ content: "This suggestion already has a thread!", ephemeral: true });
	const thread = await interaction.message.startThread({ name: `💡 ${interaction.message.embeds[0].title.split(": ")[1]}`, autoArchiveDuration: 1440, rateLimitPerUser: 2 });
	await thread.join();
	await interaction.reply({ content: "A thread has been created! Click below the message to join the discussion.", ephemeral: true });
}