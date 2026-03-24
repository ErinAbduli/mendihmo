import type { Request, Response } from "express";
import { authService } from "../services/auth.service.ts";

const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "strict" as const,
	maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const authController = {
	async register(req: Request, res: Response) {
		try {
			const { emri, mbiemri, email, password } = req.body;
			const { accessToken, refreshToken, user } =
				await authService.register(emri, mbiemri, email, password);
			res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
			res.status(201).json({ accessToken, user });
		} catch (error) {
			res.status(409).json({ error: (error as Error).message });
		}
	},

	async login(req: Request, res: Response) {
		try {
			const { email, password } = req.body;
			const { accessToken, refreshToken, user } = await authService.login(
				email,
				password,
			);
			res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
			res.json({ accessToken, user });
		} catch (error) {
			res.status(401).json({ error: (error as Error).message });
		}
	},

	async refresh(req: Request, res: Response) {
		try {
			const oldRefreshToken = req.cookies.refreshToken;
			if (!oldRefreshToken) {
				return res.status(401).json({ error: "Refresh token missing" });
			}

			const { accessToken, refreshToken, user } =
				await authService.refresh(oldRefreshToken);
			res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
			res.json({ accessToken, user });
		} catch (error) {
			res.clearCookie("refreshToken");
			res.status(401).json({ error: (error as Error).message });
		}
	},

	async logout(req: Request, res: Response) {
		try {
			const refreshToken = req.cookies.refreshToken;
			if (!refreshToken) {
				return res.status(400).json({ error: "Refresh token missing" });
			}
			await authService.logout(refreshToken);
			res.clearCookie("refreshToken");
			res.json({ message: "Logged out successfully" });
		} catch (error) {
			res.status(400).json({ error: (error as Error).message });
		}
	},
};
