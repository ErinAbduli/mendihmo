import { ZodError, type ZodTypeAny } from "zod";

export const validate = (schema: ZodTypeAny) => {
	return (req: unknown, res: any, next: any) => {
		try {
			schema.parse((req as { body: unknown }).body);
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				const firstIssue = error.issues[0];
				const errorMessage = firstIssue?.message ?? "Të dhënat e dërguara nuk janë të vlefshme.";
				return res.status(400).json({ error: errorMessage });
			}

			return res.status(400).json({ error: (error as Error).message });
		}
	};
};
