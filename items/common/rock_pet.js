module.exports = {
	id: 'rock_pet',
	name: 'Rock Pet',
	desc: 'Spelunker - Grants an Item Token',
	rarity: 'Common',
    reward: 'item_token',
	craftable: true,
	recipe: [
		{ item: 'pet_core', quantity: 1 },
		{ item: 'mineral_fragment', quantity: 5 },
	],
	unfindable: true,
};
