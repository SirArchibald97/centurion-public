const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { rotateShop } = require('../../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rotate")
        .setDescription("Manually shuffles the shop"),
    
    async execute(client, interaction) {
        if (!interaction.member.roles.cache.has(client.config.directorRole) && !interaction.member.roles.cache.has(client.config.centRole))
			return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You are not allowed to use this command!').setColor('Red')], ephemeral: true });
        
        let tier1 = client.items.filter((i) => i.rarity === 'Common' && !i.unfindable);
        let tier2 = client.items.filter((i) => (i.rarity === 'Uncommon' || i.rarity === 'Rare') && !i.unfindable);
        let tier3 = client.items.filter((i) => (i.rarity === 'Epic' || i.rarity === 'Legendary') && !i.unfindable);

        let tier1item = tier1.at(Math.floor(Math.random() * tier1.size));
        let tier2item = tier2.at(Math.floor(Math.random() * tier2.size));
        let tier3item = tier3.at(Math.floor(Math.random() * tier3.size));

        await rotateShop(client.conn, tier1item.id, tier2item.id, tier3item.id);
        await interaction.reply({ embeds: [new EmbedBuilder().setDescription("✅ Shop has been rotated!").setColor("Green")], ephemeral: true });
    }
}