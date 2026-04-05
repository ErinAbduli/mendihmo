import type { Request, Response } from "express";
import { categoryService } from "../services/category.service.ts";

export const categoryController = {
	async getAllCategories(_req: Request, res: Response) {
		try {
			const categories = await categoryService.getAllCategories();
			res.json(categories);
		} catch {
			res.status(500).json({ error: "Gabim në marrjen e kategorive" });
		}
	},
};