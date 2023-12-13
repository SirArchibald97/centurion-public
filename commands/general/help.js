const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, SlashCommandBuilder } = require('discord.js');
const { addAchievement, checkForAchievement } = require('../../utils/db');
const { achievement } = require('../../utils/embeds');
const { log } = require('../../utils/log');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Displays information on the different commands and features!'),

	async execute(client, interaction) {
		//if (interaction.member.id !== "398890149607637013") return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: Sorry, this feature is under development!").setColor("RED")], ephemeral: true });

		let pages = [
            /* Server Information */ 
			new EmbedBuilder()
				.setTitle('👋 The Server')
				.setFooter({ text: 'Use the menu below to select a page' })
				.setColor('Blurple')
				.setDescription(
					"Welcome to Cent's Lounge, the official Discord server for Centranos!\n\n> Read the <#918969718826733588> for the Dos and Don'ts\n> Check out <#919197728981004308> and <#918984810100314163> for info on server roles\n> Follow the <#918969692545253439> channels for new Centranos videos, server news and Hypixel announcements\n\n",
				),

            /* EXP, Cents and Items */
			new EmbedBuilder()
				.setTitle('💰 EXP, Cents and Items')
				.setFooter({ text: 'Use the menu below to select a page' })
				.setColor('Blurple')
				.addFields({
					name: 'EXP',
					value: 'EXP is earned from chatting in the server, so the more you chat the higher you level up! You can use `/profile` to view your Social Rank and other stats, and `/top xp` to view the server leaderboard for EXP.',
                },
				{
					name: 'Cents',
					value: 'Cents (¢) are our custom currency, and can be earned by using items that randomly drop when chatting in the server. You can see your Cents in `/profile` and can view the server leaderboard with `/top cents`.',
                },
				{
					name: 'Items',
					value: 'Items are dropped randomly when chatting in the server, and have a variety of different uses such as EXP boosts, currency, and other fun quirks. You can do `/profile inventory` (or `/inventory`) to view your items and `/use` to use an item.',
                }),

            /* Items Continued */
			new EmbedBuilder()
				.setTitle('💡 Items Continued')
				.setFooter({ text: 'Use the menu below to select a page' })
				.setColor('Blurple')
				.addFields({
					name: 'Crafting',
					value: 'Certain items can only be obtained through crafting, such as pets. To craft an item use `/craft`, but make sure you have the required materials first!\n\nYou can check the recipes of every craftable item by doing `/recipes`',
                }),

            /* Pets */
            new EmbedBuilder()
                .setTitle('🐶 Pets')
                .setFooter({ text: 'Use the menu below to select a page' })
                .setColor('Blurple')
                .addFields({
                    name: 'Obtaining',
                    value: 'You can obtain pets by crafting them with Pet Cores and their respective items. Each rarity has one or more pets each with their own perks. Each pet requires 5 of its respective item plus an increasing amount of Pet Cores, dependant on its rarity, to craft.'
                },
                {
                    name: 'Perks',
                    value: 'You can claim your pet\'s perk once every 24 hours using `/pet claim <type>`. This will give you an item you can use to execute the pet\'s perk! Try \`/pet claimall\` to claim all your pet\'s perks at once!\n\nNot all pets provide a claimable perk, some have perks that are always active.'
                }),

            /* Banking */
			new EmbedBuilder()
				.setTitle('💳 Banking')
				.setFooter({ text: 'Use the menu below to select a page' })
				.setColor('Blurple')
				.addFields({
					name: 'Bank Accounts',
					value: 'You can open a bank account by using a Bank Key item. Once opened, you can use the `/bank` command to deposit and withdraw Cents, and you can use Cents to upgrade your account\'s max capacity and interest rate.',
                },
				{
					name: 'Bank Interest',
					value: 'Each week you can claim interest on your bank balance, which is automatically paid back into your bank account. Use `/bank interest` to claim your interest. You can view your current interest rate in `/profile rank`.',
                }),

            /* Achievements */
            new EmbedBuilder()
                .setTitle('🏆 Achievements')
                .setFooter({ text: 'Use the menu below to select a page' })
                .setColor('Blurple')
                .addFields({
                    name: 'Earning Achievements',
                    value: 'You can earn achievements by interacting with the server and with Centurion. You can view all available achievements, including secret ones, in `/achievements`, or you can view your 5 most recently earned achievements in `/profile achievements`'
                },
                {
                    name: 'Achievement Points',
                    value: 'Each achievements awards you with a certain number of achievement points. At certain achievement point milestones, you will be awarded a higher achievement rank.'
                }),

            /* Reporting */
			new EmbedBuilder()
				.setTitle('⚠️ Reporting')
				.setFooter({ text: 'Use the menu below to select a page' })
				.setColor('Blurple')
				.addFields({
                    name: 'User Reports',
					value: 'You can report users to server moderators by right clicking on one of their messages, going to `Apps` and then `Report Message`. This will alert staff who will deal with the issue.',
                },
                {
                    name: 'Bug Reports & Suggestions',
                    value: 'You can report any bugs you find in the server with the `/bug` command! If you have a suggestion for a features, please create a post in <#1021177921458688152>'
                }),
		];

		let menu = new StringSelectMenuBuilder().setCustomId('help-menu').setPlaceholder('Select a page...');
		for (let page of pages) {
			menu.addOptions({ label: page.data.title, value: String(pages.indexOf(page)) });
		}
		let row = new ActionRowBuilder().addComponents(menu);

		const reply = await interaction.reply({ embeds: [pages[0]], components: [row], fetchReply: true });
		const achievementObject = client.achievements.get("use_help_cmd");
		const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "use_help_cmd");
		if (!hasCompleted) {
            await interaction.followUp({ embeds: [await achievement(achievementObject)] });
            await addAchievement(client, interaction.member.id, "use_help_cmd");
        }

		let filter = (int) => int.member.id === interaction.member.id;
		let collector = reply.createMessageComponentCollector({ filter: filter, time: 60000 * 10 });
		collector.on('collect', async (int) => {
			await int.update({ embeds: [pages[int.values[0]]], components: [row] });
		});
		collector.on('end', async (collected) => {
            try {
                await collected.last().message.edit({ embeds: [collected.last().message.embeds], components: [] });
            } catch (err) { /* HELP MENU TIMED OUT WHILST DELETED */ }
		});
	},
};
