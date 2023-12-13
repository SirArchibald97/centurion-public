const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getDungeonsData, createDungeonsUser } = require("../../utils/db");
const { DungeonType } = require("../../dungeons/dungeon_type");
const play_dungeon = require("../../dungeons/play_dungeon");

module.exports = {
    data: new SlashCommandBuilder().setName("dungeons").setDescription("View information on the dungeons"),

    async execute(client, interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({ content: `This command is still under development!`, ephemeral: true });

        const dungeonsData = await getDungeonsData(client.conn, interaction.member.id);
        if (dungeonsData.length === 0) {
            await createDungeonsUser(client.conn, interaction.member.id);
            return await interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setDescription("Looks like that was your first time running this command! I have automatically created some data for you, try running `/dungeons` again to get started!")
                        .setColor("Green")
                    ],
                ephemeral: true
            });
        }

        const cycleBack = new ButtonBuilder().setCustomId(`d-left`).setEmoji("⬅️").setStyle(ButtonStyle.Primary);
        const cycleForward = new ButtonBuilder().setCustomId(`d-right`).setEmoji("➡️").setStyle(ButtonStyle.Primary);

        
        let index = 0;
        const dungeons = this.sortDungeons(Array.from(client.dungeons.areas));
        const pages = this.getEmbeds(client, dungeons);

        const message = await interaction.reply({ 
            embeds: [pages[index]],
            components: [new ActionRowBuilder().addComponents(
                cycleBack,
                this.createConfirmButton(interaction.member.id, dungeons[index][0]),
                cycleForward
            )],
            fetchReply: true
        });
        
        const filter = (i) => i.member.id === interaction.member.id;
        const collector = message.createMessageComponentCollector({ filter: filter, time: 60_000 });
        collector.on("collect", async (int) => {
            if (int.customId === "d-left") {
                index--;
                if (index < 0) index = pages.length - 1;

                await int.update({ 
                    embeds: [pages[index]],
                    components: [new ActionRowBuilder().addComponents(
                        cycleBack,
                        this.createConfirmButton(interaction.member.id, dungeons[index].id),
                        cycleForward
                    )],
                });
            } else if (int.customId === "d-right") {
                index++;
                if (index > pages.length - 1) index = 0;

                await int.update({ 
                    embeds: [pages[index]],
                    components: [new ActionRowBuilder().addComponents(
                        cycleBack,
                        this.createConfirmButton(interaction.member.id, dungeons[index].id),
                        cycleForward
                    )],
                });
            } else {
                collector.stop();
                play_dungeon(client, client.dungeons.areas.get(dungeons[index].id), dungeonsData[0], int);
            }
        });
    },

    getEmbeds(client, dungeons) {
        const embeds = [];
        for (const dungeon of dungeons) {
            const boss = client.dungeons.bosses.get(dungeon.boss);
            const embed = new EmbedBuilder().setTitle(dungeon.name + "・" + dungeon.floors + " Floors").setColor("Blurple").setTimestamp()
                .setDescription(`${dungeon.description}`)
                .addFields( 
                    { name: "Boss", value: `${boss.icon}  \`${boss.name}\``, inline: true },
                    { name: "Requirements", value: `Level: \`${dungeon.requirements.level}\`\nDungeon: \`${dungeon.requirements.dungeon ? client.dungeons.areas.get(dungeon.requirements.dungeon).name : "None"}\``, inline: true },
                );

            embeds.push(embed);
        }
        return embeds;
    },

    createConfirmButton(memberId, dungeonId) {
        return new ButtonBuilder().setCustomId(`d-confirm-${memberId}-${dungeonId}`).setEmoji("✅").setStyle(ButtonStyle.Success);
    },

    sortDungeons(dungeons) {
        const sorted = [];
        let currentIndex = 0;
        while (sorted.length !== dungeons.length) {
            for (const dungeon of dungeons) {
                if (dungeon[1].index === currentIndex) {
                    sorted.push(dungeon[1]);
                    currentIndex++;
                }
            }
        }
        return sorted;
    }
}