const { EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } = require('discord.js');
const { getHappyHours, addHappyHour, removeHappyHour } = require('../../utils/db');

module.exports = {
    data: new SlashCommandBuilder().setName("happyhour").setDescription("Manage server Happy Hours")
        .addSubcommand(newHour => newHour.setName("new").setDescription("Create a new Happy Hour")
            .addIntegerOption(time => time.setName("time").setDescription("Enter time in hours").setRequired(true))
            .addNumberOption(multiplier => multiplier.setName("multiplier").setDescription("Enter a multiplier").setRequired(true))
        )
        .addSubcommand(deleteHour => deleteHour.setName("delete").setDescription("Delete a Happy Hour")
            .addIntegerOption(id => id.setName("id").setDescription("Enter an ID").setRequired(true))
        )
        .addSubcommand(list => list.setName("list").setDescription("Shows list of upcoming Happy Hours")),

	async execute(client, interaction) {
        if (!interaction.member.roles.cache.has(client.config.staffRole) && !interaction.member.roles.cache.has(client.config.directorRole) && !interaction.member.roles.cache.has(client.config.centRole))
			return interaction.reply({
				embeds: [new EmbedBuilder().setDescription(':x: You are not allowed to use this command!').setColor('Red')],
				ephemeral: true,
			});
        
		const happyhours = await getHappyHours(client.conn);
		if (interaction.options.getSubcommand() === "new") {
            const hoursAhead = interaction.options.getInteger('time');
            const multiplier = interaction.options.getNumber('multiplier');

            if (interaction.member.roles.cache.has(client.config.staffRole) && multiplier > 2) 
                return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: You can only create Happy Hours with multipliers between 1 and 2!").setColor("Red")], ephemeral: true });

            const previousHour = Date.now() - (Date.now() % 3600000);
            const nextHour = previousHour + 3600000;
            const happyHourTimestamp = nextHour + (hoursAhead * 3600000);

            await addHappyHour(client.conn, happyHourTimestamp, multiplier);

			await interaction.reply({
				embeds: [new EmbedBuilder().setDescription(`:tada: Created a new happy hour with **x${multiplier} multiplier** <t:${Math.floor(happyHourTimestamp / 1000)}:R>!`).setColor('Green')]
			});

		} else if (interaction.options.getSubcommand() === "delete") {
			const id = interaction.options.getString('id');
			const hourToDelete = happyhours.filter((hour) => hour.id === Number(id));
			
            if (hourToDelete.length === 1) {
				await removeHappyHour(client.conn, Number(id));
				await interaction.reply({
					embeds: [new EmbedBuilder().setDescription(`✅ Successfully deleted **x${hourToDelete[0].multiplier}** happy hour at <t:${Math.floor(Number(hourToDelete[0].time) / 1000)}>`).setColor('Green')],
				});
			} else {
				await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: There are no happy hours matching that ID!').setColor('Red')], ephemeral: true });
			}

		} else if (interaction.options.getSubcommand() === "list") {
			const nextHappyHours = happyhours.filter((hour) => hour.time >= Date.now());

			const listEmbed = new EmbedBuilder().setTitle('🥂 Upcoming Happy Hours').setColor('Blurple').setTimestamp();
			if (nextHappyHours.length > 0) {
				let desc = '';
				for (let hour of nextHappyHours) {
					desc += `[${hour.id}] x${hour.multiplier} <t:${Math.floor(hour.time / 1000)}:R>\n`;
				}
				listEmbed.setDescription(desc);
			} else {
				listEmbed.setDescription('No upcoming happy hours! Use `/happyhour new` to make one.');
			}

			await interaction.reply({ embeds: [listEmbed] });
		}
	},
};
