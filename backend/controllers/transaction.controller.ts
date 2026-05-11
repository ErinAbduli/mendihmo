import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";

export const getTransactions = async (req: Request, res: Response) => {
	try {
		const transactions = await prisma.transaction.findMany({
			include: {
				user: {
					select: {
						id: true,
						emri: true,
						mbiemri: true,
						email: true,
					},
				},
				campaign: {
					select: {
						id: true,
						title: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		res.json({ transactions });
	} catch (err) {
		console.error("Failed to get transactions", err);
		res.status(500).json({ message: "Failed to load transactions" });
	}
};

export default { getTransactions };
