export const validate = (schema: any) => {
	return (req: any, res: any, next: any) => {
		try {
			schema.parse(req.body);
			next();
		} catch (error) {
			res.status(400).json({ error: (error as Error).message });
		}
	};
};
