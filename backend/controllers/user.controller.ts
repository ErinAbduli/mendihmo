import type { Request, Response } from "express";
import { userService } from "../services/user.service.ts";

export const userController = {
	async getUser(req: Request, res: Response) {
		try {
			const userId = req.params.id as string;
			const user = await userService.getUser(userId);
			res.json(user);
		} catch (error) {
			res.status(404).json({ error: (error as Error).message });
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
