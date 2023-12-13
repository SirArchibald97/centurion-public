const { db } = require("./log");

const executeSQL = (conn, sql) => {
	return new Promise((resolve, reject) => {
		conn.query(sql, (err, result) => {
			if (err) reject(err);
            //db(sql);
			resolve(result);
		});
	});
}



/* ECONOMY */
const createUser = async (conn, userId, xp) => {
	await executeSQL(conn, `INSERT INTO settings (id) VALUES ('${userId}')`);
	return await executeSQL(conn, `INSERT INTO levels (id, xp, level) VALUES ('${userId}', ${xp}, 1)`);
}
const getUser = async (conn, user) => { return await executeSQL(conn, `SELECT * FROM levels WHERE id = '${user}'`); }
const getInventory = async (conn, user) => { return await executeSQL(conn, `SELECT * FROM inventory WHERE user = '${user}'`); }
const getPetPouch = async (conn, userId) => { return await executeSQL(conn, `SELECT * FROM pet_pouch WHERE user = '${userId}'`); }
const addPetItem = async (conn, userId, item, quantity, petPouch) => { return await executeSQL(conn,
	petPouch.filter(i => i.item === item).length > 0 ? `UPDATE pet_pouch SET quantity = quantity + ${quantity} WHERE user = '${userId}' AND item = '${item}'`
	: `INSERT INTO pet_pouch (user, item, quantity) VALUES ('${userId}', '${item}', ${quantity})`
); }
const removePetItem = async (conn, userId, item, quantity, petPouch) => { return await executeSQL(conn,
	petPouch.filter(i => i.item === item)[0].quantity - quantity >= 1 ? `UPDATE pet_pouch SET quantity = quantity - ${quantity} WHERE user = '${userId}' AND item = '${item}'`
	: `DELETE FROM pet_pouch WHERE user = '${userId}' AND item = '${item}'`
); }

const getPets = async (conn, user) => { return await executeSQL(conn, `SELECT * FROM pets WHERE user = '${user}'`); }
const claimPet = async (conn, user, pet) => { return await executeSQL(conn, `UPDATE pets SET lastClaimed = '${Date.now()}' WHERE user = '${user}' AND type = '${pet}'`); }

const takeItem = async (conn, user, item, amount) => {
	const isPet = item.endsWith("_pet");
    if (isPet) {
		return await executeSQL(conn, `DELETE FROM pets WHERE user = '${user}' AND type = '${item}'`);
    } else {
        const inventory = await executeSQL(conn, `SELECT * FROM inventory WHERE user = '${user}' AND item = '${item}'`);
        if (inventory.length === 0) {
            return null;
        } else {
            if (inventory[0].quantity - (amount || 1) <= 0) {
                return await executeSQL(conn, `DELETE FROM inventory WHERE user = '${user}' AND item = '${item}'`);
            } else {
                return await executeSQL(conn, `UPDATE inventory SET quantity = quantity - ${amount || 1} WHERE user = '${user}' AND item = '${item}'`);
            }
        }
}
};
const giveItem = async (conn, user, item, isPet, amount) => {
	if (isPet) {
		return await executeSQL(conn, `INSERT INTO pets (user, type, lastClaimed) VALUES ('${user}', '${item}', '0')`);
	} else {
		const inventory = await executeSQL(conn, `SELECT * FROM inventory WHERE user = '${user}' AND item = '${item}'`);
		if (inventory.length === 0) {
			return await executeSQL(conn, `INSERT INTO inventory(user, item, quantity) VALUES('${user}', '${item}', ${amount ? amount : 1})`);
		} else {
			return await executeSQL(conn, `UPDATE inventory SET quantity = quantity + ${amount ? amount : 1} WHERE user = '${user}' AND item = '${item}'`);
		}
	}
};

const takeCents = async (conn, userId, amount) => {
	const player = (await getUser(conn, userId))[0];
	return await executeSQL(conn, `UPDATE levels SET cents = ${player?.cents - amount < 0 ? 0 : `cents - ${amount}`} WHERE id = '${userId}'`);
}
const giveCents = async (conn, user, amount) => { return await executeSQL(conn, `UPDATE levels SET cents = cents + ${amount} WHERE id = '${user}'`); }

const openBankAccount = async (conn, user) => { return await executeSQL(conn, `UPDATE levels SET hasBank = 1 WHERE id = '${user}'`); }
const withdrawCents = async (conn, user, amount) => { return await executeSQL(conn, `UPDATE levels SET bank = bank - ${amount}, cents = cents + ${amount} WHERE id = '${user}'`); }
const depositCents = async (conn, user, amount) => { return await executeSQL(conn, `UPDATE levels SET bank = bank + ${amount}, cents = cents - ${amount} WHERE id = '${user}'`); }
const addInterest = async (conn, user, amount) => { return await executeSQL(conn, `UPDATE levels SET bank = bank + ${amount}, lastCollected = '${Date.now()}' WHERE id = '${user}'`); }
const upgradeBank = async (conn, user, cost) => { return await executeSQL(conn, `UPDATE levels SET cents = cents - ${cost}, bankLevel = bankLevel + 1 WHERE id = '${user}'`); }


