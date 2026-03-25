import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_CONFIG } from "../config/jwt.config.ts";

export interface AuthenticatedRequest extends Request {
	userId: string;
}

type AccessTokenPayload = {
	userId: string;
};

const isAccessTokenPayload = (
	payload: unknown,
): payload is AccessTokenPayload => {
	return (
		typeof payload === "object" &&
		payload !== null &&
		"userId" in payload &&
		typeof payload.userId === "string"
	);
};

export const authRequired = (
	req: AuthenticatedRequest,
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
		req.userId = payload.userId;
		next();
	} catch {
		return res.status(401).json({ error: "Unauthorized" });
	}
};
