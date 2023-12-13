const { EmbedBuilder, SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getSettings, changeSetting, executeSQL } = require('../../utils/db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Change your user settings!'),

	async execute(client, interaction) {
        const settings = {
            "ITEM_CONFIRM": {
                name: "Item Confirm",
                desc: "Adds a button to confirm the use of items",
            }
        };
		const userSettings = await getSettings(client.conn, interaction.member.id);
        if (userSettings.length === 0) {
            await executeSQL(client.conn, `INSERT INTO settings (id) VALUES ('${interaction.member.id}')`);
            return await interaction.reply({ embeds: [new EmbedBuilder().setDescription("Looks like this is your first time changing settings, I have gone ahead and set you up with the default options automatically. Run `/settings` again to change them!").setColor("Green")], ephemeral: true });
        }

        const selectMenuOptions = [];
        for (const [id, details] of Object.entries(settings)) {
            console.log(id);
            selectMenuOptions.push({
                label: details.name,
                description: details.desc,
                emoji: userSettings[0][id] === 1 ? "🟢" : "🔴",
                value: id,
            });
        }

        const reply = await interaction.reply({
            components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("settings").setPlaceholder("Select a setting to toggle it").addOptions(selectMenuOptions))],
            ephemeral: true,
            fetchReply: true,
        });

        const filter = (int) => int.member.id === interaction.member.id && int.customId === "settings";
        const collector = reply.createMessageComponentCollector({ filter: filter, time: 60_000 * 5 });
        collector.on("collect", async (int) => {
            let updatedUserSettings = await getSettings(client.conn, interaction.member.id);

            const toggledSetting = int.values[0];
            const newValue = updatedUserSettings[0][toggledSetting] === 1 ? 0 : 1;
            await changeSetting(client.conn, interaction.member.id, toggledSetting, newValue);
            
            updatedUserSettings = await getSettings(client.conn, interaction.member.id);
            const updatedSelectMenuOptions = [];
            for (const [id, details] of Object.entries(settings)) {
                updatedSelectMenuOptions.push({
                    label: details.name,
                    description: details.desc,
                    emoji: updatedUserSettings[0][id] === 1 ? "🟢" : "🔴",
                    value: id,
                });
            }

            await int.update({
                embeds: [new EmbedBuilder().setDescription(`Toggled setting **${settings[toggledSetting].name}** ${newValue === 1 ? "on" : "off"}!`).setColor(newValue === 1 ? "Green" : "Red")],
                components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("settings").setPlaceholder("Select a setting to toggle it").addOptions(updatedSelectMenuOptions))]
            });
        });
	},
};
