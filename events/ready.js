const fs = require('fs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, Events } = require('discord.js');
const { DateTime } = require('luxon');
const { startup, log } = require("../utils/log");
const { getHappyHours, removeHappyHour, executeSQL, rotateShop, checkForAchievement, addAchievement, trackAchievement, incrementTrackedAchievement, getTrackedAchievement } = require("../utils/db");
const { secretAchievement, achievement } = require('../utils/embeds');
const { increaseAchievementLevel } = require('../utils/levels');

module.exports = async (client) => {
	startup(`Client connected! [${client.user.tag}]`);

	const deploy = require(__dirname + "/../deploy.js");
	await deploy(client);


    /* BUTTONS */
    client.buttons = new Collection();
    let buttonFiles = fs.readdirSync(__dirname + "/../buttons");
    for (let file of buttonFiles) {
        const button = require(__dirname + `/../buttons/${file}`);
        const buttonName = file.split(".")[0];
        client.buttons.set(buttonName, button);
    }


	/* ACHIEVEMENTS */
	client.achievements = new Collection();
	const achievementDirs = fs.readdirSync(__dirname + "/../achievements");
	for (let dir of achievementDirs) {
        const achievementFiles = fs.readdirSync(__dirname + "/../achievements/" + dir);
        for (let file of achievementFiles) {
            const achievement = require(__dirname + "/../achievements/" + dir + "/" + file);
            client.achievements.set(achievement.id, achievement);
        }
	}


    /* DUNGEONS */
    client.dungeons = {};
    client.dungeons.enemies = new Collection(), client.dungeons.bosses = new Collection(), client.dungeons.areas = new Collection(),
    client.dungeons.gear = new Collection(), client.dungeons.chests = new Collection();
    
    const dungeonDirs = fs.readdirSync(__dirname + "/../dungeons");
    for (const dir of dungeonDirs) {
        // ENEMIES
        const enemies = fs.readdirSync(__dirname + "/../dungeons/enemies");
        for (const enemy of enemies) {
            const enemyFile = require(__dirname + "/../dungeons/enemies/" + enemy);
            client.dungeons.enemies.set(enemyFile.id, enemyFile);
        }

        // BOSSES
        const bosses = fs.readdirSync(__dirname + "/../dungeons/bosses");
        for (const boss of bosses) {
            const bossFile = require(__dirname + "/../dungeons/bosses/" + boss);
            client.dungeons.bosses.set(bossFile.id, bossFile);
        }

        // AREAS
        const areas = fs.readdirSync(__dirname + "/../dungeons/areas");
        for (const area of areas) {
            const areaFile = require(__dirname + "/../dungeons/areas/" + area);
            client.dungeons.areas.set(areaFile.id, areaFile);
        }

        // GEAR
        const gear = fs.readdirSync(__dirname + "/../dungeons/gear");
        for (const gearDir of gear) {
            const innderDir = fs.readdirSync(__dirname + "/../dungeons/gear/" + gearDir);
            for (const file of innderDir) {
                const gearFile = require(__dirname + "/../dungeons/gear/" + gearDir + "/" + file);
                client.dungeons.gear.set(gearFile.id, gearFile);
            }
        }

        // CHESTS
        const chests = fs.readdirSync(__dirname + "/../dungeons/chests");
        for (const chest of chests) {
            const chestFile = require(__dirname + "/../dungeons/chests/" + chest);
            client.dungeons.chests.set(chestFile.id, chestFile);
        }
    }



	/* ANTISPAM */
	client.talking = new Map();


    /* USING ITEMS */
    client.playersUsingItems = [];


	/* HAPPY HOURS */
	setInterval(async () => {
		const happyhours = await getHappyHours(client.conn);
		for (let happyhour of happyhours) {
			let now = Date.now();
			let channel = await client.guilds.cache.first().channels.fetch(client.config.generalChannel);
			if (now >= Number(happyhour.time) + 60 * 60 * 1000) {
                log(`Deleting happy hour: [${happyhour.id}] x${happyhour.multiplier}`);
				await removeHappyHour(client.conn, happyhour.id);
				await channel.send({ embeds: [new EmbedBuilder().setDescription(`🎉 **${happyhour.multiplier}x** happy hour ending!`).setColor('Green')] });

			} else if (now >= Number(happyhour.time) && now < Number(happyhour.time) + 60000) {
                log(`Starting happy hour: [${happyhour.id}] x${happyhour.multiplier}`);
				await channel.send({ content: `<@&932609070324662312>`, embeds: [new EmbedBuilder().setDescription(`🎉 **${happyhour.multiplier}x** happy hour starting now!`).setColor('Green')] });

				const okPacket = await executeSQL(client.conn,
					`UPDATE boosts SET pausedUntil = '${DateTime.now().plus({ hours: 1 }).toSQL({
						includeOffset: false,
					})}', length = length + 60 WHERE type = '${client.config.boostersPausedDuringHappyHour.join(
						"' OR type = '",
					)}'`,
				);

				if (okPacket.changedRows > 0) {
					await channel.send({ embeds: [new EmbedBuilder().setDescription(`:pause_button: The active community boosters have been paused till the end of the happy hour.`,).setColor('Blurple')] });
				}
			}
		}
	}, 60 * 1000);


	/* SHOP RESET */
	setInterval(async () => {
		const now = new Date();
		if (now.getHours() === 0 && now.getMinutes() === 0 && now.getDay() === 1) {
			let tier1 = client.items.filter((i) => i.rarity === 'Common' && !i.unfindable);
			let tier2 = client.items.filter((i) => (i.rarity === 'Uncommon' || i.rarity === 'Rare') && !i.unfindable);
			let tier3 = client.items.filter((i) => (i.rarity === 'Epic' || i.rarity === 'Legendary') && !i.unfindable);
			let tier1item = tier1.at(Math.floor(Math.random() * tier1.size));
			let tier2item = tier2.at(Math.floor(Math.random() * tier2.size));
			let tier3item = tier3.at(Math.floor(Math.random() * tier3.size));
			await rotateShop(client.conn, tier1item.id, tier2item.id, tier3item.id);
		}
	}, 60 * 1000);


	/* SUGGESTIONS */
	client.suggestions = new Collection();


	/* VOID MINUTES */
	setInterval(async () => {
		const voidChannel = await client.guilds.cache.first().channels.cache.get("919331053607485502");
        if (!voidChannel) return;
		for (let [id, member] of voidChannel.members.entries()) {
            const voidMinutes = await getTrackedAchievement(client.conn, id, "void_minutes");

            if (voidMinutes) {
                await incrementTrackedAchievement(client.conn, id, "void_minutes");

                if (voidMinutes.count + 1 >= 60) {
                    const hasCompleted = await checkForAchievement(client.conn, id, "hour_in_void");
                    if (!hasCompleted) {
                        await addAchievement(client, id, "hour_in_void");
                        await increaseAchievementLevel(client, member);
                        await member.guild.channels.cache.get("918967225774391359").send({ content: `<@${id}>`, embeds: [await achievement(client.achievements.get("hour_in_void"))] });
                    }
                }

                if (voidMinutes.count + 1 >= (25 * 60)) {
                    const hasCompleted = await checkForAchievement(client.conn, id, "25_hours_in_void");
                    if (!hasCompleted) {
                        await addAchievement(client, id, "25_hours_in_void");
                        await increaseAchievementLevel(client, member);
                        await member.guild.channels.cache.get("918967225774391359").send({ content: `<@${id}>`, embeds: [await secretAchievement(client.achievements.get("25_hours_in_void"))] });
                    }
                }

            } else {
                await trackAchievement(client.conn, id, "void_minutes");
            }
		}
	}, 60000);


    /* PLAYERS USING ITEMS */
    setInterval(() => {
        client.playersUsingItems = [];
    }, 1000 * 60 * 5);


    /* BACKGROUND IMAGES */
    client.backgroundImages = [];
    const backgrounds = fs.readdirSync('./assets/backgrounds_bw/');
    for (const background of backgrounds) {
        client.backgroundImages.push(`./assets/backgrounds_bw/${background}`);
    }


	/* REACTION ROLES */
	/*
    let pingembed = new EmbedBuilder().setTitle("Notification Roles").setColor("Blurple")
        .setDescription("📺 YouTube Uploads\n📣 Announcement Pings\n📋 Poll Pings\n🎁 Giveaway Pings\n❓ Question of the Week\n🥂 Happy Hour Pings\n🤖 Nerd Pings\n🎉 Stream Parties\n🏠 Housing Pings")

    let pingrow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("role-button.yt").setEmoji("📺").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("role-button.announcement").setEmoji("📣").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("role-button.poll").setEmoji("📋").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("role-button.giveaway").setEmoji("🎁").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("role-button.qotw").setEmoji("❓").setStyle(ButtonStyle.Primary),
    )
    let pingrow2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("role-button.happyhour").setEmoji("🥂").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("role-button.nerds").setEmoji("🤖").setStyle(ButtonStyle.Primary),
		new ButtonBuilder().setCustomId("role-button.streamparty").setEmoji("🎉").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("role-button.housing").setEmoji("🏠").setStyle(ButtonStyle.Primary),
    )

    let pronounembed = new EmbedBuilder().setTitle("Pronoun Roles").setColor("Blurple")
        .setDescription("🙋‍♀️ She/Her\n🙋‍♂️ He/Him\n🙋 They/Them\n💜 Other/Please Ask")

    let pronounrow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("role-button.sheher").setEmoji("🙋‍♀️").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("role-button.hehim").setEmoji("🙋‍♂️").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("role-button.theythem").setEmoji("🙋").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("role-button.other").setEmoji("💜").setStyle(ButtonStyle.Primary)
    ) 

    client.guilds.cache.first().channels.cache.get("918984810100314163").send({ components: [pingrow, pingrow2], embeds: [pingembed] });
    client.guilds.cache.first().channels.cache.get("918984810100314163").send({ components: [pronounrow], embeds: [pronounembed] });
	*/

	/* RULES */
	/*
    let rules = new EmbedBuilder().setTitle("Server Rules").setDescription(
    `**This is not a Hypixel support server**
    > This Discord is not a substitute for the \`/report\` command in-game or filing ban appeals, and may not be used as a means to contact a staff member. If you have any queries for Hypixel staff members, please use the official channels on the [Hypixel Forums.](https://hypixel.net/forums)

    **Do not ping or harass Centranos or other Hypixel staff**
    > Centranos and the other staff members are busy people and would rather not be pinged for meaningless reasons. If you have any queries, please direct them through the official channels.

    **Zero tolerance for harassment**
    > We have a zero tolerance policy towards any harassment of our members, breaking this rule will result in an immediate and permanent ban.

    **No inappropriate content**
    > This primarily points to NSFW and malicious content however also includes spamming, advertising and any other content which breaks any rules imposed by related platforms.

    **No public shaming/witch hunting**
    > This Discord is not to be used for any sort of organised harassment against any individual, and doing so will entail serious punishments for those involved.

    **Users must be over the age of 13**
    > Due to Discord's Terms of Service and [COPPA](https://www.ftc.gov/enforcement/rules/rulemaking-regulatory-reform-proceedings/childrens-online-privacy-protection-rule) we must require all users to be over the age of 13, any admissions to being underage will result in an immediate removal from the server. **This includes jokes!**

    **Avoid joke suggestions in suggestion channels**
    > These channels are used to collect feedback from the community and so we would like to keep these channels as clean as possible. Repeatedly spamming these channels will result in a server-wide mute.

    The server rules also include all policies imposed by related platforms, links to which can be found below:
    ・ [Hypixel Network rules](https://hypixel.net/rules)
    ・ Discord's [Terms of Service](https://discord.com/terms) or [Community Guidelines](https://discord.com/guidelines)
    ・ [Mojang's EULA](https://account.mojang.com/documents/minecraft_eula)

    This list is **not exhaustive** and anyone caught not following the spirit of the rules will also be punished!
    `).setColor("Blurple");

    let message = await client.guilds.cache.first().channels.cache.get("918969718826733588").messages.fetch("925903431242248202");
    await message.edit({ embeds: [rules] });
	*/

	/* EMOJI WORKSHOP */
	/*
    let emojiWorkshop = await client.guilds.cache.first().channels.fetch("921493885736341615");
    let emojiEmbed = new EmbedBuilder().setTitle("🔨 Welcome to the Emoji Workshop!").setDescription("Here you can suggest **one emoji or sticker** to add to the server! Please make the emoji appropriate, we reserve the right to veto any suggestion.").setColor("Green")
    await emojiWorkshop.send({ embeds: [emojiEmbed] });
    */

	/* COLOUR ROLES */
	/*
    let colourRoles = {
        "Brown": "934634055163600926",
        "Lime": "934624353792950322",
        "Blue": "934624373556523019",
        "Cyan": "934624376479948822",
        "Pink": "934624358956159077",
        "Orange": "943190629016543232",
        "Black": "934624365570555944",
        "Dark Grey": "934633408724889640",
        "Gold": "934634371766448198",
        "Silver": "934624368238161931",
        "Bronze": "934624371128025158",
        "White": "934624362303217675",
        "Dark Blue": "934635165051920384",
        "Dark Red": "934635316822806570",
    }

	const { StringSelectMenuBuilder } = require("discord.js");
    let coloursMenu = new StringSelectMenuBuilder().setCustomId("colours");
    for (let [colour, role] of Object.entries(colourRoles)) {
        coloursMenu.addOptions([{ label: colour, value: role }]);
    }

    let colours = new EmbedBuilder()
        .setTitle("Colour Roles")
        .setDescription("Purchase a coloured role to change the colour of your name in the server! You can only have one role at any give time, buying a colour role will remove any current colour role you have without a refund.")
        .addFields(
            { name: "Standard Colours - ¢10,000 Each", value: "> <@&934634055163600926>\n> <@&934624353792950322>\n> <@&934624373556523019>\n> <@&934624376479948822>\n> <@&934624358956159077>\n> <@&943190629016543232>" },
            { name: "Premium Colours - ¢25,000 Each", value: "> <@&934624365570555944>\n> <@&934633408724889640>\n> <@&934634371766448198>\n> <@&934624368238161931>\n> <@&934624371128025158>\n> <@&934624362303217675>\n> <@&934635165051920384>\n> <@&934635316822806570>" })
        .setColor("Blurple")
    
    await client.guilds.cache.first().channels.cache.get("918984810100314163").send({ embeds: [colours], components: [new ActionRowBuilder().addComponents(coloursMenu), new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("remove-colour").setLabel("Remove").setStyle(ButtonStyle.Danger))] });
	*/
};

module.exports.type = Events.ClientReady;