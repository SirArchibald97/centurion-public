const { EnemyType } = require("../enemy_type");

module.exports = {
    id: EnemyType.SpectralGuardian,
    name: "Spectral Guardian",
    icon: "<:SpectralGuardian:1105653412906942484>",
    health: 40,
    damage: 25,
    dialogue: {
        start: "I have defended these graves from mortals like you for centuries. You do not belong here!",
        win: "A mortal defeating me? Impossible! How can I die a second time?!",
        loss: "Just like all other mortals, you have failed to defeat me. You will join the others in the graves."
    }
}