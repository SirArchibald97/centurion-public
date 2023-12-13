module.exports = async (client, interaction) => {
    const chest = client.dungeons.chests.get(interaction.customId.split("-")[1]);
}