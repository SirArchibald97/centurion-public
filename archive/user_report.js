const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, MessageSelectMenu, ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
	data: new ContextMenuCommandBuilder().setName('Report User').setType(2),

	async execute(client, interaction) {
		let member = interaction.targetMember;

		let menu = new MessageSelectMenu()
			.setCustomId('menu')
			.setPlaceholder('Select a reason...')
			.addOptions([
				{ label: 'Chat Abuse', value: 'Chat Abuse' },
				{ label: 'Inappropriate Account Content', value: 'Inappropriate Account Content' },
				{ label: 'Terms of Service Violation', value: 'TOS Violation' },
				{ label: 'Punishment Evasion', value: 'Punishment Evasion' },
			]);
		await interaction.reply({ embeds: [], components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
		let reply = await interaction.fetchReply();

		let filter = (int) => int.member.id === interaction.member.id;
		let collector = reply.createMessageComponentCollector({ filter: filter, max: 1 });
		collector.on('end', async (collected) => {
			let reason = collected.first().values[0];

			await collected.first().update({
				content: `Thanks for your report! This message from <@${member.id}> has been flagged to server moderators.`,
				ephemeral: true,
				components: [],
			});
			let reportschannel = await client.channels.fetch(client.config.reports);

			await reportschannel.send({
				embeds: [
					new EmbedBuilder()
						.setTitle(`New User Report!`)
						.addField('Reported by', `<@${interaction.member.id}>`, true)
						.addField('Reported in', `<#${interaction.channelId}>`, true)
						.addField('Reported User', `<@${interaction.targetMember.id}>`, true)
						.addField('Reason', reason, true)
						.setColor('BLURPLE'),
				],
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder().setCustomId('resolve').setLabel('Resolve').setStyle('ButtonStyle.Primary'),
					),
				],
			});
		});
	},
};
