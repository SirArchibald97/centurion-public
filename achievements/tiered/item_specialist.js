module.exports = {
	id: "item_specialist",
	name: "Item Specialist",
    tiered: true,
    tiers: [
        { tier: 1, desc: "Use 50 items", amount: 50, points: 5 },
        { tier: 2, desc: "Use 250 items", amount: 250, points: 5 },
        { tier: 3, desc: "Use 500 items", amount: 1000, points: 10 },
        { tier: 4, desc: "Use 1,000 items", amount: 2500, points: 10 },
        { tier: 5, desc: "Use 2,500 items", amount: 5000, points: 15 },
    ]
}