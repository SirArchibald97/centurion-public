const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { ChestType } = require("./chest_type");

module.exports = async (client, dungeon, player, interaction) => {
    const weapon = client.dungeons.gear.get(player.weapon);
    const helmet = client.dungeons.gear.get(player.helmet);
    const chestplate = client.dungeons.gear.get(player.chestplate);
    const greaves = client.dungeons.gear.get(player.greaves);
    const playerDamage = weapon.damage;
    const playerDefence = helmet.defence + chestplate.defence + greaves.defence;
    let currentFloor = 0;
    let playerHealth = player.health;
    let enemy;

    const message = await interaction.update({ 
        embeds: [
            new EmbedBuilder().setTitle(`Welcome to ${dungeon.name}!`).setColor("Blurple").setTimestamp()
                .setDescription("Check your stats and gear before you continue, you will not be able to change mid-run!")
                .addFields(
                    { 
                        name: "Stats",
                        value: `\`\`\`ansi\n[0mHealth [0;30m> [1;37m${playerHealth}\n[0mHealth [0;30m> [1;37m${playerDamage}\n[0mHealth [0;30m> [1;37m${playerDefence}\`\`\``,
                        inline: true 
                    },
                    {
                        name: "Gear",
                        value: `${weapon.icon}  \`${weapon.name}\`\n${helmet.icon}  \`${helmet.name}\`\n${chestplate.icon}  \`${chestplate.name}\`\n${greaves.icon}  \`${greaves.name}\``,
                        inline: true
                    }
                )
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("d-continue").setLabel("Continue").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("d-cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger)
            )
        ],
        fetchReply: true,
    });

    const filter = (i) => i.member.id === interaction.member.id;
    const collector = message.createMessageComponentCollector({ filter: filter, time: 60_000 * 5 });
    collector.on("collect", async (int) => {
        if (int.customId === "d-continue") {
            collector.resetTimer();

            if (playerHealth === 0) {
                await collector.stop({ reason: "DIED" });
            } else if (currentFloor === dungeon.floors) {
                await collector.stop({ reason: "FINISHED" });

            } else {
                // set whether floor contains a boss or final boss
                currentFloor++;
                const isBossFloor = currentFloor % 5 === 0;
                const isFinalFloor = currentFloor === dungeon.floors;

                // create some variables for the battle
                let enemyHealth = 0;
                let enemyDamage = 0;

                // if not the final boss 
                if (!isFinalFloor) {
                    // get a random enemy from the dungeon's enemies
                    enemy = client.dungeons.enemies.get(dungeon.enemies[Math.floor(Math.random() * dungeon.enemies.length)]);
                    // set the enemies health and damage based on dungeon scaling
                    enemyHealth = dungeon.baseStats.health * (dungeon.scaling.health ** Math.ceil(currentFloor / 5));
                    enemyDamage = dungeon.baseStats.damage + (dungeon.scaling.damage ** Math.ceil(currentFloor / 5));

                    // if the floor contains a boss
                    if (isBossFloor) {
                        // scale the health and damage according to the dungeon's boss scaling
                        enemyHealth *= dungeon.bossScaling.health;
                        enemyDamage += dungeon.bossScaling.damage;
                    }
                // if its the final boss
                } else {
                    // get the final boss
                    enemy = client.dungeons.bosses.get(dungeon.boss);
                    // set its health and damage
                    enemyHealth = enemy.health;
                    enemyDamage = enemy.damage;
                }

                const { damageDealtToEnemy, damageDealthToPlayer, playerHits, enemyHits } = calculateFloorResults(playerHealth, playerDamage, playerDefence, enemyHealth, enemyDamage);
                const enemyName = isBossFloor ? enemy.bossName : enemy.name;
                playerHealth = Math.max(Math.ceil(playerHealth - damageDealthToPlayer), 0);
                enemyHealth = Math.max(Math.ceil(enemyHealth - damageDealtToEnemy), 0);

                await int.update({
                    embeds: [
                        new EmbedBuilder().setTitle(`${dungeon.name}・Floor ${currentFloor}${isBossFloor ? " (BOSS)" : ""}`).setColor("Blurple").setTimestamp().setFooter({ text: "Press Continue to move to the next floor" })
                            .setDescription(`A${isVowel(enemyName[0]) ? "n" : ""} \`${enemyName}\` has appeared${isBossFloor ? ", its a boss" : ""}! You hit it ${playerHits} time${playerHits === 1 ? "" : "s"}, and it hits you ${enemyHits} time${enemyHits === 1 ? "" : "s"}!`)
                            .addFields(
                                {
                                    name: "You",
                                    value: 
                                        `\`\`\`ansi\n` + 
                                        `${playerHealth === 0 ? `\n[1;31mYou died!\n` : ``}` +
                                        `[0mHealth [0;30m> [1;37m${playerHealth + damageDealthToPlayer} HP [0m-> [1;37m${playerHealth} HP\n` +
                                        `[0mDamage Dealt [0;30m> [1;37m${damageDealtToEnemy} DMG\n` +
                                        `\`\`\``,
                                    inline: true
                                },
                                {
                                    name: "Enemy",
                                    value: 
                                        `\`\`\`ansi\n` + 
                                        `${enemyHealth === 0 ? `\n[1;31mEnemy killed!\n` : ``}` +
                                        `[0mHealth [0;30m> [1;37m${enemyHealth + damageDealtToEnemy} HP [0m-> [1;37m${enemyHealth} HP\n` +
                                        `[0mDamage Dealt [0;30m> [1;37m${damageDealthToPlayer} DMG\n` +
                                        `\`\`\``,
                                    inline: true
                                }
                            )
                    ],
                    components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId("d-continue").setLabel("Continue").setStyle(ButtonStyle.Success),
                    )],
                });
            }

        } else if (int.customId === "d-cancel") {
            collector.stop({ reason: "CANCELLED" });
        }
    });

    collector.on("end", async (collected, reason) => {
        reason = reason.reason;
        if (reason === "CANCELLED") {
            await collected.last().message.edit({ embeds: [
                new EmbedBuilder().setDescription("You have cancelled the dungeon!").setColor("Red")
            ], components: [] });
        } else if (reason === "FINISHED") {
            await collected.last().message.edit({ embeds: [
                new EmbedBuilder().setDescription("You have completed the dungeon!").setColor("Green")
            ], components: [] });
        } else {
            const isBossFloor = currentFloor % 5 === 0;
            const enemyName = isBossFloor ? enemy.bossName : enemy.name;
            const { totalCents, totalExp, chestEarned } = calculateDungeonRewards(currentFloor - 1, dungeon.centRange, dungeon.expRange);
            const chest = chestEarned ? client.dungeons.chests.get(chestEarned) : null;

            await collected.last().message.edit({ embeds: [
                new EmbedBuilder().setTitle(`You have died in ${dungeon.name}!`).setColor("Red").setTimestamp()
                    .setDescription(`You were killed by a${isVowel(enemyName[0]) ? "n" : ""} \`${enemyName}\` on floor ${currentFloor}. Better luck next time!`)
                    .addFields(
                        { name: "Rewards", value: `<:cent:1042902432914620497> \`${totalCents}\`\n\`${totalExp} EXP\`${chest ? `\n${chest.name}` : ""}` }
                    )
            ], components: chest ? [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`chest-${chest.id}`).setLabel("Open Chest").setStyle(ButtonStyle.Success))] : [], fetchReply: true });
        }
    });
},

