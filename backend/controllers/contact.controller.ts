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

	async listMessages(_req: Request, res: Response) {
		try {
			const contacts = await contactService.listMessages();
			res.status(200).json({ contacts });
		} catch {
			res.status(500).json({
				error: "Ngarkimi i mesazheve dështoi.",
			});
		}
	},

	async updateStatus(req: Request, res: Response) {
		const id = Number.parseInt(req.params.id, 10);
		const status = req.body?.status as "pending" | "in-progress" | "resolved" | undefined;

		if (!Number.isFinite(id)) {
			return res.status(400).json({ error: "ID e pavlefshme." });
		}

		if (!status || !["pending", "in-progress", "resolved"].includes(status)) {
			return res.status(400).json({ error: "Status i pavlefshëm." });
		}

		try {
			const updated = await contactService.updateStatus(id, status);
			if (!updated) {
				return res.status(404).json({ error: "Mesazhi nuk u gjet." });
			}

			return res.status(200).json({
				message: "Statusi u përditësua me sukses.",
				contact: updated,
			});
		} catch {
			return res.status(500).json({ error: "Përditësimi i statusit dështoi." });
		}
	},

	async deleteMessage(req: Request, res: Response) {
		const id = Number.parseInt(req.params.id, 10);

		if (!Number.isFinite(id)) {
			return res.status(400).json({ error: "ID e pavlefshme." });
		}

		try {
			const removed = await contactService.deleteMessage(id);
			if (!removed) {
				return res.status(404).json({ error: "Mesazhi nuk u gjet." });
			}

			return res.status(200).json({ message: "Mesazhi u fshi me sukses." });
		} catch {
			return res.status(500).json({ error: "Fshirja e mesazhit dështoi." });
		}
	},
};
