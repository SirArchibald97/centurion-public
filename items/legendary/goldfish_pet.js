const { hasGoldfishPet } = require('../../utils/db');

module.exports = {
	id: 'goldfish_pet',
	name: 'Goldfish Pet',
	desc: 'Experience Splash - Small chance for experience gain to be quadrupled after sending a message.',
	rarity: 'Legendary',
	unfindable: true,

	async onMessage(client, message) {
		const hasGoldfish = (await hasGoldfishPet(client.conn, message.member.id))[0].doesExist === 1;
		if (hasGoldfish) {
			const splashSeed = Math.floor(Math.random() * 100 + 1);
			const splashChance = Math.floor(Math.random() * 100 + 1);

			if (splashChance === splashSeed) {
				await message.react('🐠');
				return Promise.resolve(true);
			}
		}
		return Promise.resolve(false);
	},
};