calculateFloorResults = (playerHealth, playerDamage, playerDefence, enemyHealth, enemyDamage) => {
    let damageDealthToPlayer = 0;
    let damageDealtToEnemy = 0;
    let playerHits = 0;
    let enemyHits = 0;

    // while the player and enemy are still alive
    while (playerHealth >= 1 && enemyHealth >= 1) {
        // calculate the damage dealt to each
        damageDealtToEnemy += playerDamage;
        damageDealthToPlayer += (enemyDamage - playerDefence);
        playerHealth -= (enemyDamage - playerDefence);
        enemyHealth -= playerDamage;
        playerHits++;
        enemyHits++;
    }

    return { damageDealtToEnemy, damageDealthToPlayer, playerHits, enemyHits };
}

calculateDungeonRewards = (floorsCompleted, centRange, expRange) => {
    let totalCents = 0;
    let totalExp = 0;
    for (let i = 1; i <= floorsCompleted; i++) {
        const isBossFloor = i % 5 === 0;

        totalCents += Math.floor(Math.random() * (centRange.max - centRange.min + 1) + centRange.min);
        totalExp += Math.floor(Math.random() * (expRange.max - expRange.min + 1) + expRange.min);
    }

    const rewardChests = {
        0: null,
        1: ChestType.Wooden,
        2: ChestType.Iron,
        3: ChestType.Gold,
    };
    const chestEarned = rewardChests[Math.floor(floorsCompleted / 5)];

    return { totalCents, totalExp, chestEarned };
}

isVowel = (letter) => {
    return ["a", "e", "i", "o", "u"].includes(letter.toLowerCase());
}