import type { NextFunction, Request, Response, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { JWT_CONFIG } from "../config/jwt.config.ts";
import { prisma } from "../lib/prisma.ts";

export interface AuthenticatedRequest extends Request {
	userId: number;
}

type AccessTokenPayload = {
	userId: number | string;
};

const isAccessTokenPayload = (
	payload: unknown,
): payload is AccessTokenPayload => {
	return (
		typeof payload === "object" &&
		payload !== null &&
		"userId" in payload &&
		(typeof payload.userId === "string" ||
			typeof payload.userId === "number")
	);
};

export const authRequired: RequestHandler = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const token = authHeader.slice(7).trim();
	if (!token) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	try {
		const secret = JWT_CONFIG.access.secret;
		if (!secret) {
			return res
				.status(500)
				.json({ error: "Server configuration error" });
		}

		const payload = jwt.verify(token, secret);
		if (!isAccessTokenPayload(payload)) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		const parsedUserId =
			typeof payload.userId === "string"
				? Number.parseInt(payload.userId, 10)
				: payload.userId;

		if (!Number.isFinite(parsedUserId)) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		(req as AuthenticatedRequest).userId = parsedUserId;
		next();
	} catch {
		return res.status(401).json({ error: "Unauthorized" });
	}
};

export const isAdmin: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const userId = (req as AuthenticatedRequest).userId;

	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	try {
		const adminRole = await prisma.userRole.findFirst({
			where: {
				user_id: userId,
				role: {
					normalized_name: "ADMIN",
				},
			},
			select: {
				id: true,
			},
		});

		if (!adminRole) {
			return res.status(403).json({ error: "Forbidden" });
		}

		next();
	} catch {
		return res.status(500).json({ error: "Server error" });
	}
};
