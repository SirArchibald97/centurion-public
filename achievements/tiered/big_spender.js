module.exports = {
	id: "big_spender",
	name: "Big Spender",
    tiered: true,
    tiers: [
        { tier: 1, desc: "Purchase 3 items from the weekly shop", amount: 3, points: 5 },
        { tier: 2, desc: "Purchase 10 items from the weekly shop", amount: 10, points: 5 },
        { tier: 3, desc: "Purchase 25 items from the weekly shop", amount: 25, points: 10 },
        { tier: 4, desc: "Purchase 50 items from the weekly shop", amount: 50, points: 10 },
        { tier: 5, desc: "Purchase 100 items from the weekly shop", amount: 100, points: 15 },
    ]
}