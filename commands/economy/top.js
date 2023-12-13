const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getExpLeaderboard, getCentLeaderboard, getAPLeaderboard } = require('../../utils/db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('top')
		.setDescription('View the server leaderboards')
		.addSubcommand((xp) => xp.setName('exp').setDescription('EXP leaderboard'))
		.addSubcommand((cents) => cents.setName('cents').setDescription('Cents leaderboard'))
        .addSubcommand((points) => points.setName('ap').setDescription('AP leaderboard')),

	async execute(client, interaction) {
        let desc;
        if (interaction.options.getSubcommand() === "exp") {
            const everyone = await getExpLeaderboard(client.conn);
            const topten = everyone.slice(0, 10);
            const you = everyone.filter(p => p.id === interaction.member.id)[0];

            let inTopTen = false;
            if (topten.filter(p => p.id === interaction.member.id).length > 0) inTopTen = true;

            const desc = topten.map((person) => `#${everyone.indexOf(person) + 1} <@${person.id}> > **Level ${person.level}** \`(${Math.floor(person.xp).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')})\``).join("\n");

            await interaction.reply({
                embeds: [new EmbedBuilder().setTitle(`Name > Level (Total EXP)`).setColor('Blurple').setTimestamp().setFooter({ text: `Viewing 1-10` })
                    .setDescription(desc + (!inTopTen ? `\n\n**Your position:**\n#${everyone.indexOf(you) + 1} <@${you.id}> > **Level ${you.level}** \`(${Math.floor(you.xp).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')})})\`` : ""))
                ],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId("leaderboard.exp.prev.0." + interaction.member.id).setEmoji("◀️").setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId("leaderboard.exp.next.0." + interaction.member.id).setEmoji("▶️").setStyle(ButtonStyle.Primary)
                    )
                ]
            });

        } else if (interaction.options.getSubcommand() === "cents") {
            let everyone = await getCentLeaderboard(client.conn);

            let everyoneFiltered = [];
            let count = 1;
            for (let person of everyone) {
                if (interaction.guild.members.resolve(person.id) && count < 11) {
                    everyoneFiltered.push(person);
                    count++;
                }
            }

            if (interaction.member.presence?.clientStatus.mobile) {
                desc = `\`\`\`css\nName > Cents)`;
                for (let person of everyoneFiltered) {
                    let member = interaction.guild.members.resolve(person.id);
                    desc += `\n#${everyoneFiltered.indexOf(person) + 1} ${member.nickname ? member.nickname : member.user.username} > ${Math.floor(person.cents + person.bank).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

                }
                desc += "\`\`\`";
            } else {
                desc = `\`\`\`ansi\nName [0;30m> [0mCents`;
                for (let person of everyoneFiltered) {
                    let member = interaction.guild.members.resolve(person.id)
                    desc += `\n[0;34m#${everyoneFiltered.indexOf(person) + 1} [0;37m${member.nickname ? member.nickname : member.user.username} [0;30m> [0;37m${Math.floor(person.cents + person.bank).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
                }
                desc += "\`\`\`";

            }
            await interaction.reply({ embeds: [new EmbedBuilder().setTitle(`Server Top: Cents`).setDescription(desc).setColor('Blurple').setTimestamp()] });

        } else {
            let everyone = await getAPLeaderboard(client.conn);

            let everyoneFiltered = [];
            let count = 1;
            for (let person of everyone) {
                if (interaction.guild.members.resolve(person.id) && count < 11) {
                    everyoneFiltered.push(person);
                    count++;
                }
            }

            if (interaction.member.presence?.clientStatus.mobile) {
                desc = `\`\`\`css\nName > AP)`;
                for (let person of everyoneFiltered) {
                    let member = interaction.guild.members.resolve(person.id);
                    desc += `\n#${everyoneFiltered.indexOf(person) + 1} ${member.nickname ? member.nickname : member.user.username} > ${Math.floor(person.ap).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

                }
                desc += "\`\`\`";
            } else {
                desc = `\`\`\`ansi\nName [0;30m> [0mAP`;
                for (let person of everyoneFiltered) {
                    let member = interaction.guild.members.resolve(person.id)
                    desc += `\n[0;34m#${everyoneFiltered.indexOf(person) + 1} [0;37m${member.nickname ? member.nickname : member.user.username} [0;30m> [0;37m${Math.floor(person.ap).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
                }
                desc += "\`\`\`";

            }
            await interaction.reply({ embeds: [new EmbedBuilder().setTitle(`Server Top: AP`).setDescription(desc).setColor('Blurple').setTimestamp()] });

        }

	},
};
