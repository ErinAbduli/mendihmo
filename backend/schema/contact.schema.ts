import { z } from "zod";

export const createContactSchema = z.object({
	name: z.string().trim().min(2, "Emri duhet të ketë të paktën 2 karaktere"),
	email: z
		.string()
		.trim()
		.email("Email-i nuk është i vlefshëm"),
	subject: z.string().trim().min(3, "Subjekti duhet të ketë të paktën 3 karaktere"),
	message: z.string().trim().min(10, "Mesazhi duhet të ketë të paktën 10 karaktere"),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
