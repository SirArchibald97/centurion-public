module.exports = {
	id: 'parrot_pet',
	name: 'Parrot Pet',
	desc: 'Mimic - Grants a Message Mirror',
	rarity: 'Uncommon',
	craftable: true,
    reward: 'message_mirror',
	recipe: [
		{ item: 'pet_core', quantity: 2 },
		{ item: 'vibrant_feather', quantity: 5 },
	],
	unfindable: true,
};
