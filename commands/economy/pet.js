const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getPets, getInventory, claimPet, checkForAchievement, addAchievement, giveCents, getPetPouch, addPetItem, getTrophyPetCents, resetTrophyPetCents } = require('../../utils/db');
const { achievement, petPouchPage } = require('../../utils/embeds');
const { increaseAchievementLevel, increaseTrophyLevel } = require('../../utils/levels');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pet')
		.setDescription('Manage your pets')
		.addSubcommand((claim) =>
			claim.setName('claim').setDescription('Claim the perk of a pet').addStringOption((pet) =>
					pet.setName('type').setDescription('Select a type').setRequired(true)
                        .addChoices(
                            { name: 'Rock', value: 'rock_pet' },
                            { name: 'Parrot', value: 'parrot_pet' },
                            { name: 'Robot', value: 'robot_pet' },
                            { name: 'Vulture', value: 'vulture_pet' },
                            { name: 'Centurion', value: 'centurion_pet' },
                            { name: 'Dragon', value: 'dragon_pet' },
                            { name: 'Trophy', value: 'trophy_pet' },
                        )
				),
		)
		.addSubcommand((claimall) => claimall.setName("claimall").setDescription("Claim all available pet perks"))
        .addSubcommand(pouch => pouch.setName("pouch").setDescription("View your pet pouch")),

	async execute(client, interaction) {
		const user = interaction.options.getMember("user") || interaction.member;
		const pets = await getPets(client.conn, user.id);

        const petPouch = await getPetPouch(client.conn, interaction.member.id);

		if (interaction.options.getSubcommand() === "claim") {
			let petType = interaction.options.getString('type');
			let chosenPet = pets.filter((p) => p.type.includes(petType))[0];

			if (pets.length === 0) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(":x: You don't have any pets!").setColor('Red')], ephemeral: true });
			if (!chosenPet) return await interaction.reply({ embeds: [new EmbedBuilder().setDescription(':x: You do not own that pet!').setColor('Red')], ephemeral: true });
			if (Number(chosenPet.lastClaimed) + 1000 * 60 * 60 * 24 >= Date.now())
				return await interaction.reply({
					embeds: [new EmbedBuilder().setDescription(`:x: You can claim this pet's perk <t:${Math.floor((Number(chosenPet.lastClaimed) + 1000 * 60 * 60 * 24) / 1000)}:R>!`).setColor('Red')],
					ephemeral: true
				});

			const pet = client.items.get(chosenPet.type);
            if (pet.id.endsWith("trophy_pet")) {
                const trophyPetCents = (await getTrophyPetCents(client.conn, interaction.member.id))[0];
                await giveCents(client.conn, user.id, trophyPetCents?.amount || 0);
                await resetTrophyPetCents(client.conn, interaction.member.id);
                await interaction.reply({ embeds: [new EmbedBuilder().setTitle("🐶 Pet Perk claimed").setDescription(`You claimed <:cent:1042902432914620497> **${trophyPetCents?.amount || 0}**!`).setColor("Green")] });    
            } else {
                await addPetItem(client.conn, interaction.member.id, pet.reward, 1, petPouch);
                await claimPet(client.conn, user.id, pet.id);
                await interaction.reply({ embeds: [new EmbedBuilder().setTitle("🐶 Pet Perk claimed").setDescription(`You claimed one **${client.items.get(pet.reward).name}**!`).setColor("Green")] });    
            }
            
            if (pet.id === "robot_pet") {
                const inventory = await getInventory(client.conn, interaction.member.id);
                if (inventory.filter(i => i.item === "laser_cannon")[0].quantity >= 50) {
                    const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "50_laser_cannons");
                    if (!hasCompleted) {
                        await addAchievement(client, interaction.member.id, "50_laser_cannons");
                        await interaction.followUp({ embeds: [await achievement(client.achievements.get("50_laser_cannons"))] });
                        const levelupEmbed = await increaseAchievementLevel(client, interaction.member);
                        if (levelupEmbed) {
                            await interaction.followUp({ embeds: [levelupEmbed] });
                        }
                        const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                        if (trophyLevelUp) {
                            await interaction.followUp({ embeds: [trophyLevelUp] });
                        }
                    }
                }
            }
            
            
			
			const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "claim_pet_item");
			if (!hasCompleted) {
				await addAchievement(client, interaction.member.id, "claim_pet_item");
				await interaction.followUp({ embeds: [await achievement(client.achievements.get("claim_pet_item"))] });
                const levelupEmbed = await increaseAchievementLevel(client, interaction.member);
                if (levelupEmbed) {
                    await interaction.followUp({ embeds: [levelupEmbed] });
                }
                const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                if (trophyLevelUp) {
                    await interaction.followUp({ embeds: [trophyLevelUp] });
                }
			}
            
			


		} else if (interaction.options.getSubcommand() === "claimall") {
			let desc = "";

			for (let pet of pets) {
				let reason = null;
				let petItem = client.items.get(pet.type);

				if (Number(pet.lastClaimed) + (1000 * 60 * 60 * 24) > Date.now()) reason = `Ready to claim <t:${Math.floor((Number(pet.lastClaimed) + (1000 * 60 * 60 * 24)) / 1000)}:R>`;

                let unclaimablePets = ["goldfish_pet", "phoenix_pet"];
                if (!unclaimablePets.includes(petItem.id)) {
                    if (petItem.id.endsWith("trophy_pet")) {
                        const trophyPetCents = (await getTrophyPetCents(client.conn, interaction.member.id))[0];
                        await giveCents(client.conn, interaction.member.id, trophyPetCents?.amount || 0);
                        await resetTrophyPetCents(client.conn, interaction.member.id);
                        desc += `✅ ${petItem.name} (\`+${trophyPetCents?.amount || 0}\` <:cent:1042902432914620497>)\n`;

                    } else {
                        if (!reason) {
                            await addPetItem(client.conn, interaction.member.id, client.items.get(pet.type).reward, 1, petPouch);
                            await claimPet(client.conn, interaction.member.id, petItem.id);
                            desc += `✅ ${petItem.name}\n`;
                        } else {
                            desc += `❌ ${petItem.name} (${reason})\n`;
                        }
                    }
                }
			}

			await interaction.reply({ embeds: [new EmbedBuilder().setTitle("🐶 Pet Perks claimed").setDescription(desc).setColor("Green").setTimestamp()] });
                     
            
            if ((await getPetPouch(client.conn, interaction.member.id)).filter(i => i.item === "laser_cannon")[0].quantity >= 50) {
                const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "50_laser_cannons");
                if (!hasCompleted) {
                    await addAchievement(client, interaction.member.id, "50_laser_cannons");
                    await interaction.followUp({ embeds: [await achievement(client.achievements.get("50_laser_cannons"))] });
                    const levelupEmbed = await increaseAchievementLevel(client, interaction.member);
                    if (levelupEmbed) {
                        await interaction.followUp({ embeds: [levelupEmbed] });
                    }
                    const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                    if (trophyLevelUp) {
                        await interaction.followUp({ embeds: [trophyLevelUp] });
                    }
                }
            }
            
			const hasCompleted = await checkForAchievement(client.conn, interaction.member.id, "claim_pet_item");
			if (!hasCompleted) {
				await addAchievement(client, interaction.member.id, "claim_pet_item");
				await interaction.followUp({ embeds: [await achievement(client.achievements.get("claim_pet_item"))] });
                const levelupEmbed = await increaseAchievementLevel(client, interaction.member);
                if (levelupEmbed) {
                    await interaction.followUp({ embeds: [levelupEmbed] });
                }
                const trophyLevelUp = await increaseTrophyLevel(client, interaction.member);
                if (trophyLevelUp) {
                    await interaction.followUp({ embeds: [trophyLevelUp] });
                }
            }
		
        
        } else if (interaction.options.getSubcommand() === "pouch") {
            const petPouch = await getPetPouch(client.conn, interaction.member.id);
            await interaction.reply({ embeds: [await petPouchPage(client, interaction, petPouch)] });
        }
	},
};
