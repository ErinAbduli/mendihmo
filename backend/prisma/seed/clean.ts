import { prisma } from "../../lib/prisma.ts";

async function main() {
	console.log("🧹 Cleaning database...");

	// CHILD TABLES FIRST (to avoid FK errors)

	await prisma.contribution.deleteMany();
	await prisma.transaction.deleteMany();
	await prisma.comment.deleteMany();
	await prisma.update.deleteMany();
	await prisma.reward.deleteMany();
	await prisma.report.deleteMany();
	await prisma.campaign.deleteMany();
	await prisma.category.deleteMany();

	await prisma.userRole.deleteMany();
	await prisma.userClaim.deleteMany();
	await prisma.userToken.deleteMany();
	await prisma.refreshToken.deleteMany();

	await prisma.user.deleteMany();

	console.log("✅ Database cleaned successfully!");
}

main()
	.catch((e) => {
		console.error("❌ Error cleaning DB:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
