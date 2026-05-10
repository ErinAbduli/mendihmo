import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
	amount: z.coerce.number().positive("Shuma duhet të jetë më e madhe se 0.").max(100000, "Shuma është shumë e madhe."),
	anonymous: z.boolean().optional(),
});

export const confirmCheckoutSessionSchema = z.object({
	sessionId: z.string().min(1, "Session ID është i detyrueshëm."),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
export type ConfirmCheckoutSessionInput = z.infer<typeof confirmCheckoutSessionSchema>;