import type { Request, Response } from "express";
import { contactService } from "../services/contact.service.ts";

export const contactController = {
	async createMessage(req: Request, res: Response) {
		try {
			const message = await contactService.createMessage(req.body);
			res.status(201).json({
				message: "Mesazhi u pranua me sukses.",
				contact: message,
			});
		} catch {
			res.status(500).json({
				error: "Dërgimi i mesazhit dështoi. Ju lutemi provoni përsëri.",
			});
		}
	},
};
