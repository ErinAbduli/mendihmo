import { prisma } from "../../lib/prisma.ts";
import { Statusi, CampaignStatus } from "../../generated/prisma/enums.ts";

function random(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
	console.log("🌱 Seeding...");

	// ----------------------
	// FETCH EXISTING ROLES
	// ----------------------
	const [adminRole, modRole, userRole] = await Promise.all([
		prisma.role.findUnique({ where: { normalized_name: "ADMIN" } }),
		prisma.role.findUnique({ where: { normalized_name: "MODERATOR" } }),
		prisma.role.findUnique({ where: { normalized_name: "USER" } }),
	]);

	if (!adminRole || !modRole || !userRole) {
		throw new Error("Roles not found. Make sure roles are already seeded.");
	}

	// ----------------------
	// USERS
	// ----------------------
	const users = await Promise.all(
		Array.from({ length: 20 }).map((_, i) =>
			prisma.user.create({
				data: {
					emri: `User${i}`,
					mbiemri: "Test",
					email: `user${i}@test.com`,
					password_hash: "hashed",
					statusi: Statusi.aktiv,
					userRoles: {
						create: {
							role: {
								connect: { id: userRole.id },
							},
						},
					},
				},
			}),
		),
	);

	// Admin user
	const admin = await prisma.user.create({
		data: {
			emri: "Admin",
			mbiemri: "User",
			email: "admin@test.com",
			password_hash: "hashed",
			statusi: Statusi.aktiv,
			userRoles: {
				create: {
					role: {
						connect: { id: adminRole.id },
					},
				},
			},
		},
	});

	// ----------------------
	// CATEGORIES
	// ----------------------
	const categories = await Promise.all([
		prisma.category.create({ data: { name: "Tech", slug: "tech" } }),
		prisma.category.create({ data: { name: "Health", slug: "health" } }),
		prisma.category.create({ data: { name: "Gaming", slug: "gaming" } }),
	]);

	// ----------------------
	// CAMPAIGNS
	// ----------------------
	const campaigns = [];

	for (let i = 0; i < 30; i++) {
		const campaign = await prisma.campaign.create({
			data: {
				title: `Campaign ${i}`,
				slug: `campaign-${i}`,
				description: "Bulk generated campaign",
				goalAmount: random(1000, 20000),
				currentAmount: random(0, 5000),
				currency: "EUR",
				startDate: new Date(),
				endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
				status: CampaignStatus.active,
				creatorId: users[random(0, users.length - 1)].id,
				categoryId: categories[random(0, categories.length - 1)].id,
			},
		});

		campaigns.push(campaign);
	}

	// ----------------------
	// REWARDS
	// ----------------------
	const rewards = [];

	for (const campaign of campaigns) {
		for (let i = 0; i < 3; i++) {
			const reward = await prisma.reward.create({
				data: {
					campaignId: campaign.id,
					title: `Reward ${i}`,
					description: "Reward description",
					amount: random(10, 100),
					limitedQuantity: random(10, 200),
				},
			});

			rewards.push(reward);
		}
	}

	// ----------------------
	// CONTRIBUTIONS + TRANSACTIONS
	// ----------------------
	for (let i = 0; i < 100; i++) {
		const user = users[random(0, users.length - 1)];
		const campaign = campaigns[random(0, campaigns.length - 1)];
		const reward = rewards[random(0, rewards.length - 1)];

		await prisma.contribution.create({
			data: {
				userId: user.id,
				campaignId: campaign.id,
				rewardId: reward.id,
				amount: random(10, 200),
				paymentStatus: "completed",
			},
		});

		await prisma.transaction.create({
			data: {
				userId: user.id,
				campaignId: campaign.id,
				amount: random(10, 200),
				currency: "EUR",
				status: "completed",
				paymentMethod: "card",
			},
		});
	}

	// ----------------------
	// COMMENTS
	// ----------------------
	for (let i = 0; i < 50; i++) {
		await prisma.comment.create({
			data: {
				content: `This is comment ${i}`,
				userId: users[random(0, users.length - 1)].id,
				campaignId: campaigns[random(0, campaigns.length - 1)].id,
			},
		});
	}

	// ----------------------
	// UPDATES
	// ----------------------
	for (let i = 0; i < 20; i++) {
		await prisma.update.create({
			data: {
				title: `Update ${i}`,
				content: "Campaign update content",
				campaignId: campaigns[random(0, campaigns.length - 1)].id,
			},
		});
	}

	// ----------------------
	// REPORTS
	// ----------------------
	for (let i = 0; i < 20; i++) {
		await prisma.report.create({
			data: {
				reporterId: users[random(0, users.length - 1)].id,
				targetType: "campaign",
				targetId: campaigns[random(0, campaigns.length - 1)].id,
				reason: "Bulk generated report",
				status: "pending",
			},
		});
	}

	console.log("✅ Seeding complete!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
