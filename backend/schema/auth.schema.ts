import { z } from "zod";

export const registerSchema = z.object({
	emri: z
		.string()
		.min(3, "Emri duhet të ketë të paktën 3 karaktere")
		.max(20, "Emri duhet të ketë më pak se 20 karaktere"),
	mbiemri: z
		.string()
		.min(3, "Mbiemri duhet të ketë të paktën 3 karaktere")
		.max(20, "Mbiemri duhet të ketë më pak se 20 karaktere"),
	email: z.email("Ju lutemi vendosni një email të vlefshme"),
	password: z
		.string()
		.min(6, "Fjalëkalimi duhet të ketë të paktën 6 karaktere")
		.max(100, "Fjalëkalimi duhet të ketë më pak se 100 karaktere"),
});

export const loginSchema = z.object({
	email: z.email("Ju lutemi vendosni një email të vlefshme"),
	password: z
		.string()
		.min(6, "Fjalëkalimi duhet të ketë të paktën 6 karaktere"),
});
