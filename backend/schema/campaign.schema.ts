import { z } from "zod";

const mediaString = z.string().min(1, "Media URL nuk mund të jetë bosh");

export const createCampaignSchema = z.object({
	title: z.string().min(3, "Titulli duhet të ketë të paktën 3 karaktere"),
	slug: z.string().min(3, "Slug duhet të ketë të paktën 3 karaktere").optional(),
	description: z.string().min(10, "Përshkrimi duhet të ketë të paktën 10 karaktere"),
	goalAmount: z.number().positive("Objektivi duhet të jetë më i madh se 0"),
	currentAmount: z.number().min(0).optional(),
	currency: z.string().min(1).max(10).optional(),
	startDate: z.union([z.string(), z.date()]),
	endDate: z.union([z.string(), z.date()]),
	status: z.enum(["draft", "pending", "active", "funded", "failed"]).optional(),
	categoryId: z.number().int().positive().nullable().optional(),
	coverImage: mediaString.nullable().optional(),
	images: z.union([mediaString, z.array(mediaString)]).nullable().optional(),
	videoUrl: mediaString.nullable().optional(),
	backersCount: z.number().int().min(0).optional(),
	likesCount: z.number().int().min(0).optional(),
	viewsCount: z.number().int().min(0).optional(),
	isFeatured: z.boolean().optional(),
	isApproved: z.boolean().optional(),
});

export const updateCampaignSchema = createCampaignSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: "Të paktën një fushë duhet të dërgohet",
	});