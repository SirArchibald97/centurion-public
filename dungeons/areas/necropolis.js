const { EnemyType } = require("../enemy_type");
const { DungeonType } = require("../dungeon_type");

module.exports = {
    id: DungeonType.Necropolis,
    index: 0,
    name: "The Necropolis",
    description: "This ancient graveyard is home to many restless spirits. Be careful, their ghostly guardian does not take kindly to intruders!",
    floors: 15,
    enemies: [EnemyType.Wraith, EnemyType.RessurrectedCorpse, EnemyType.PossessedArmour],
    boss: EnemyType.SpectralGuardian,
    requirements: {
        level: 10,
        dungeon: null,
    },
    baseStats: {
        health: 10, 
        damage: 7
    },
    scaling: {
        health: 1.2,
        damage: 3
    },
    bossScaling: {
        health: 1.3,
        damage: 5
    },
    expRange: { min: 1, max: 3 },
    centRange: { min: 5, max: 8 },
}