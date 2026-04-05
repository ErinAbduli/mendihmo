import { prisma } from "../lib/prisma.ts";

export const categoryService = {
	getAllCategories: async () => {
		return prisma.category.findMany({
			select: {
				id: true,
				name: true,
				slug: true,
			},
			orderBy: { name: "asc" },
		});
	},
};