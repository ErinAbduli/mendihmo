import { prisma } from "../lib/prisma.ts";

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
	getAllUsers: async () => {
		return await prisma.user.findMany({
			select: userSelect,
		});
	},
};
