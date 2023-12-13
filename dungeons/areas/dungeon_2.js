const { EnemyType } = require("../enemy_type");
const { DungeonType } = require("../dungeon_type");

module.exports = {
    id: DungeonType.Dungeon2,
    index: 1,
    name: "Dungeon 2",
    description: "Dungeon 2",
    floors: 20,
    enemies: [EnemyType.Wraith, EnemyType.RessurrectedCorpse, EnemyType.PossessedArmour],
    boss: EnemyType.SpectralGuardian,
    requirements: {
        level: 10,
        dungeon: DungeonType.Necropolis,
    },
    scaling: {
        health: { type: "multiplier", value: 1.2 },
        damage: { type: "additive", value: 3 }
    }
}