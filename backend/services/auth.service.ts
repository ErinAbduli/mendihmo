import { prisma } from "../lib/prisma.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_CONFIG } from "../config/jwt.config.ts";

export const authService = {
	async register(
		name: string,
		mbiemri: string,
		email: string,
		password: string,
	) {
		const userExists = await prisma.user.findUnique({ where: { email } });
		if (userExists) {
			throw new Error("User already exists");
		}

		const hashedPassword = await bcrypt.hash(password, 12);

		const user = await prisma.user.create({
			data: {
				emri: name,
				mbiemri: mbiemri,
				email,
				password_hash: hashedPassword,
				statusi: "aktiv",
			},
		});

		return this.generateTokens({
			id: user.id,
			email: user.email,
			name: user.emri,
		});
	},

	async login(email: string, password: string) {
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			throw new Error("Invalid email or password");
		}

		const passwordMatch = await bcrypt.compare(
			password,
			user.password_hash,
		);
		if (!passwordMatch) {
			throw new Error("Invalid email or password");
		}

		return this.generateTokens({
			id: user.id,
			email: user.email,
			name: user.emri,
		});
	},

	async refresh(token: string) {
		let payload: { userId: number };
		try {
			payload = jwt.verify(token, JWT_CONFIG.refresh.secret) as {
				userId: number;
			};
		} catch {
			throw new Error("Invalid refresh token");
		}

		const storedToken = await prisma.refreshToken.findUnique({
			where: { token },
		});
		if (!storedToken || storedToken.expires < new Date()) {
			if (storedToken) {
				await prisma.refreshToken.delete({ where: { token } });
			}
			throw new Error("Refresh token expired or not found");
		}

		await prisma.refreshToken.delete({ where: { token } });

		const user = await prisma.user.findUnique({
			where: { id: payload.userId },
		});
		if (!user) {
			throw new Error("User not found");
		}

		return this.generateTokens({
			id: user.id,
			email: user.email,
			name: user.emri,
		});
	},

	async generateTokens(user: { id: number; email: string; name: string }) {
		const userId = user.id;
		const accessToken = jwt.sign({ userId }, JWT_CONFIG.access.secret, {
			expiresIn: JWT_CONFIG.access.expiresIn,
		});
		const refreshToken = jwt.sign({ userId }, JWT_CONFIG.refresh.secret, {
			expiresIn: JWT_CONFIG.refresh.expiresIn,
		});

		await prisma.refreshToken.create({
			data: {
				token: refreshToken,
				user_id: user.id,
				expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		});

		return {
			accessToken,
			refreshToken,
			user: { id: user.id, email: user.email, name: user.name },
		};
	},

	async logout(token: string) {
		await prisma.refreshToken.delete({ where: { token } });
	},
};
