import type { Request, Response } from "express";
import { categoryService } from "../services/category.service.ts";

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Server error";
}

function sendError(res: Response, error: unknown) {
	const message = getErrorMessage(error);
	const normalizedMessage = message.toLowerCase();

	if (normalizedMessage.includes("nuk u gjet") || normalizedMessage.includes("not found")) {
		return res.status(404).json({ error: message });
	}

	if (
		normalizedMessage.includes("detyruesh") ||
		normalizedMessage.includes("pavlef") ||
		normalizedMessage.includes("invalid")
	) {
		return res.status(400).json({ error: message });
	}

	if (normalizedMessage.includes("nuk mund")) {
		return res.status(409).json({ error: message });
	}

	return res.status(500).json({ error: message });
}

export const categoryController = {
	async getAllCategories(req: Request, res: Response) {
		try {
			const includeDisabled =
				typeof req.query.includeDisabled === "string" &&
				req.query.includeDisabled.toLowerCase() === "true";
			const categories = await categoryService.getAllCategories(includeDisabled);
			res.json(categories);
		} catch (error) {
			sendError(res, error);
		}
	},

	async createCategory(req: Request, res: Response) {
		try {
			const category = await categoryService.createCategory(req.body);
			res.status(201).json(category);
		} catch (error) {
			sendError(res, error);
		}
	},

	async updateCategory(req: Request, res: Response) {
		try {
			const categoryId = req.params.id as string;
			const category = await categoryService.updateCategory(categoryId, req.body);
			res.json(category);
		} catch (error) {
			sendError(res, error);
		}
	},

	async updateCategoryStatus(req: Request, res: Response) {
		try {
			const categoryId = req.params.id as string;
			const category = await categoryService.updateCategoryStatus(categoryId, req.body);
			res.json(category);
		} catch (error) {
			sendError(res, error);
		}
	},

	async deleteCategory(req: Request, res: Response) {
		try {
			const categoryId = req.params.id as string;
			await categoryService.deleteCategory(categoryId);
			res.status(204).send();
		} catch (error) {
			sendError(res, error);
		}
	},
};