const { hasGoldfishPet, hasPhoenixPet, giveItem, getUser, addAchievement, checkForAchievement, getAchievements, getPets, takeItem, executeSQL } = require('./db');
const { levelup, awardedItem, secretAchievement } = require('./embeds');
const { EmbedBuilder } = require('discord.js');

const increaseLevel = async (client, message, currentTotalExp, currentLevel, expToAdd) => {
	return new Promise(async (resolve, reject) => {
		const ranks = { 5: '920868176034684979', 10: '920868402401251359', 20: '920868460051968030', 30: '920868508357783593', 40: '920868821286420530', 50: '920868858393403392', 60: '920868883076882473',
						70: '920868916358680599', 80: '920868545632559185', 90: '920868943516815370', 100: '920869091030487051', 150: '920868970821718036' };

        const newTotalExp = currentTotalExp + expToAdd;

        let runningLevel = 1;
        let runningTotalExp = Math.floor(100 * 1.03 ** runningLevel);
        while (newTotalExp >= runningTotalExp) {
            runningLevel++;
            if (runningLevel > 99) {
                runningTotalExp += 2000;
            } else {
                runningTotalExp += Math.floor(100 * 1.03 ** runningLevel);
            }
        }

		if (currentLevel < runningLevel) {
			try {
				await message.reply({ embeds: [await levelup(message.member.id, runningLevel)] });
				await executeSQL(client.conn, `UPDATE levels SET level = ${runningLevel} WHERE id = '${message.member.id}'`);
				
				if (currentLevel + 1 >= 69) {
					const hasCompleted = await checkForAchievement(client.conn, message.member.id, "reach_level_69");
					if (!hasCompleted) {
						await addAchievement(client, message.member.id, "reach_level_69");
						await message.reply({ embeds: [await secretAchievement(client.achievements.get("reach_level_69"))] });
                        const levelupEmbed = await increaseAchievementLevel(client, message.member);
                        if (levelupEmbed) {
                            await message.reply({ embeds: [levelupEmbed] });
                        }
                        const trophyLevelUp = await increaseTrophyLevel(client, message.member);
                        if (trophyLevelUp) {
                            await message.reply({ embeds: [trophyLevelUp] });
                        }
					}
				}
                

				if (ranks[Number(currentLevel + 1)]) {
					for (let role of Object.values(ranks)) {
						if (message.member.roles.cache.has(role)) message.member.roles.remove(role);
					}
					message.member.roles.add(ranks[Number(currentLevel + 1)]);
				}

				const hasGoldfish = Boolean((await hasGoldfishPet(client.conn, message.member.id))[0].doesExist);
				const hasPhoenix = Boolean((await hasPhoenixPet(client.conn, message.member.id))[0].doesExist);

				if (currentLevel + 1 >= 100 && !hasGoldfish) {
					await giveItem(client.conn, message.member.id, "goldfish_pet", true);
					await message.reply({ embeds: [await awardedItem(message.member.id, "Goldfish Pet", 'you reached **level 100**!')] });
				} else if (currentLevel + 1 >= 150 && !hasPhoenix) {
					await giveItem(client.conn, message.member.id, "phoenix_pet", true);
					await message.reply({ embeds: [await awardedItem(message.member.id, "Phoenix Pet", 'you reached **level 150**!')] });
				}
			} catch (e) { console.error(e); }
		}

		resolve(true);
	});
}

const getMaxInventorySlots = async (conn, client, user) => {
	return new Promise(async (resolve) => {
		const isMemberBoosting = user.roles.cache.has(client.config.boosterRole);
		const member = await getUser(conn, user.id);
        if (member.length === 0) return resolve(5);
        const memberLevel = member[0].level;
		resolve(5 + (isMemberBoosting ? 2 : 0) + (memberLevel >= 60 ? 1 : 0) + (memberLevel >= 90 ? 1 : 0) + (memberLevel >= 30 ? 1 : 0) + (memberLevel >= 150 ? 5 : 0));
	});
}

