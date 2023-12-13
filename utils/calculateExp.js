const { getAllBoosts, getHappyHours, removeBoost, isUsingPlutus, giveCents, checkForAchievement, addAchievement } = require("../utils/db");
const { achievement } = require("../utils/embeds");
const { log } = require("../utils/log");
const { increaseAchievementLevel, increaseTrophyLevel } = require("../utils/levels");
const { DateTime } = require('luxon');
const goldFishPet = require("../items/legendary/goldfish_pet");


module.exports = async (client, message) => {
    return new Promise(async (resolve, reject) => {
        const activeBoosts = await getAllBoosts(client.conn);

        const isBoosting = message.member.roles.cache.has(client.config.boosterRole);
        const baseExp = Math.floor(Math.random() * 5 + (isBoosting ? 2 : 1));

        // Set base factors which we will later adjust to make them work.
        let expFactors = {
            happyHour: { amount: 1, type: 'multiply', },
            communalBoost: { amount: 1, type: 'multiply', },
            personalBoost: { amount: 0, type: 'sum', },
            goldFish: { amount: 1, type: 'multiply', },
            sovereignSponge: { apply: false, users: [], },

            gainCentsNotExperience: false,
            happyHourActive: false,
        };

        let activeHappyHours = await getHappyHours(client.conn);
        for (const happyHour of activeHappyHours) {
            const now = Date.now();
            if (now >= happyHour.time && now <= happyHour.time + 1000 * 60 * 60) {
                expFactors.happyHourActive = true;
                expFactors.happyHour.amount = happyHour.multiplier;

                
                const hasCompleted = await checkForAchievement(client.conn, message.member.id, "happy_hour_message");
                if (!hasCompleted) {
                    await addAchievement(client, message.member.id, "happy_hour_message");
                    await message.reply({ embeds: [await achievement(client.achievements.get("happy_hour_message"))] });
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
        }

        let spongeBoosts = activeBoosts.filter((row) => row.type === 'sovereign_sponge');
        for (let boost of spongeBoosts) {
            if (Number(boost.timestamp) + Number(boost.length * 60 * 1000) <= Date.now()) {
                await removeBoost(client.conn, boost.user);
            } else {
                if (message.member.id !== boost.user && !(DateTime.fromSQL(boost.pausedUntil).toMillis() < DateTime.now().toMillis())) {
                    expFactors.sovereignSponge.apply = true;
                    expFactors.sovereignSponge.users.push(boost.user);
                }
            }
        }

        const personalBoosts = activeBoosts.filter((row) => row.user === message.member.id && row.type !== 'communal_aura');
        if (personalBoosts.length > 0) {
            if (Number(personalBoosts[0].timestamp) + Number(personalBoosts[0].length * 60 * 1000) <= Date.now()) {
                await removeBoost(client.conn, personalBoosts[0].user)
            } else {
                if (personalBoosts[0].type.endsWith('_exp_boost') && !(DateTime.fromSQL(personalBoosts[0].pausedUntil).toMillis() < DateTime.now().toMillis())) {
                    expFactors.personalBoost.amount = personalBoosts[0].extra;

                } else if (personalBoosts[0].type === 'golden_vac' && !(DateTime.fromSQL(personalBoosts[0].pausedUntil).toMillis() < DateTime.now().toMillis())) {
                    expFactors.gainCentsNotExperience = true;

                } else if (personalBoosts[0].type === 'message_mirror' && !(DateTime.fromSQL(personalBoosts[0].pausedUntil).toMillis() < DateTime.now().toMillis())) {
                    const mirrorSeed = Math.floor(Math.random() * 10 + 1);
                    const mirrorChance = Math.floor(Math.random() * 10 + 1);

                    if (mirrorChance === mirrorSeed || message.member.id === "882647074896748625") {
                        expFactors.personalBoost = { amount: 2, type: 'multiply', };
                        await message.react('🪞'); // Mirror emoji

                        
                        const hasCompleted = await checkForAchievement(client.conn, message.member.id, "use_parrot");
                        if (!hasCompleted) {
                            await addAchievement(client, message.member.id, "use_parrot");
                            await message.reply({ embeds: [await achievement(client.achievements.get("use_parrot"))] });
                            const levelupEmbed = await increaseAchievementLevel(client, message.member);
                            if (levelupEmbed) {
                                await message.followUp({ embeds: [levelupEmbed] });
                            }
                            const trophyLevelUp = await increaseTrophyLevel(client, message.member);
                            if (trophyLevelUp) {
                                await message.reply({ embeds: [trophyLevelUp] });
                            }
                        }
                        
                        
                    }
                }
            }
        }

        let communalBoosts = activeBoosts.filter((row) => row.type === 'communal_aura');
        for (let boost of communalBoosts) {
            if (Number(boost.timestamp) + Number(boost.length * 60 * 1000) <= Date.now()) {
                await removeBoost(client.conn, boost.user);
            }
        }
        if (communalBoosts.length > 0 && communalBoosts.some((element) => !(DateTime.fromSQL(element.pausedUntil).toMillis() < DateTime.now().toMillis()))) {
            expFactors.communalBoost.amount = 2;
        }

        // Goldfish Splash 🐠
        const applySplash = await goldFishPet.onMessage(client, message);
        if (applySplash) expFactors.goldFish.amount = 4;

        // Apply all additives and factors.
        let appliedExp = baseExp;
        for (i = 0; i < client.config.experienceOrder.length; i++) {
            currentOrder = client.config.experienceOrder[i];
            currentFactor = expFactors[currentOrder];

            const before = appliedExp;

            if (currentOrder === 'personalBoost' && expFactors.gainCentsNotExperience) {
                const plutusActive = await isUsingPlutus(client.conn, message.member.id);
                await giveCents(client.conn, message.member.id, appliedExp * (plutusActive ? 1.5 : 1));
            }

            if (currentOrder === 'communalBoost' && expFactors.happyHourActive) {
                currentFactor.amount = 1;
            }

            if (currentOrder === 'sovereignSponge' && expFactors.sovereignSponge.apply) {
                const plutusActive = await isUsingPlutus(client.conn, message.member.id);
                for (const user of expFactors.sovereignSponge.users) {
                    await giveCents(client.conn, user, appliedExp * (plutusActive ? 1.5 : 1));
                }
            }

            switch (currentFactor.type) {
                case 'multiply':
                    appliedExp *= currentFactor.amount;
                    break;
                case 'sum':
                    appliedExp += currentFactor.amount;
                    break;
                default:
                    break;
            }
        }

        log(` > EXP: ${appliedExp} (base: ${baseExp})`);
        resolve(expFactors.gainCentsNotExperience ? 0 : appliedExp);
    });
}