export const JWT_CONFIG = {
	access: {
		secret: process.env.JWT_ACCESS_SECRET!,
		expiresIn: "15m",
	},
	refresh: {
		secret: process.env.JWT_REFRESH_SECRET!,
		expiresIn: "7d",
	},
} as const;
