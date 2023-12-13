module.exports = {
	id: "extravert",
	name: "Extravert",
    tiered: true,
    tiers: [
        { tier: 1, desc: "Send 100 chat messages", amount: 100, points: 5 },
        { tier: 2, desc: "Send 1,000 chat messages", amount: 1000, points: 5 },
        { tier: 3, desc: "Send 5,000 chat messages", amount: 5000, points: 10 },
        { tier: 4, desc: "Send 15,000 chat messages", amount: 15000, points: 10 },
        { tier: 5, desc: "Send 35,000 chat messages", amount: 35000, points: 15 },
    ]
}