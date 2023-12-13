const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, SlashCommandBuilder } = require('discord.js');
const { getUser, giveCents, takeCents, getInventory, takeItem, giveItem, checkForAchievement, addAchievement } = require("../../utils/db");
const { achievement } = require("../../utils/embeds");
const { increaseAchievementLevel, getMaxInventorySlots, increaseTrophyLevel } = require("../../utils/levels");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gift')
		.setDescription('Gift Cents or an item to a user')
		.addSubcommand((cents) =>
			cents.setName('cents').setDescription('Gift Cents to a user')
				.addUserOption((user) => user.setName('user').setDescription('Select a user').setRequired(true))
				.addIntegerOption((amount) => amount.setName('amount').setDescription('Enter an amount').setRequired(true)),
		)
		.addSubcommand((item) =>
			item.setName('item').setDescription('Gift an item to a user')
				.addUserOption((user) => user.setName('user').setDescription('Select a user').setRequired(true)),
		),

	async execute(client, interaction) {
		//if (interaction.member.id !== "398890149607637013") return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: Sorry, this feature is under development!").setColor("RED")], ephemeral: true });

		const player = (await getUser(client.conn, interaction.member.id))[0];
		if (player.level < 10) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You must be `Level 10` to use this command!').setColor('Red')], ephemeral: true, });

		let user = interaction.options.getMember('user');


		if (interaction.options.getSubcommand() === "cents") {
			const amount = interaction.options.getInteger('amount');
			if (player.cents < amount) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You do not have enough Cents to gift that much!').setColor('Red')], ephemeral: true });
			if (amount < 1) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You cannot gift less than <:cent:1042902432914620497> **1**!').setColor('Red')], ephemeral: true });
            if (user.id === interaction.member.id) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: You cannot gift to yourself!").setColor("Red")] });

			await giveCents(client.conn, user.id, amount);
			await takeCents(client.conn, interaction.member.id, amount);
			await interaction.reply({ embeds: [new EmbedBuilder().setDescription(`:heart: Wow, that is very generous of you!`).setColor('DarkVividPink')], ephemeral: true });

			const message = await interaction.channel.send({
				content: `<@${interaction.member.id}> <@${user.id}>`,
				embeds: [new EmbedBuilder().setDescription(`🎁 <@${interaction.member.id}> gifted <:cent:1042902432914620497> **${amount}** to <@${user.id}>!`).setColor('Green')],
				components: [],
                fetchReply: true
			});

			
			if (amount >= 100) {
                const member = await interaction.guild.members.fetch(user.id);
				if (member.roles.cache.has(client.config.directorRole) || member.roles.cache.has(client.config.centRole)) {
					const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "cents_to_director");
					if (!hasCompleted) {
						await addAchievement(client, interaction.member.id, "cents_to_director");
                        await increaseAchievementLevel(client, message.member);
						await message.reply({ embeds: [await achievement(client.achievements.get("cents_to_director"))] });
					}
				}
			}
            
			

		} else if (interaction.options.getSubcommand() === "item") {
			const inventory = await getInventory(client.conn, interaction.member.id);
			const giftingToInventory = await getInventory(client.conn, user.id);
			const maxSlots = await getMaxInventorySlots(client.conn, client, user);

			console.log(user.user.username, giftingToInventory.length, maxSlots);
			if (giftingToInventory.length >= maxSlots) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(`:x: That user's inventory is full!`).setColor('Red')], ephemeral: true });

			let items = new StringSelectMenuBuilder().setCustomId('items');
			let hasAnyGiftableItems = false;
			for (let entry of inventory) {
				let fetchedItem = client.items.get(entry.item);
				if (!fetchedItem.unfindable || fetchedItem.giftable) {
					hasAnyGiftableItems = true;
					items.addOptions({ label: fetchedItem.name, value: fetchedItem.id });
				}
			}
			let menu = new ActionRowBuilder().addComponents(items);

			if (!hasAnyGiftableItems) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(`:x: You do not have any items to gift.`).setColor('Red')], });
            if (user.id === interaction.member.id) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: You cannot gift to yourself!").setColor("Red")] });

			await interaction.reply({
				embeds: [new EmbedBuilder().setDescription('🎁 Select an item to gift!').setColor('Blurple')],
				components: [menu],
			});
			let reply = await interaction.fetchReply();
			let filter = (int) => int.member.id === interaction.member.id;
			let collector = reply.createMessageComponentCollector({ filter: filter, max: 1 });
			collector.on('end', async (collected) => {
				let item = client.items.get(collected.first().values[0]);
				await takeItem(client.conn, interaction.member.id, item.id);
				await giveItem(client.conn, user.id, item.id);
				await collected.first().update({
					content: `<@${interaction.member.id}> <@${user.id}>`,
					embeds: [new EmbedBuilder().setDescription(`🎁 <@${interaction.member.id}> gifted **1x ${item.name}** to <@${user.id}>!`).setColor('Green')],
					components: [],
				});

                
                const isCompleted = await checkForAchievement(client.conn, interaction.member.id, "gift_item");
                if (!isCompleted) {
                    await addAchievement(client, interaction.member.id, "gift_item");
                    await interaction.followUp({ embeds: [await achievement(client.achievements.get("gift_item"))] });
                    const levelupEmbed = await increaseAchievementLevel(client, interaction.member);
                    if (levelupEmbed) {
                        await interaction.followUp({ embeds: [levelupEmbed] });
                    }
                    const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                    if (trophyLevelUp) {
                        await interaction.followUp({ embeds: [trophyLevelUp] });
                    }
                }
			});
		}
	}
};
