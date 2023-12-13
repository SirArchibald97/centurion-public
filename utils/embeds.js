const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ConnectionService } = require('discord.js');
const { getBoosts, getExpLeaderboard, getCentLeaderboard, getUser, getInventory, getPets, getAchievements, getTrophyPetCents } = require('./db');
const fs = require('fs');
const { Embed } = require('@discordjs/builders');

const unmuted = async (user, length) => {
	return new Promise(async (resolve, reject) => {
		let embed = new EmbedBuilder()
			.setTitle('Unmute')
			.setDescription(`User <@${user}> has been unmuted after **${length}d**!`)
			.setColor('Blurple')
			.setTimestamp();
		resolve(embed);
	});
}

const levelup = async (user, level) => {
	return new Promise(async (resolve, reject) => {
		let embed = new EmbedBuilder()
			.setDescription(`:tada: Congratulations <@${user}>, you have leveled up to **level ${level}**!`)
			.setColor('Green');
		resolve(embed);
	});
}

const awardedItem = async (user, item, reason) => {
	return new Promise(async (resolve, reject) => {
		let embed = new EmbedBuilder()
			.setDescription(`:gift: Ahoy, <@${user}>. You have been awarded the \`\`${item}\`\` because ${reason}`)
			.setColor('Orange');
		resolve(embed);
	});
}

const achievement = async (achievement) => {
	return new Promise(async (resolve, reject) => {
		resolve(new EmbedBuilder()
			.setDescription(`🔱 You completed an achievement!\n\n**${achievement.name}** \`[${achievement.points}]\`\n > ${achievement.desc}`).setColor("Gold")
		);
	});
}

const secretAchievement = async (achievement) => {
	return new Promise(async (resolve, reject) => {
		resolve(new EmbedBuilder()
			.setDescription(`⚜️ You completed a **secret** achievement!\n\n**${achievement.name}** \`[${achievement.points}]\`\n > ${achievement.desc}`).setColor("DarkPurple")
		);
	});
}

