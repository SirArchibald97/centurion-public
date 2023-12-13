const { ChestType } = require("../chest_type");
const { DungeonType } = require("../dungeon_type");

module.exports = {
    id: ChestType.Wooden,
    name: "Wooden Chest",
    icon: "",
    rewards: {
        [DungeonType.Necropolis]: [
            "mineral_fragment",
            "vibrant_feather",
            "mechanical_component",
            "ragged_feather",
            "dark_steel_ingot",
            "dragon_scale",
            "spectral_essence"
        ],
    },
    rewardSlots: [
        {  }
    ],

    chooseRewards: function (client, dungeonType) {
        const rewards = this.rewards[dungeonType].forEach(reward => client.items.get(reward));
        
        // chances
        // 
    }
}