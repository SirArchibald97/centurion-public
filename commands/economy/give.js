const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { executeSQL, giveCents, giveItem, addPetItem, getPetPouch, getUser } = require('../../utils/db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('give')
		.setDescription('Give a user an item or cents')
		.addSubcommand(item => item.setName("item").setDescription("Give a user an item")
			.addUserOption(user => user.setName("user").setDescription("Select a user to give to").setRequired(true))
			.addStringOption(itemId => itemId.setName("item").setDescription("Enter an item ID").setRequired(true))
            .addIntegerOption(quantity => quantity.setName("quantity").setDescription("Enter an amount of items").setRequired(true))
		).addSubcommand(cents => cents.setName("cents").setDescription("Give a user cents")
			.addUserOption(user => user.setName("user").setDescription("Select a user to give to").setRequired(true))
            .addIntegerOption(quantity => quantity.setName("quantity").setDescription("Enter an amount of cents").setRequired(true))
			.addStringOption(location => location.setName("location").setDescription("Select where to add the cents").setRequired(true).addChoices({ name: "Purse", value: "p" }, { name: "Bank", value: "b" }))
		).addSubcommand(exp => exp.setName("exp").setDescription("Give a user experience")
            .addUserOption(user => user.setName("user").setDescription("Select a user to give to").setRequired(true))
            .addIntegerOption(quantity => quantity.setName("quantity").setDescription("Enter an amount of experience").setRequired(true))
        ),

	async execute(client, interaction) {
		if (!interaction.member.roles.cache.has(client.config.directorRole) && !interaction.member.roles.cache.has(client.config.centRole))
			return interaction.followUp({ embeds: [new EmbedBuilder().setDescription(':x: You are not allowed to use this command!').setColor('Red')], ephemeral: true });

		const user = interaction.options.getMember('user');
		const quantity = interaction.options.getInteger('quantity');
        const item = client.items.get(interaction.options.getString('item'));
        const location = interaction.options.getString('location');

        const isGivingCents = interaction.options.getSubcommand() === "cents";

        if (interaction.options.getSubcommand() === "item") {
            if (!item) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: There is no item with that ID!').setColor('Red')], ephemeral: true });

            if (["item_token", "message_mirror", "laser_cannon", "vulture_gift", "midas_magnet", "upgrade_token"].includes(item.id)) {
                await addPetItem(client.conn, user.id, item.id, quantity, await getPetPouch(client.conn, user.id));
            } else if (!item.id.endsWith('_pet')) {
                await giveItem(client.conn, user.id, item.id, false, quantity);
            } else {
                await giveItem(client.conn, user.id, item.id, true);
            }

        } else if (interaction.options.getSubcommand() === "cents") {
            if (location === "p") {
                await giveCents(client.conn, user.id, quantity);
            } else {
                await executeSQL(client.conn, `UPDATE users SET bank = bank + ${quantity} WHERE id = ${user.id}`);
            }
        
        } else {
            const user = (await getUser(client.conn, interaction.user.id))[0];
            await executeSQL(client.conn, `UPDATE levels SET xp = xp + ${quantity} WHERE id = ${user.id}`);
        }

        const thingGiven = isGivingCents ? `:cent: ${quantity}` : (interaction.options.getSubcommand() === "item" ? `${quantity}x ${item.name}` : `${quantity} EXP`);
		await interaction.reply({
			embeds: [new EmbedBuilder().setDescription(`✅ Gave **${thingGiven}** to <@${user.id}>!`).setColor('Green')],
			ephemeral: true
		});
	},
};
