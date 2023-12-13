const { default: axios } = require("axios");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require("discord.js");
const { getLinkRecord, getUser, confirmLink } = require('../../utils/db');

module.exports = {
    data: new SlashCommandBuilder().setName("link").setDescription("Link your Minecraft and Discord accounts"),

    async execute(client, interaction) {
        await interaction.deferReply();

        const records = await getLinkRecord(client.conn, interaction.member.user.tag);
        if (records.length === 0)
            return await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(":x: This Discord account is not registered yet! Run `/link` on our Minecraft server to link.").setColor("Red")], ephemeral: true });
        if (records[0].pending === 0)
            return await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(":x: Your account has already been linked! To link again, run `/link` on the Minecraft server.").setColor("Red")], ephemeral: true });

        let newestRecord = records[0];
        for (let record of records) {
            if (Number(record.lastUpdated) > Number(newestRecord.lastUpdated)) {
                newestRecord = record;
            }
        }

        const apiresponse = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${newestRecord.username}`);
        const uuid = apiresponse.data.id;

        await interaction.editReply({
            embeds: [new EmbedBuilder().setDescription(`Link this account with Minecraft account \`${newestRecord.username}\`?`).setColor("Orange")],
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("confirm").setLabel("Confirm").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger)
            )],
            ephemeral: true
        });

        const reply = await interaction.fetchReply();
        const filter = (int) => int.member.id === interaction.member.id;
        const collector = await reply.createMessageComponentCollector({ filter: filter, max: 1, time: 30000 });
        collector.on("end", async (collected) => {
            if (collected.size === 0) {
                return await reply.edit({ embeds: [new EmbedBuilder().setDescription(":x: Operation timed out!").setColor("Red")], components: [], ephemeral: true });
            } else {
                let highestRole = "NONE";
                const player = (await getUser(client.conn, interaction.member.id))[0];
                if (interaction.member.roles.cache.has("918972346667270195")) highestRole = "ACTOR";
                if (player.level >= 50) highestRole = "VIP";

                if (collected.first().customId === "confirm") {
                    await confirmLink(client.conn, interaction.member.id, uuid, highestRole, player.level, interaction.member.user.tag, newestRecord.username);
                    await interaction.guild.channels.cache.get(client.config.linkLogs).send({
                        embeds: [new EmbedBuilder()
                            .setTitle(`${interaction.member.user.tag} linked their account!`)
                            .addField("Discord", `<@${interaction.member.id}>`)
                            .addField("Minecraft", `${newestRecord.username} (${uuid})`)
                            .setColor("Blurple")
                        ]
                    })
                    return await collected.first().update({ embeds: [new EmbedBuilder().setDescription(`Linked <@${interaction.member.id}> with account ${newestRecord.username}!`).setColor("Green")], components: [], ephemeral: true });
                } else {
                    return await collected.first().update({ embeds: [new EmbedBuilder().setDescription(`:x: Operation cancelled!`).setColor("Red")], components: [], ephemeral: true });
                }
            }
        });
    }
}