const rankPage = async (client, interaction, isButton) => {
	return new Promise(async (resolve, reject) => {
		const user = isButton ? await interaction.guild.members.fetch(interaction.customId.split(".")[3]) : (interaction.options?.getMember("user") || interaction.member);
		const everyone = await getExpLeaderboard(client.conn);
		const player = (await getUser(client.conn, user.id))[0];

		// xp needed for the user to reach the next level
		const xpForNextLevel = player.level > 99 ? 2000 : Math.floor(100 * 1.03 ** player.level);
		// finding the rank in the leaderboard
		const userInEveryone = everyone.find((dbUser) => dbUser.id === user.id);
		let rank = everyone.indexOf(userInEveryone) + 1;

		// calculating total exp needed for their current level - 1
		let total = 0;
		for (let level = 1; level < player.level; level++) {
			if (level <= 100) {
				total += 100 * 1.03 ** level;
			} else {
				total += 2000;
			}
		}

		// calculating progress through level -> players current total exp - (total exp needed for their current level - 1)
		const progressThroughLevel = player.xp - Math.floor(total);
		// convert to percentage
		const percentageProgress = Math.round((progressThroughLevel / xpForNextLevel) * 10);
		// create progress bar
		let progressBar = `${player.level} `;
        if (percentageProgress < 10) {
            for (let i = 1; i <= percentageProgress; i++) { progressBar += "🟪"; }
            for (let i = 1; i <= (10 - percentageProgress); i++) { progressBar += "⬜"; }
        } else {
            progressBar += "🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪"
        }
		progressBar += ` ${player.level + 1}`;

		// format join date
		const dateJoined = new Date(user.joinedAt);
		const formattedDateJoined = `${dateJoined.getDate() < 10 ? '0' + dateJoined.getDate() : dateJoined.getDate()}/${dateJoined.getMonth() + 1 < 10 ? '0' + (dateJoined.getMonth() + 1) : dateJoined.getMonth() + 1}/${dateJoined.getFullYear()}`;

		// boost data
		const boosts = await getBoosts(client.conn, user.id);
		let activeBoost = 'No active boost!';
		if (boosts.length > 0) activeBoost = client.items.get(boosts[0].type).name;

		// bank data
		const bankLevels = [
			{ max: 5000, upgradeCost: 2500, interestRate: 0.005 },
			{ max: 15000, upgradeCost: 7500, interestRate: 0.01 },
			{ max: 50000, upgradeCost: 25000, interestRate: 0.02 },
			{ max: 100000, upgradeCost: 50000, interestRate: 0.04 },
		];

		// avatar
		const avatar = user.avatarURL() === null ? user.user.avatarURL() : user.avatarURL();

        resolve(
            new EmbedBuilder().setTitle(user.user.tag).setColor("Blurple").setTimestamp().setThumbnail(avatar).setFooter({ text: `Joined: ${formattedDateJoined}` })
            .addFields({ 
                name: 'Levels',
                value: "\`\`\`ansi\n" +
                `Rank [0;30m> [1;37m#${rank}\n` +
                `[0mLevel [0;30m> [1;37m${player.level} [0m(${Math.floor(player.xp).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} EXP)\n` +
                `[0mProgress [0;30m> [1;37m${Math.floor(progressThroughLevel)} / ${xpForNextLevel}\n\n` +
                `[1;37m${progressBar} [0m(${Math.round((progressThroughLevel / xpForNextLevel) * 100)}%)\n` +
                "\`\`\`"
            }, { 
                name: 'Economy',
                value: "\`\`\`ansi\n" +
                `Purse [0;30m> [1;37m¢${Math.floor(player.cents).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}\n` +
                `[0mBank Balance [0;30m> ${player.hasBank === 0? '[1;37mNot purchased!': `[1;37m¢${Math.floor(player.bank)} [0m/ ¢${bankLevels[player.bankLevel - 1].max}`}${player.bank === bankLevels[player.bankLevel - 1].max ? " [1;31m[FULL]" : ""}\n` +
                `[0mUpgrade Cost [0;30m> [1;37m¢${bankLevels[player.bankLevel - 1].upgradeCost}\n` +
                `[0mInterest Rate [0;30m> [1;37m${bankLevels[player.bankLevel - 1].interestRate * 100}% [0m(Level ${player.bankLevel})\n\n` +
                `[0mActive Boost [0;30m> [1;37m${activeBoost}\n` +
                "\`\`\`"
            })
        )
	});
}

const inventoryPage = async (client, interaction, maxSlots, isButton) => {
	return new Promise(async (resolve, reject) => {
		const user = isButton ? (await interaction.guild.members.fetch(interaction.customId.split(".")[3])) : (interaction.options?.getMember("user") || interaction.member);
		const inventory = await getInventory(client.conn, user.id);

		// avatar
		const avatar = user.avatarURL() === null ? user.user.avatarURL() : user.avatarURL();

		const embed = new EmbedBuilder().setTitle(`📦 ${user.user.username}'s Inventory`).setColor('Blurple').setTimestamp().setFooter({ text: `${inventory.length}/${maxSlots}` }).setThumbnail(avatar);
		if (inventory.length === 0) {
			resolve(embed.setDescription("Your inventory is empty!"));
		} else {
			let items = "";
			if (interaction.member.presence?.clientStatus.mobile) {
				items += "```css\n";
				for (let entry of inventory) {
					const item = client.items.get(entry.item);
					items += `\n[${item.rarity.toUpperCase()}] ${item.name} (x${entry.quantity})\n${item.desc}\n`;
				}
				items += "```";
			} else {
				items += "```ansi\n";
				const colours = { Legendary: '33', Epic: '35', Rare: '34', Uncommon: '32', Common: '30' };
				for (let entry of inventory) {
					const item = client.items.get(entry.item);
					items += `\n[0;${colours[item.rarity]}m[${item.rarity.toUpperCase()}] [1;37m${item.name} (x${entry.quantity})\n[0m${item.desc}\n`;
				}
				items += "```";
			}
			resolve(embed.setDescription(items));
		}
	});
}

const petPage = async (client, interaction, isButton) => {
	return new Promise(async (resolve, reject) => {
		const user = isButton ? (await interaction.guild.members.fetch(interaction.customId.split(".")[3])) : (interaction.options?.getMember("user") || interaction.member);
		const pets = await getPets(client.conn, user.id);
        const trophyPetCents = (await getTrophyPetCents(client.conn, interaction.member.id))[0];

		const avatar = user.avatarURL() || user.user.avatarURL();
		const embed = new EmbedBuilder().setTitle(`🐶 ${user.user.username}'s Pets`).setThumbnail(avatar).setTimestamp().setColor('Blurple');
		if (pets.length === 0) {
			embed.setDescription("You have no pets!");
		} else {
            let colours = { Eternal: '31', Legendary: '33', Epic: '35', Rare: '34', Uncommon: '32', Common: '30' };
            let desc = '```ansi';
            for (let slot of pets) {
                let pet = client.items.get(slot.type);
                if (pet.id.endsWith("trophy_pet")) {
                    desc += `\n[${pet.rarity === "Eternal" ? "1" : "0"};${colours[pet.rarity]}m[${pet.rarity.toUpperCase()}][0;37m ${pet.name} ¢${trophyPetCents?.amount || 0}\n[0m${pet.desc}\n`;
                } else {
                    desc += `\n[${pet.rarity === "Eternal" ? "1" : "0"};${colours[pet.rarity]}m[${pet.rarity.toUpperCase()}][0;37m ${pet.name}${Number(slot.lastClaimed) + 1000 * 60 * 60 * 24 < Date.now() ? " ✅" : ""} \n[0m${pet.desc}\n`;
                // [0mTime to Claim [0;30m> [1;37m${timeToClaim}
                }
            }
            desc += '```';
            embed.setDescription(desc + "\nUse `/pet claim` to claim a pet's perk!");
		}
		resolve(embed);
	});
}

const achievementPage = async (client, interaction, isButton) => {
	return new Promise(async (resolve, reject) => {
		const user = isButton ? (await interaction.guild.members.fetch(interaction.customId.split(".")[3])) : (interaction.options?.getMember("user") || interaction.member);
		const achievements = await getAchievements(client.conn, user.id);

		const avatar = user.avatarURL() || user.user.avatarURL();
		const embed = new EmbedBuilder().setTitle(`🏆 ${user.user.username}'s Achievements`).setThumbnail(avatar).setTimestamp().setColor('Blurple');
		if (achievements.length === 0) {
			embed.setDescription("You have no achievements!");
		} else {
			let desc = ``;
			for (let entry of achievements.filter(a => !client.achievements.get(a.id).secret).slice(0, 5)) {
				const achievement = client.achievements.get(entry.id);
				desc += `${achievement.secret ? "⚜️ " : "🔱 "}**${achievement.name}** \`[${achievement.points}]\`\n> ${achievement.desc}\n\n`;
			}
			let total = 0;
			for (let achievement of achievements) { const obj = client.achievements.get(achievement.id); total += obj.points; }
			embed.setDescription(`Achievement Points: **${total}**\n\n` + desc);
		}
		resolve(embed);
	});
}

const achievementCycle = async (client, interaction, member) => {
	return new Promise(async (resolve, reject) => {
		const allAchievements = await getAchievements(client.conn, member.id);
		const pages = [];

		const normalAchievements = fs.readdirSync(__dirname + "/../achievements/normal");
		const secretAchievements = fs.readdirSync(__dirname + "/../achievements/secret");
        const tieredAchievements = fs.readdirSync(__dirname + "/../achievements/tiered");

        // Normal Achievements
		let count = 0, desc = "";
		let embed = new EmbedBuilder().setTitle(`🏆 ${member.user.username}'s Achievements`).setColor("Gold").setTimestamp();
		for (let entry of normalAchievements) {
			const achievementFile = client.achievements.get(entry.split(".")[0]);
			if (allAchievements.filter(a => a.id === achievementFile.id).length > 0) {
				desc += `🔱 **${achievementFile.name}** \`[${achievementFile.points}]\` <:agree:920128255074402314>\n> ${achievementFile.desc}\n> Completed on <t:${Math.floor(allAchievements.filter(a => a.id === achievementFile.id)[0].completedAt / 1000)}:d>\n\n`;
			} else {
				desc += `🔱 **${achievementFile.name}** \`[${achievementFile.points}]\` <:disagree:920128254910820353>\n> ${achievementFile.desc}\n> Not completed!\n\n`;
			}
			count++;
			if (count === 7) {
				pages.push(embed.setDescription(desc));
				embed = new EmbedBuilder().setTitle(`🏆 ${member.user.username}'s Achievements`).setColor("Gold").setTimestamp();
				desc = "";
				count = 0;
			}
		}
		if (desc.length > 0) pages.push(embed.setDescription(desc));


        // Tiered Achievements
        /*
        count = 0, desc = "", tiers = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };
        embed = new EmbedBuilder().setTitle(`🏆 ${interaction.member.user.username}'s Tiered Achievements`).setColor("DARK_GOLD").setTimestamp();
        for (let entry of tieredAchievements) {
            const achievementFile = client.achievements.get(entry.split(".")[0]);
            if (allAchievements.filter(a => a.id === achievementFile.id).length > 0) {
                const achievement = allAchievements.filter(a => a.id === achievementFile.id)[0];
                desc += `🔱 **${achievementFile.name}**\n\`\`\``;
                for (let tier of achievementFile.tiers) {
                    if (achievement.tier >= tier.tier) {
                        desc += `🟩 ${achievementFile.name} ${tiers[tier.tier]} [${tier.points}]\n    > ${tier.desc}\n`;
                    } else {
                        desc += `⬜ ${achievementFile.name} ${tiers[tier.tier]} [${tier.points}]\n    > ${tier.desc}\n`;
                    }
                }
                desc += "```\n";
            } else {
                desc += `🔱 **${achievementFile.name}**\n\`\`\``;
                for (let tier of achievementFile.tiers) {
                    desc += `⬜ ${achievementFile.name} ${tiers[tier.tier]} [${tier.points}]\n    > ${tier.desc}\n`;
                }
                desc += "```\n";
            }
            count++;
            if (count === 2) {
                pages.push(embed.setDescription(desc));
                embed = new EmbedBuilder().setTitle(`🏆 ${interaction.member.user.username}'s Tiered Achievements`).setColor("DARK_GOLD").setTimestamp();
                desc = "";
                count = 0;
            }
        }
        if (desc.length > 0) pages.push(embed.setDescription(desc));
        */


        // Secret Achievements
        if (interaction.member.id === member.id) {
            count = 0, desc = "";
            embed = new EmbedBuilder().setTitle(`🏆 ${member.user.username}'s Secret Achievements`).setColor("DarkPurple").setTimestamp();
            for (let entry of secretAchievements) {
                const achievementFile = client.achievements.get(entry.split(".")[0]);
                if (allAchievements.filter(a => a.id === achievementFile.id).length > 0) {
                    desc += `⚜️ **${achievementFile.name}** \`[${achievementFile.points}]\` <:agree:920128255074402314>\n> ${achievementFile.desc}\n> Completed on <t:${Math.floor(allAchievements.filter(a => a.id === achievementFile.id)[0].completedAt / 1000)}:d>\n\n`;
                } else {
                    desc += `⚜️ **???** \`[?]\` <:disagree:920128254910820353>\n> ???\n> Not completed!\n\n`;
                }
                count++;
                if (count === 7) {
                    pages.push(embed.setDescription(desc));
                    embed = new EmbedBuilder().setTitle(`🏆 ${member.user.username}'s Secret Achievements`).setColor("DarkPurple").setTimestamp();
                    desc = "";
                    count = 0;
                }
            }
            if (desc.length > 0) pages.push(embed.setDescription(desc));
        }


		for (let page of pages) { page.setFooter({ text: `${pages.indexOf(page) + 1}/${pages.length}` }) }
		resolve(pages);
	});
}

const recipeCycle = async (client, interaction) => {
    return new Promise(async (resolve, reject) => {
        const craftableItems = [];
        for (let [id, item] of client.items) {
            if (item.craftable) {
                craftableItems.push(item);
            }
        }
        const pages = [];
        let embed = new EmbedBuilder().setTitle("🛠️ Recipes").setDescription("test").setColor("Blurple");

        let count = 0, desc = "";
        for (let item of craftableItems) {
            desc += `**${item.name}**\n\`\`\``;
            for (let material of item.recipe) {
                desc += `> ${client.items.get(material.item).name} (x${material.quantity})\n`;
            }
            desc += `\`\`\`\n`;
            count += 1;
            if (count === 5) {
                pages.push(embed.setDescription(desc));
                embed = new EmbedBuilder().setTitle("🛠️ Recipes").setDescription("test").setColor("Blurple");
                count = 0;
                desc = "";
            }
        }
        if (desc.length > 0) pages.push(embed.setDescription(desc));

        for (let page of pages) { page.setFooter({ text: `${pages.indexOf(page) + 1}/${pages.length}` }); }
        resolve(pages);
    });
}

const petPouchPage = async (client, interaction, petPouch) => {
	return new Promise(async (resolve, reject) => {
		const embed = new EmbedBuilder().setTitle(`🐶 ${interaction.member.user.username}'${interaction.member.user.username.endsWith("s") ? "" : "s"} Pet Pouch`).setColor("Blurple").setTimestamp();
		if (petPouch.length === 0) {
			resolve(embed.setDescription("Your pet pouch is empty!"));
		} else {
			let items = "";
            items += "```ansi\n";
            const colours = { Legendary: '33', Epic: '35', Rare: '34', Uncommon: '32', Common: '30' };
            for (let entry of petPouch) {
                const item = client.items.get(entry.item);
                items += `\n[0;${colours[item.rarity]}m[${item.rarity.toUpperCase()}] [1;37m${item.name} (x${entry.quantity})\n[0m${item.desc}\n`;
            }
            items += "```";
			resolve(embed.setDescription(items));
		}
	});
}

const tradePages = async (client, trades) => {
	return new Promise(async (resolve, reject) => {
		const pages = [];

		let embed = new EmbedBuilder().setTitle("💰 Browse Trades").setColor("Blurple").setTimestamp();
		let count = 0, desc = "";
		if (trades.length === 0) {
			resolve(pages);

		} else {
			for (let trade of trades) {
				const item = client.items.get(trade.item);
				desc += `**${item.name}** (x${trade.quantity})\n> Price: <:cent:1042902432914620497> ${trade.price * trade.quantity} (${trade.price} each)\n > Seller: <@${trade.user}>\n\n`;
				count += 1;
				if (count === 5) {
					pages.push(embed.setDescription(desc));
					embed = new EmbedBuilder().setTitle("💰 Browse Trades").setColor("Blurple").setTimestamp();
					count = 0;
					desc = "";
				}
			}
			if (desc.length > 0) pages.push(embed.setDescription(desc));
			for (let page of pages) { page.setFooter({ text: `${pages.indexOf(page) + 1}/${pages.length}` }); }
			
			resolve(pages);
		}
	});
}

const tradeButtons = async (client, trades) => {
	return new Promise(async (resolve, reject) => {
		const rows = [];
		let row = new ActionRowBuilder();
		let count = 1;
		for (let trade of trades) {
			row.addComponents(new ButtonBuilder().setCustomId(`trade_buy.${trade.trade_id}`).setLabel(String(count)).setStyle(ButtonStyle.Primary))
			count++;

			if (row.components.length === 5) {
				rows.push(row);
				row = new ActionRowBuilder();
				count = 1;
			}
		}
		if (row.components.length > 0) {
			for (let i = row.components.length; i < 5; i++) row.addComponents(new ButtonBuilder().setCustomId(`trade_buy.null${i}`).setLabel(`\u200b`).setStyle(ButtonStyle.Primary).setDisabled(true));
            rows.push(row);
		}
		resolve(rows);
	});
};

const fishingPage = async (client, interaction, fish) => {
    return new Promise(async (resolve, reject) => {
        resolve(new EmbedBuilder().setTitle(`🎣 ${interaction.member.user.username}'${interaction.member.user.username.endsWith("s") ? "" : "s"} Fishing`).setColor("Blurple").setTimestamp().setDescription("Nothing to show yet!"));
    });
};

const dungeonsPage = async (client, member, dungeonsData) => {
    return new Promise(async (resolve, reject) => {
        const weapon = client.dungeons.gear.get(dungeonsData.weapon);
        const helmet = client.dungeons.gear.get(dungeonsData.helmet);
        const chestplate = client.dungeons.gear.get(dungeonsData.chestplate);
        const greaves = client.dungeons.gear.get(dungeonsData.greaves);
        const avatar = member.avatarURL() === null ? member.user.avatarURL() : member.avatarURL();

        resolve(new EmbedBuilder()
            .setTitle(`⚔️ ${member.user.username}'${member.user.username.endsWith("s") ? "" : "s"} Dungeons Stats`)
            .setColor("Blurple")
            .setTimestamp()
            .setThumbnail(avatar)
            .addFields(
                { name: "Stats", value: 
                    `\`\`\`\ansi\n` +
                    `[0mHealth [0;30m> [1;37m${dungeonsData.health}\n` +
                    `[0mDamage [0;30m> [1;37m${weapon.damage}\n` +
                    `[0mDefence [0;30m> [1;37m${helmet.defence + chestplate.defence + greaves.defence}\n` +
                    `\`\`\`` 
                },
                { name: "Gear", value:
                    `${weapon ? `${weapon.icon}  \`${weapon.name} (${weapon.damage} DMG)\`` : "None equipped!"}\n` + 
                    `${helmet ? `${helmet.icon}  \`${helmet.name} (${helmet.defence} DEF)\`` : "None equipped!"}\n` +
                    `${chestplate ? `${chestplate.icon}  \`${chestplate.name} (${chestplate.defence} DEF)\`` : "None equipped!"}\n` +
                    `${greaves ? `${greaves.icon}  \`${greaves.name} (${greaves.defence} DEF)\`` : "None equipped!"}`
                }
            )
        )
    });
}

module.exports = { 
	unmuted, levelup, awardedItem, achievement, secretAchievement, rankPage, inventoryPage, petPage, 
	achievementPage, achievementCycle, recipeCycle, petPouchPage, tradePages, tradeButtons, fishingPage,
    dungeonsPage
};