const getExpLeaderboard = async (conn) => { return await executeSQL(conn, `SELECT * FROM levels ORDER BY xp DESC`); }
const getCentLeaderboard = async (conn) => { return await executeSQL(conn, `SELECT * FROM levels ORDER BY cents + bank DESC`); }
const addExp = async (conn, user, amount) => { return await executeSQL(conn, `UPDATE levels SET xp = xp + ${amount} WHERE id = '${user}'`); }
const incrementLevel = async (conn, user) => { return await executeSQL(conn, `UPDATE levels SET level = level + 1 WHERE id = '${user}'`); }
const hasGoldfishPet = async (conn, user) => { return await executeSQL(conn, `SELECT EXISTS(SELECT * FROM pets WHERE user = '${user}' AND type = 'goldfish_pet') AS doesExist`); }
const hasPhoenixPet = async (conn, user) => { return await executeSQL(conn, `SELECT EXISTS(SELECT * FROM pets WHERE user = '${user}' AND type = 'phoenix_pet') AS doesExist`); }
const getAllBoosts = async (conn) => { return await executeSQL(conn, `SELECT * FROM boosts`); }
const getBoosts = async (conn, user) => { return await executeSQL(conn, `SELECT * FROM boosts WHERE user = '${user}'`); }
const addBoost = async (conn, user, type, extra, length) => { return await executeSQL(conn, `INSERT INTO boosts (user, type, extra, length, timestamp) VALUES ('${user}', '${type}', '${extra}', '${length}', '${Date.now()}')`); }
const removeBoost = async (conn, user) => { return await executeSQL(conn, `DELETE FROM boosts WHERE user = '${user}'`); }
const isUsingPlutus = async (conn, user) => { const boosts = await getBoosts(conn, user); return boosts[0]?.type === "plutus_grace"; }



/* SHOP */
const getShop = async (conn) => { return await executeSQL(conn, `SELECT * FROM shop`); }
const rotateShop = async (conn, tier1item, tier2item, tier3item) => {
	await executeSQL(conn, `DELETE FROM shop`);
	await executeSQL(conn, `DELETE FROM shopBuys`);
	return await executeSQL(conn, `INSERT INTO shop (item) VALUES ('${tier1item}'), ('${tier2item}'), ('${tier3item}')`);
}
const getShopBuys = async (conn, user) => { return await executeSQL(conn, `SELECT * FROM shopBuys WHERE user = '${user}'`); }
const addShopBuy = async (conn, user, tier, amount) => { return await executeSQL(conn, `UPDATE shopBuys SET ${tier} = ${tier} + ${amount} WHERE user = '${user}'`); }
const countShopBuys = async (conn, user, tier, amount) => { return await executeSQL(conn, `INSERT INTO shopBuys (user, ${tier}) VALUES ('${user}', ${amount})`); }

const getSphinxRiddles = async (conn) => { return await executeSQL(conn, `SELECT * FROM item_data WHERE item = 'sphinx_key'`); }



/* HAPPY HOURS */
const getHappyHours = async (conn) => { return await executeSQL(conn, `SELECT * FROM happyhours`); }
const addHappyHour = async (conn, time, multiplier) => { return await executeSQL(conn, `INSERT INTO happyhours (time, multiplier) VALUES ('${time}', ${multiplier})`); }
const removeHappyHour = async (conn, id) => { return await executeSQL(conn, `DELETE FROM happyhours WHERE id = '${id}'`); }



/* SETTINGS */
const getSettings = async (conn, userId) => { return await executeSQL(conn, `SELECT * FROM settings WHERE id = '${userId}'`); }
const changeSetting = async (conn, userId, setting, value) => { return await executeSQL(conn, `UPDATE settings SET ${setting} = ${value} WHERE id = '${userId}'`); }



/* MC LINK */
const getLinkRecord = async (conn, tag) => { return await executeSQL(conn, `SELECT * FROM mc_link WHERE dtag = '${tag}'`); }
const confirmLink = async (conn, user, uuid, role, level, tag, username) => { return await executeSQL(conn, `UPDATE mc_link SET did = '${user}', uuid = '${uuid}', pending = 0, role = '${role}', level = ${level} WHERE dtag = '${tag}' AND username = '${username}'`); }



