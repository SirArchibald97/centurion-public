const { getUser, giveCents, createUser, addExp, getPets, checkForAchievement, addAchievement, getAchievements, getTrackedAchievement, incrementTrackedAchievement, trackAchievement, getTrophyPetCents, addTrophyPetCents, createTrophyPetCents } = require('../utils/db');
const { increaseLevel, increaseAchievementLevel, increaseTrophyLevel } = require('../utils/levels');
const { achievement, secretAchievement } = require('../utils/embeds');
const calculateExp = require('../utils/calculateExp');
const calculateItem = require('../utils/calculateItem');
const { log } = require('../utils/log');
const { Events } = require('discord.js');

module.exports = async (client, message) => {
	if (message.author.bot) return;
    if (!message.guild) return;

    log(`New message from ${message.member.user.tag} in #${message.channel.name}`);
	if (message.channel.id === '931149108952051712' || message.channel.id === "925777720674222080") return;

    if (message.member.roles.cache.has(client.config.memberRole)) {
        const memberData = await getUser(client.conn, message.member.id);
        if (memberData.length === 0) {
            await createUser(client.conn, message.member.id, 0);
        }
    }
	
	if (message.mentions.users.has("921085010369454111")) {
		const hasCompleted = await checkForAchievement(client.conn, message.member.id, "ping_centinel");
		if (!hasCompleted) {
            const pingCentinel = client.achievements.get("ping_centinel");
			await message.reply({ embeds: [await secretAchievement(pingCentinel)], ephemeral: true });
			await addAchievement(client, message.member.id, "ping_centinel");
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

	if (message.content.toLowerCase().includes("whats gm")) {
		const hasCompleted = await checkForAchievement(client.conn, message.member.id, "say_whats_gm");
		if (!hasCompleted) {
			await addAchievement(client, message.member.id, "say_whats_gm");
			await message.reply({ embeds: [await secretAchievement(client.achievements.get("say_whats_gm"))] });
            const levelupEmbed = await increaseAchievementLevel(client, message.member, allAchievements);
            if (levelupEmbed) {
                await message.reply({ embeds: [levelupEmbed] });
            }
            const trophyLevelUp = await increaseTrophyLevel(client, message.member);
            if (trophyLevelUp) {
                await message.reply({ embeds: [trophyLevelUp] });
            }
		}
	}

	/* EXP */
	if (client.config.xpBlacklist.includes(message.channel.id)) return;
	if (client.talking.get(message.member.id)) {
        if (client.talking.get(message.member.id) + (1000 * 60) > Date.now()) return;
        else client.talking.delete(message.member.id);
    }

	const user = await getUser(client.conn, message.member.id);
    const finalExp = await calculateExp(client, message);
	if (user.length === 0) {
		await createUser(client.conn, message.member.id, finalExp);
	} else {
		await increaseLevel(client, message, user[0].xp, user[0].level, finalExp);
		await addExp(client.conn, message.member.id, finalExp);
	}
	client.talking.set(message.member.id, Date.now());

    /* PETS */
    const pets = await getPets(client.conn, message.member.id);
    if (pets.find(pet => pet.type === "phoenix_pet")) {
        const chanceForPhoenix = Math.floor((Math.random() * 30) + 1);
        if (chanceForPhoenix === 1) {
            await giveCents(client.conn, message.member.id, finalExp);
            await message.react("🐦");
        }
    }

    if (pets.filter(pet => pet.type.endsWith("_trophy_pet")).length > 0) {
        const chanceForCents = Math.floor((Math.random() * 100) + 1);

        //const chanceForCents = 1;
        if (chanceForCents === 1) {
            const trophyPetChances = {
                "common_trophy_pet": { amounts: [1, 50], limit: 500 },
                "uncommon_trophy_pet": { amounts: [10, 75], limit: 750 },
                "rare_trophy_pet": { amounts: [25, 100], limit: 1000 },
                "epic_trophy_pet": { amounts: [50, 150], limit: 2000 },
                "legendary_trophy_pet": { amounts: [100, 200], limit: 3000 },
            }
        
            const trophyPetType = trophyPetChances[pets.find(pet => pet.type.endsWith("_trophy_pet")).type];
            const centAmount = Math.floor(Math.random() * (trophyPetType.amounts[1] - trophyPetType.amounts[0] + 1) + trophyPetType.amounts[0]);

            const trophyPetCents = (await getTrophyPetCents(client.conn, message.member.id))[0];
            if (!trophyPetCents) {
                await createTrophyPetCents(client.conn, message.member.id, centAmount);
            } else {
                if (trophyPetCents.amount + centAmount <= trophyPetType.limit) {
                    await addTrophyPetCents(client.conn, message.member.id, centAmount);
                } else {
                    await addTrophyPetCents(client.conn, message.member.id, trophyPetType.limit - trophyPetCents.amount);
                }
            }

            await message.react('🏆');
        }
    }


    /* ITEMS */
    await calculateItem(client, message);
    
    

	/*  MESSAGE ACHIEVEMENTS */
    const allAchievements = await getAchievements(client.conn, message.member.id);
	
	if (message.channel.id === "921481261254598737") {
        const vipMessages = await getTrackedAchievement(client.conn, message.member.id, "vip_messages");
        if (vipMessages) {
            await incrementTrackedAchievement(client.conn, message.member.id, "vip_messages");
            if (vipMessages + 1 >= 50) {
                await message.reply({ embeds: [await secretAchievement(client.achievements.get("messages_in_vip"))] });
                await addAchievement(client, message.member.id, "messages_in_vip");
                const levelupEmbed = await increaseAchievementLevel(client, message.member, allAchievements);
                if (levelupEmbed) {
                    await message.reply({ embeds: [levelupEmbed] });
                }
                const trophyLevelUp = await increaseTrophyLevel(client, message.member);
                if (trophyLevelUp) {
                    await message.reply({ embeds: [trophyLevelUp] });
                }
            }
        } else {
            await trackAchievement(client.conn, message.member.id, "vip_messages");
        }
	}
	
	
	if (message.channel.id === "955870390423539732") {
        const hasCompleted = await checkForAchievement(client.conn, message.member.id, "messages_in_nerds");
        if (!hasCompleted) {
            const nerdMessages = await getTrackedAchievement(client.conn, message.member.id, "nerd_messages");
            if (nerdMessages) {
                await incrementTrackedAchievement(client.conn, message.member.id, "nerd_messages");
                if (nerdMessages.count + 1 >= 250) {
                    await message.reply({ embeds: [await secretAchievement(client.achievements.get("messages_in_nerds"))] });
                    await addAchievement(client, message.member.id, "messages_in_nerds");
                    const levelupEmbed = await increaseAchievementLevel(client, message.member, allAchievements);
                    if (levelupEmbed) {
                        await message.reply({ embeds: [levelupEmbed] });
                    }
                    const trophyLevelUp = await increaseTrophyLevel(client, message.member);
                    if (trophyLevelUp) {
                        //await message.reply({ embeds: [trophyLevelUp] });
                    }
                }
            } else {
                await trackAchievement(client.conn, message.member.id, "nerd_messages");
            }
        }
	}
	

    if (Date.now() >= (message.member.joinedTimestamp + (1000 * 60 * 60 * 24 * 90))) {
		const hasCompleted = await checkForAchievement(client.conn, message.member.id, "3_months");
		if (!hasCompleted) {
			await addAchievement(client, message.member.id, "3_months");
			await message.reply({ embeds: [await achievement(client.achievements.get("3_months"))] });
            const levelupEmbed = await increaseAchievementLevel(client, message.member, allAchievements);
            if (levelupEmbed) {
                await message.reply({ embeds: [levelupEmbed] });
            }
            const trophyLevelUp = await increaseTrophyLevel(client, message.member);
            if (trophyLevelUp) {
                await message.reply({ embeds: [trophyLevelUp] });
            }
		}
	}
    
	    
	if (message.channel.id === "952287653708070982") {
		const hasCompleted = await checkForAchievement(client.conn, message.member.id, "flex");
		if (!hasCompleted) {
			await addAchievement(client, message.member.id, "flex");
			await message.reply({ embeds: [await achievement(client.achievements.get("flex"))] });
            const levelupEmbed = await increaseAchievementLevel(client, message.member, allAchievements);
            if (levelupEmbed) {
                await message.reply({ embeds: [levelupEmbed] });
            }
            const trophyLevelUp = await increaseTrophyLevel(client, message.member);
            if (trophyLevelUp) {
                await message.reply({ embeds: [trophyLevelUp] });
            }
		}
	}
};

module.exports.type = Events.MessageCreate;