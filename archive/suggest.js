const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, Modal, ActionRowBuilder, TextInputComponent, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName("suggest").setDescription("Suggest a new feature or change")
        .addSubcommand(command => command.setName("discord").setDescription("Suggest a Discord feature"))
        .addSubcommand(command => command.setName("video").setDescription("Suggest a video idea")),

    async execute(client, interaction) {
		//if (interaction.member.id !== "398890149607637013") return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: Sorry, this feature is under development!").setColor("RED")], ephemeral: true });
        if (interaction.member.roles.cache.has(client.config.suggestionBlacklistRole)) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: You are not enable to use this command!").setColor("RED")] });

        if (client.suggestions.get(interaction.member.id)) {
            if (client.suggestions.get(interaction.member.id) + (1000 * 60 * 10) > Date.now())
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder().setDescription(`:x: You can create another suggestion in <t:${Math.round((client.suggestions.get(interaction.member.id) + (1000 * 60 * 10)) / 1000)}:R>`).setColor("RED")
                    ],
                    ephemeral: true
                });
        }

        const suggestModal = new Modal().setCustomId("suggest_modal").setTitle("New Suggestion").addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputComponent().setCustomId("suggestion_desc").setLabel("Enter your suggestion").setStyle("PARAGRAPH")
            )
        );

        await interaction.showModal(suggestModal);
        const filter = (int) => int.member.id === interaction.member.id;
        const isDiscordSuggestion = interaction.options.getSubcommand() === "discord";
        interaction.awaitModalSubmit({ filter: filter, time: 1000 * 60 * 10 })
            .then(async modal => {
                const embeds = [new EmbedBuilder().setTitle(`Suggestion from: ${interaction.member.user.tag}`).setDescription(modal.fields.getTextInputValue("suggestion_desc")).setFooter({ text: "Vote in the reactions below!", iconURL: interaction.member.avatarURL() }).setColor("BLURPLE")];
                try {
                    await modal.reply({
                        content: "Thanks for the suggestion! " + (isDiscordSuggestion ?  "Use the reactions to vote or click \"Create thread\" to start a discussion." : "Keep suggesting your good ideas!"),
                        ephemeral: true
                    });
                    const channels = { "discord": "919042426314821653", "video": "919032855835840512" };
                    const message = await interaction.guild.channels.cache.get(channels[interaction.options.getSubcommand()]).send({
                        embeds: embeds,
                        components: isDiscordSuggestion ? [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId("suggestionthread").setLabel("Create thread").setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId("suggestionlock").setLabel("Lock suggestion").setStyle(ButtonStyle.Secondary)
                        )] : []
                    });
                    await message.react("<:agree:920128255074402314>");
                    await message.react("<:disagree:920128254910820353>");
                    client.suggestions.set(interaction.member.id, Date.now());
                } catch (err) { }
            });
    }
}