const increaseAchievementLevel = async (client, member) => {
    const achievements = await getAchievements(client.conn, member.id);

    // CURRENT MAX POINTS: 535
    const achievementLevels = [
        // achievement hunter
        { points: 20, role: '1005065035460128798' },
        { points: 40, role: '1005065539053424750' },
        { points: 60, role: '1005065816624087070' },
        { points: 80, role: '1005066124750233692' },
        { points: 100, role: '1005066313808478249' },
        // achievement novice
        { points: 130, role: '1005429827463024771' },
        { points: 160, role: '1005429824090812476' },
        { points: 190, role: '1005429819888128122' },
        { points: 210, role: '1005429816717226065' },
        { points: 240, role: '1005429814188064868' },
        // achieveent expert
        { points: 280, role: '1005428883757207672' },
        { points: 320, role: '1005428889666986054' },
        { points: 360, role: '1005428893852893254' },
        { points: 400, role: '1005428896914735145' },
        { points: 440, role: '1005428900907724800' },
        // achievement master
        { points: 490, role: '1005432376748429372' },
        { points: 540, role: '1005432371270652035' },
    ];


    let totalPoints = 0;
    for (let record of achievements) {
        const achievement = client.achievements.get(record.id);
        totalPoints += achievement.points;
    }

    let surpassedRoles = [];
    for (let level of achievementLevels) {
        if (totalPoints >= level.points) {
            surpassedRoles.push(level);
        }
    }

    if (surpassedRoles.length === 0) return null;
    
    const highestLevel = surpassedRoles[surpassedRoles.length - 1];
    if (!member.roles.cache.has(highestLevel.role)) {
        for (let level of achievementLevels) {
            if (member.roles.cache.has(level.role)) {
                await member.roles.remove(level.role);
            }
        }
        await member.roles.add(highestLevel.role);
        return new EmbedBuilder().setDescription(`🏆 Achievement milestone <@&${highestLevel.role}> reached! [\`${highestLevel.points} AP\`]`).setColor('Gold');
    }

    return null;
}

const increaseTrophyLevel = async (client, member) => {
    const pets = await getPets(client.conn, member.id);
    const currentTrophyPet = pets.find(pet => pet.type.includes('_trophy_pet'));

    let totalPoints = 0;
    for (let record of await getAchievements(client.conn, member.id)) {
        const achievement = client.achievements.get(record.id);
        totalPoints += achievement.points;
    }

    const trophyPets = [
        { points: 130, pet: "common_trophy_pet" },
        { points: 280, pet: "uncommon_trophy_pet" },
        { points: 490, pet: "rare_trophy_pet" },
    ];
    
    const surpassedPets = [];
    for (const { points, pet } of trophyPets) {
        if (totalPoints >= points) {
            surpassedPets.push(pet);
        }
    }

    if (surpassedPets.length === 0) return null;
    const highestEarnedPet = client.items.get(surpassedPets[surpassedPets.length - 1]);
    if (!currentTrophyPet) {
        await giveItem(client.conn, member.id, highestEarnedPet.id, true, 1);
        return new EmbedBuilder().setDescription(`🏆 Trophy pet upgraded to **${highestEarnedPet.name}**!`).setColor('Gold');
    } else {
        if (highestEarnedPet.id !== currentTrophyPet.type) {
            if (currentTrophyPet) await takeItem(client.conn, member.id, currentTrophyPet.type, 1);
            await giveItem(client.conn, member.id, highestEarnedPet.id, true, 1);
            return new EmbedBuilder().setDescription(`🏆 Trophy pet upgraded to **${highestEarnedPet.name}**!`).setColor('Gold');

        }
    }

    return null;
}


module.exports = { increaseLevel, getMaxInventorySlots, increaseAchievementLevel, increaseTrophyLevel };