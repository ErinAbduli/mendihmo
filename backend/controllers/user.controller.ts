import type { Request, Response } from "express";
import { userService } from "../services/user.service.ts";

export const userController = {
	async createUser(req: Request, res: Response) {
		try {
			const { emri, mbiemri, email, password, role } = req.body;
			const user = await userService.createUser(
				emri,
				mbiemri,
				email,
				password,
				role,
			);
			res.status(201).json(user);
		} catch (error) {
			const message = (error as Error).message;
			if (message.toLowerCase().includes("exists")) {
				return res.status(409).json({ error: message });
			}
			res.status(500).json({ error: message });
		}
	},

	async getUser(req: Request, res: Response) {
		try {
			const userId = req.params.id as string;
			const user = await userService.getUser(userId);
			res.json(user);
		} catch (error) {
			res.status(404).json({ error: (error as Error).message });
		}
	},

	async updateUser(req: Request, res: Response) {
		try {
			const userId = req.params.id as string;
			const { emri, mbiemri, email, role, statusi } = req.body;
			const user = await userService.updateUser(userId, {
				emri,
				mbiemri,
				email,
				role,
				statusi,
			});
			res.json(user);
		} catch (error) {
			const message = (error as Error).message;
			if (message.toLowerCase().includes("exists")) {
				return res.status(409).json({ error: message });
			}
			if (message.toLowerCase().includes("nuk u gjet")) {
				return res.status(404).json({ error: message });
			}
			res.status(500).json({ error: message });
		}
	},

	async deleteUser(req: Request, res: Response) {
		try {
			const userId = req.params.id as string;
			await userService.deleteUser(userId);
			res.status(204).send();
		} catch (error) {
			const message = (error as Error).message;
			if (message.toLowerCase().includes("nuk u gjet")) {
				return res.status(404).json({ error: message });
			}
			res.status(500).json({ error: message });
		}
	},

	async getAllUsers(req: Request, res: Response) {
		try {
			const users = await userService.getAllUsers();
			res.json(users);
		} catch (error) {
			res.status(500).json({ error: "Gabim në marrjen e përdoruesve" });
		}
	},
};
