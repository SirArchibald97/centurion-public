const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('sus').setDescription('Suspicious command'),

	async execute(client, interaction) {
		await interaction.reply({
			files: ['https://cdn.discordapp.com/emojis/862418230085943296.gif?size=40&quality=lossless'],
		});
	},
};