/* ACHIEVEMENTS */
const getAPLeaderboard = async (conn) => { return await executeSQL(conn, `SELECT * FROM levels ORDER BY ap DESC`); }
const getAllAchievements = async (conn) => { return await executeSQL(conn, `SELECT * FROM achievements`); }
const getAchievements = async (conn, user) => { return await executeSQL(conn, `SELECT * FROM achievements WHERE user = '${user}' ORDER BY completedAt DESC`); }
const checkForAchievement = async (conn, user, achievement) => { return (await executeSQL(conn, `SELECT * FROM achievements WHERE id = '${achievement}' AND user = '${user}'`)).length > 0; }
const addAchievement = async (client, user, achievement) => { 
    await executeSQL(client.conn, `UPDATE levels SET ap = ap + ${client.achievements?.get(achievement).points} WHERE id = '${user}'`);
    return await executeSQL(client.conn, `INSERT INTO achievements (id, user, completedAt) VALUES ('${achievement}', '${user}', '${Date.now()}')`);
}

const getTrackedAchievement = async (conn, user, achievement) => { return (await executeSQL(conn, `SELECT * FROM tracked_achievements WHERE user = '${user}' AND achievement = '${achievement}'`))[0]; }
const incrementTrackedAchievement = async (conn, user, achievement) => { return await executeSQL(conn, `UPDATE tracked_achievements SET count = count + 1 WHERE user = '${user}' AND achievement = '${achievement}'`); }
const trackAchievement = async (conn, user, achievement) => { return executeSQL(conn, `INSERT INTO tracked_achievements(user, achievement, count) VALUES('${user}', '${achievement}', 1)`); }


/* TRADES */
const listTrade = async (conn, tradeId, userId, itemId, quantity, price) => { return await executeSQL(conn, `INSERT INTO trades (trade_id, user, item, quantity, price) VALUES ('${tradeId}', '${userId}', '${itemId}', ${quantity}, ${price})`); }
const getTrades = async (conn) => { return await executeSQL(conn, `SELECT * FROM trades`); }
const getTradeById = async (conn, tradeId) => { return (await executeSQL(conn, `SELECT * FROM trades WHERE trade_id = '${tradeId}'`))[0]; }
const getTradesByUser = async (conn, userId) => { return await executeSQL(conn, `SELECT * FROM trades WHERE user = '${userId}'`); }

const updateTrade = async (conn, tradeId, quantity) => { return await executeSQL(conn, `UPDATE trades SET quantity = quantity + ${quantity} WHERE trade_id = '${tradeId}'`); }
const removeTrade = async (conn, tradeId) => { return await executeSQL(conn, `DELETE FROM trades WHERE trade_id = '${tradeId}'`); }
const decrementTradeQuantity = async (conn, tradeId, quantity) => { return await executeSQL(conn, `UPDATE trades SET quantity = quantity - ${quantity} WHERE trade_id = '${tradeId}'`); }


/* TROPHY PETS */
const getTrophyPetCents = async (conn, userId) => { return await executeSQL(conn, `SELECT * FROM trophy_pets WHERE user = '${userId}'`); }
const addTrophyPetCents = async (conn, userId, cents) => { return await executeSQL(conn, `UPDATE trophy_pets SET amount = amount + ${cents} WHERE user = '${userId}'`); }
const createTrophyPetCents = async (conn, userId, cents) => { return await executeSQL(conn, `INSERT INTO trophy_pets (user, amount) VALUES ('${userId}', ${cents})`); }
const resetTrophyPetCents = async (conn, userId) => { return await executeSQL(conn, `UPDATE trophy_pets SET amount = 0 WHERE user = '${userId}'`); }


/* LOCKDOWN */
const isLockdownEnabled = async (conn) => { return (await executeSQL(conn, `SELECT * FROM server_features WHERE feature = 'lockdown'`))[0].enabled === 1; }


/* DUNGEONS */
const getDungeonsData = async (conn, userId) => { return await executeSQL(conn, `SELECT * FROM dungeons WHERE user_id = '${userId}'`); }
const createDungeonsUser = async (conn, userId) => { return await executeSQL(conn, `INSERT INTO dungeons (user_id, weapon) VALUES ('${userId}', 'wooden_club')`); }

module.exports = {
	executeSQL,
	createUser, getUser, getInventory, getPets, claimPet, takeItem, giveItem, takeCents, giveCents, openBankAccount, withdrawCents, depositCents, addInterest, upgradeBank,
	getExpLeaderboard, getCentLeaderboard, addExp, incrementLevel, hasGoldfishPet, hasPhoenixPet, getAllBoosts, getBoosts, addBoost, removeBoost, isUsingPlutus,
	getShop, rotateShop, getSphinxRiddles, getShopBuys, addShopBuy, countShopBuys,
	getHappyHours, addHappyHour, removeHappyHour,
	getSettings, changeSetting,
	getLinkRecord, confirmLink,
	getAPLeaderboard, getAllAchievements, getAchievements, checkForAchievement, addAchievement, getTrackedAchievement, incrementTrackedAchievement, trackAchievement,
	getPetPouch, addPetItem, removePetItem,
	listTrade, getTrades, getTradeById, getTradesByUser, updateTrade, removeTrade, decrementTradeQuantity,
    getTrophyPetCents, addTrophyPetCents, createTrophyPetCents, resetTrophyPetCents,
	isLockdownEnabled,
    getDungeonsData, createDungeonsUser,
};