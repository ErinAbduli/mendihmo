import { prisma } from "../lib/prisma.ts";
import bcrypt from "bcrypt";

const userSelect = {
	id: true,
	emri: true,
	mbiemri: true,
	email: true,
	statusi: true,
	data_krijimit: true,
	userRoles: {
		select: {
			role: {
				select: {
					normalized_name: true,
				},
			},
		},
	},
} as const;

export const userService = {
	createUser: async (
		emri: string,
		mbiemri: string,
		email: string,
		password: string,
		role: "USER" | "MODERATOR" | "ADMIN",
	) => {
		const userExists = await prisma.user.findUnique({ where: { email } });
		if (userExists) {
			throw new Error("User already exists");
		}

		const hashedPassword = await bcrypt.hash(password, 12);

		const user = await prisma.$transaction(async (tx) => {
			const createdUser = await tx.user.create({
				data: {
					emri,
					mbiemri,
					email,
					password_hash: hashedPassword,
					statusi: "aktiv",
				},
			});

			const selectedRole = await tx.role.upsert({
				where: { normalized_name: role },
				update: {},
				create: {
					emertimi: role,
					normalized_name: role,
					pershkrimi: `${role} role`,
				},
			});

			await tx.userRole.create({
				data: {
					user_id: createdUser.id,
					role_id: selectedRole.id,
				},
			});

			return createdUser;
		});

		return prisma.user.findUnique({
			where: { id: user.id },
			select: userSelect,
		});
	},

	getUser: async (userId: string) => {
		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
			select: userSelect,
		});
		if (!user) {
			throw new Error("Personi nuk u gjet");
		}
		return user;
	},

	updateUser: async (
		userId: string,
		data: {
			emri: string;
			mbiemri: string;
			email: string;
			role: "USER" | "MODERATOR" | "ADMIN";
			statusi: "aktiv" | "joaktiv";
		},
	) => {
		const id = Number.parseInt(userId, 10);
		const user = await prisma.user.findUnique({ where: { id } });

		if (!user) {
			throw new Error("Personi nuk u gjet");
		}

		if (user.email !== data.email) {
			const emailExists = await prisma.user.findUnique({
				where: { email: data.email },
			});

			if (emailExists) {
				throw new Error("User already exists");
			}
		}

		const updatedUser = await prisma.$transaction(async (tx) => {
			const selectedRole = await tx.role.upsert({
				where: { normalized_name: data.role },
				update: {},
				create: {
					emertimi: data.role,
					normalized_name: data.role,
					pershkrimi: `${data.role} role`,
				},
			});

			await tx.user.update({
				where: { id },
				data: {
					emri: data.emri,
					mbiemri: data.mbiemri,
					email: data.email,
					statusi: data.statusi,
				},
			});

			await tx.userRole.deleteMany({ where: { user_id: id } });
			await tx.userRole.create({
				data: {
					user_id: id,
					role_id: selectedRole.id,
				},
			});

			return tx.user.findUnique({
				where: { id },
				select: userSelect,
			});
		});

		return updatedUser;
	},

	deleteUser: async (userId: string) => {
		const id = Number.parseInt(userId, 10);
		if (!Number.isFinite(id)) {
			throw new Error("Personi nuk u gjet");
		}

		const user = await prisma.user.findUnique({ where: { id } });

		if (!user) {
			throw new Error("Personi nuk u gjet");
		}

		await prisma.$transaction(async (tx) => {
			const campaigns = await tx.campaign.findMany({
				where: { creatorId: id },
				select: { id: true },
			});

			const campaignIds = campaigns.map((campaign) => campaign.id);

			// Transaction relations are restrictive, so clean them first.
			await tx.transaction.deleteMany({
				where: {
					OR: [
						{ userId: id },
						...(campaignIds.length > 0
							? [{ campaignId: { in: campaignIds } }]
							: []),
					],
				},
			});

			await tx.user.delete({ where: { id } });
		});
	},

	getAllUsers: async () => {
		return await prisma.user.findMany({
			select: userSelect,
		});
	},
};
