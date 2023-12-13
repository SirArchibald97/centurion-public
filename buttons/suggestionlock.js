const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = async (client, interaction) => {
	if (!interaction.member.roles.cache.has(client.config.staffRole) && !interaction.member.roles.cache.has(client.config.directorRole) && !interaction.member.roles.cache.has(client.config.centRole))
		return await interaction.reply({ content: "You cannot use this button!", ephemeral: true });

	const thread = interaction.message.thread;
	if (thread) await thread.setLocked(true, "Suggestion implemented");

	await interaction.message.edit({
		embeds: interaction.message.embeds,
		components: [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId(`suggestionthread`).setLabel("Create thread").setStyle(ButtonStyle.Primary).setDisabled(true),
				new ButtonBuilder().setCustomId("suggestionlock").setLabel("Lock suggestion").setStyle(ButtonStyle.Secondary).setDisabled(true)
			)
		]
	});
	await interaction.message.react("⭐");
	await interaction.reply({ content: "Marked this suggestion as implemented and locked the thread!", ephemeral: true });
}