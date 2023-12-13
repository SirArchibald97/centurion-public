const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { getUser, depositCents, withdrawCents, addInterest, upgradeBank, addAchievement, checkForAchievement } = require("../../utils/db");
const { achievement } = require('../../utils/embeds');
const { increaseAchievementLevel, increaseTrophyLevel } = require('../../utils/levels');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bank')
		.setDescription('Manage your bank account')
		.addSubcommand((deposit) =>
			deposit.setName('deposit').setDescription('Deposit Cents into your bank account')
				.addIntegerOption((amount) => amount.setName('amount').setDescription('Enter an amount').setRequired(true)),
		)
		.addSubcommand((withdraw) =>
				withdraw.setName('withdraw').setDescription('Withdraw Cents from your bank account')
				.addIntegerOption((amount) => amount.setName('amount').setDescription('Enter an amount').setRequired(true)),
		)
		.addSubcommand((interest) => interest.setName('interest').setDescription('Claim your bank interest'))
		.addSubcommand((upgrade) => upgrade.setName('upgrade').setDescription('Upgrade your bank account')),

	async execute(client, interaction) {
		//if (interaction.member.id !== "398890149607637013") return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: Sorry, this feature is still under development!").setColor("RED")], ephemeral: true });

		let bankLevels = [
			{ max: 5000, upgradeCost: 2500, interestRate: 0.005 },
			{ max: 15000, upgradeCost: 7500, interestRate: 0.01 },
			{ max: 50000, upgradeCost: 25000, interestRate: 0.02 },
			{ max: 100000, upgradeCost: 50000, interestRate: 0.04 },
		];

		const player = (await getUser(client.conn, interaction.member.id))[0];
		if (player.hasBank === 0) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You do not have a bank account!').setColor('Red')], ephemeral: true });

		let action = interaction.options.getSubcommand();
		let banklevel = bankLevels[player.bankLevel - 1];

		if (action === 'deposit') {
			let amount = interaction.options.getInteger('amount');
            if (amount > player.cents) amount = player.cents;
			if (amount + player.bank > banklevel.max) amount = banklevel.max - player.bank;
			if (amount < 1) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You cannot deposit less than <:cent:1042902432914620497> **1**!').setColor('Red')], ephemeral: true });

			await depositCents(client.conn, interaction.member.id, amount);
			await interaction.reply({ embeds: [new EmbedBuilder().setDescription(`💳 Deposited <:cent:1042902432914620497> **${amount}** into your bank account!`).setColor('Green')] });

		} else if (action === 'withdraw') {
            let amount = interaction.options.getInteger('amount');
			if (amount > player.bank) amount = player.bank;

			if (amount < 1) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You cannot withdraw less than <:cent:1042902432914620497> **1**!').setColor('Red')], ephemeral: true });

			await withdrawCents(client.conn, interaction.member.id, amount);
			await interaction.reply({ embeds: [new EmbedBuilder().setDescription(`💳 Withdrew <:cent:1042902432914620497> **${amount}** from your bank account!`).setColor('Green')] });

		} else if (action === 'interest') {
			if (Number(player.lastCollected) + 1000 * 60 * 60 * 24 * 7 >= Date.now())
				return await interaction.reply({
					embeds: [
						new EmbedBuilder()
							.setDescription(`:x: You cannot collect interest yet! You are next able to collect <t:${Math.floor((Number(player.lastCollected) + 1000 * 60 * 60 * 24 * 7) / 1000)}:R>`)
							.setColor('Red'),
					],
				});
			const interest = player.bank * banklevel.interestRate;
			await addInterest(client.conn, interaction.member.id, interest);
			await interaction.reply({ embeds: [new EmbedBuilder().setDescription(`💳 You have collected this weeks interest of <:cent:1042902432914620497> **${Math.floor(interest)}**!`).setColor('Green')], });

            
            const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "claim_interest");
            if (!hasCompleted) {
                await addAchievement(client, interaction.member.id, "claim_interest");
                await interaction.followUp({ embeds: [await achievement(client.achievements.get("claim_interest"))] });
                const levelupEmbed = await increaseAchievementLevel(client, interaction.member);
                if (levelupEmbed) {
                    await interaction.followUp({ embeds: [levelupEmbed] });
                }
                const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                if (trophyLevelUp) {
                    await interaction.followUp({ embeds: [trophyLevelUp] });
                }
            }
            
		} else if (action === 'upgrade') {
			if (banklevel.upgradeCost > player.cents) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You do not have enough Cents to do this!').setColor('Red')], ephemeral: true });
			if (player.bankLevel === 4) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: Your bank account is maxed out!').setColor('Red')], ephemeral: true });

			await interaction.reply({
				embeds: [new EmbedBuilder().setDescription(`Are you sure you want to upgrade your bank to **Level ${player.bankLevel + 1}** for <:cent:1042902432914620497> **${banklevel.upgradeCost}**?`).setColor('Blurple')],
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder().setCustomId('confirm').setLabel('CONFIRM').setStyle(ButtonStyle.Success),
						new ButtonBuilder().setCustomId('cancel').setLabel('CANCEL').setStyle(ButtonStyle.Danger),
					),
				],
			});

			let reply = await interaction.fetchReply();
			let filter = (int) => int.member.id === interaction.member.id;
			let collector = await reply.createMessageComponentCollector({ filter: filter, max: 1, time: 60000 });
			collector.on('end', async (collected) => {
				if (collected.size > 0) {
					const action = collected.first().customId;
					if (action === 'confirm') {
						await upgradeBank(client.conn, interaction.member.id, banklevel.upgradeCost);
						await collected.first().update({
							embeds: [new EmbedBuilder().setDescription(`💳 Upgraded your bank to **Level ${player.bankLevel + 1}**!`).setColor('Green')],
							components: [],
						});

						
                        const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "buy_bank_upgrade");
						if (!hasCompleted) {
							await addAchievement(client, interaction.member.id, "buy_bank_upgrade");
							await interaction.followUp({ embeds: [await achievement(client.achievements.get("buy_bank_upgrade"))] });
                            const levelupEmbed = await increaseAchievementLevel(client, interaction.member);
                            if (levelupEmbed) {
                                await interaction.followUp({ embeds: [levelupEmbed] });
                            }
                            const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                            if (trophyLevelUp) {
                                await interaction.followUp({ embeds: [trophyLevelUp] });
                            }
						}

						if (player.bankLevel + 1 === bankLevels.length) {
							const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "max_bank");
							if (!hasCompleted) {
								await addAchievement(client, interaction.member.id, "max_bank");
								await interaction.followUp({ embeds: [await achievement(client.achievements.get("max_bank"))] });
                                const levelupEmbed = await increaseAchievementLevel(client, interaction.member);
                                if (levelupEmbed) {
                                    await interaction.followUp({ embeds: [levelupEmbed] });
                                }
                                const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                                if (trophyLevelUp) {
                                    await interaction.followUp({ embeds: [trophyLevelUp] });
                                }
							}
						}
                        
						
					} else {
						await collected.first().update({
							embeds: [new EmbedBuilder().setDescription(`💳 Cancelled bank upgrade!`).setColor('Red')],
							components: [],
							ephemeral: true
						});
					}
				} else {
					await reply.edit({
						embeds: [new EmbedBuilder().setDescription(`:x: Operation timed out!`).setColor('Red')],
						components: [],
						ephemeral: true
					});
				}
			});
		}
	},
};
