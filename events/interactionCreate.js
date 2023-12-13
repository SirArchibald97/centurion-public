const { EmbedBuilder, Events } = require('discord.js');
const { logInteraction } = require('../utils/log');
const { takeCents, checkForAchievement, addAchievement, getUser, isLockdownEnabled } = require('../utils/db');
const { achievement } = require('../utils/embeds');

module.exports = async (client, interaction) => {
	if (interaction.isCommand() || interaction.isContextMenuCommand()) {
		const command = client.commands.get(interaction.commandName);
		if (!command) return;

		try {
			if (await isLockdownEnabled(client.conn)) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription("🔒 Server lockdown is enabled! Please try again later.").setColor("Red")], ephemeral: true });
			await command.execute(client, interaction);
			if (!client.config.logBlacklist.includes(interaction.channel.id) && !client.config.isBeta) await logInteraction(client, interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({
				embeds: [new EmbedBuilder().setDescription(':x: Something went wrong doing that! If this issue persists, please contact a server administrator.',).setColor('Red')],
                ephemeral: true,
			});
		}

    /* HANDLE BUTTONS */
	} else if (interaction.isButton()) {
		if (!client.config.logBlacklist.includes(interaction.channel.id) && !client.config.isBeta) await logInteraction(client, interaction);

        const buttonBlacklist = ["1", "2", "3"];
        if (interaction.customId.endsWith("confirm") || interaction.customId.endsWith("cancel") || buttonBlacklist.includes(interaction.customId)) return;
        if (interaction.customId.startsWith("c-")) return;
        if (interaction.customId.startsWith("d-")) return;
        const buttonName = interaction.customId.split(".")[0];
        const buttonHandler = client.buttons.get(buttonName);
        return await buttonHandler(client, interaction);

	} else if (interaction.isStringSelectMenu()) {
		if (!client.config.logBlacklist.includes(interaction.channel.id) && !client.config.isBeta) await logInteraction(client, interaction);

		/* cent shop */
		if (interaction.channel.id === "918984810100314163") {
			if (interaction.customId === 'colours') {
                const player = (await getUser(client.conn, interaction.member.id))[0];

				const prices = { s: 10000, p: 25000 };
				const colourRoles = [
					{ name: 'Brown', id: '934634055163600926', type: 's' },
					{ name: 'Lime', id: '934624353792950322', type: 's' },
					{ name: 'Blue', id: '934624373556523019', type: 's' },
					{ name: 'Cyan', id: '934624376479948822', type: 's' },
					{ name: 'Pink', id: '934624358956159077', type: 's' },
					{ name: 'Orange', id: '943190629016543232', type: 's' },

					{ name: 'Black', id: '934624365570555944', type: 'p' },
					{ name: 'Dark Grey', id: '934633408724889640', type: 'p' },
					{ name: 'Gold', id: '934634371766448198', type: 'p' },
					{ name: 'Silver', id: '934624368238161931', type: 'p' },
					{ name: 'Bronze', id: '934624371128025158', type: 'p' },
					{ name: 'White', id: '934624362303217675', type: 'p' },
					{ name: 'Dark Blue', id: '934635165051920384', type: 'p' },
					{ name: 'Dark Red', id: '934635316822806570', type: 'p' },
				];

				let chosenRole = colourRoles.find((role) => role.id === interaction.values[0]);

				if (chosenRole.type === 's') {
					if (player.level < 60)
						return interaction.reply({
							embeds: [new EmbedBuilder().setDescription(':x: You need Level 60 to purchase this!').setColor('Red')],
							ephemeral: true,
						});
				} else {
					if (player.level < 80)
						return interaction.reply({
							embeds: [new EmbedBuilder().setDescription(':x: You need Level 80 to purchase this!').setColor('Red')],
							ephemeral: true,
						});
				}
				if (player.cents < prices[chosenRole.type])
					return interaction.reply({
						embeds: [
							new EmbedBuilder().setDescription(':x: You do not have enough Cents to purchase this!').setColor('Red'),
						],
						ephemeral: true,
					});

				for (let role of colourRoles) {
					if (interaction.member.roles.cache.has(role.id)) {
						await interaction.member.roles.remove(role.id);
					}
				}
				await interaction.member.roles.add(chosenRole.id);
				await interaction.reply({ content: `Successfully purchased the <@&${chosenRole.id}> role!`, ephemeral: true });
				await takeCents(client.conn, interaction.member.id, prices[chosenRole.type]);

				
				const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "colour_role");
				if (!hasCompleted) {
					await addAchievement(client, interaction.member.id, "colour_role");
					await interaction.followUp({ content: `<@${interaction.member.id}>`, embeds: [await achievement(client.achievements.get("colour_role"))], ephemeral: true });
                }
                
				
			}
		}
		
	} else if (interaction.isAutocomplete()) {
		const commandName = interaction.commandName;
		const currentOption = interaction.options.getFocused(true);

		switch (commandName) {
			case 'give':
				if (currentOption.name === 'item') {
					const centInformation = [
						{ name: 'Cents (Purse)', value: 'purse_cents' },
						{ name: 'Cents (Bank)', value: 'bank_cents' },
					];

					const possibleItems = [
						...client.items
							.filter((item) => item.name.toLowerCase().includes(currentOption.value.toLowerCase()))
							.map((item) => {
								return { name: item.name, value: item.id };
							}),
						...centInformation.filter((information) =>
							information.name.toLowerCase().includes(currentOption.value.toLowerCase()),
						),
					];

					if (possibleItems.length > 25) return;

					interaction.respond(possibleItems);
				}
				break;

			default:
				break;
		}
	}
};

module.exports.type = Events.InteractionCreate;