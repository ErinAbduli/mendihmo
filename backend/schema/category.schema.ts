import { z } from "zod";

export const createCategorySchema = z.object({
	name: z
		.string()
		.min(2, "Emri i kategorisë duhet të ketë të paktën 2 karaktere")
		.max(60, "Emri i kategorisë duhet të ketë maksimumi 60 karaktere"),
	slug: z
		.string()
		.min(2, "Slug-u duhet të ketë të paktën 2 karaktere")
		.max(80, "Slug-u duhet të ketë maksimumi 80 karaktere")
		.optional(),
});

export const updateCategorySchema = createCategorySchema;

export const updateCategoryStatusSchema = z.object({
	isActive: z.boolean(),
});
