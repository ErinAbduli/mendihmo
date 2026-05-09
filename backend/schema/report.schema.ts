import { z } from "zod";

export const createReportSchema = z.object({
	targetType: z.literal("campaign"),
	targetId: z.coerce.number().int().positive("Zgjidhni një fushatë të vlefshme."),
	reason: z.string().trim().min(3, "Zgjidhni një arsye të vlefshme."),
	message: z.string().trim().min(10, "Mesazhi duhet të ketë të paktën 10 karaktere."),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;