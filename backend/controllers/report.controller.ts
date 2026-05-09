import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import { reportService } from "../services/report.service.ts";

export const reportController = {
	async createReport(req: Request, res: Response) {
		try {
			const { userId } = req as AuthenticatedRequest;
			if (!userId) {
				return res.status(401).json({ error: "Unauthorized" });
			}

			const report = await reportService.createReport(req.body, userId);
			return res.status(201).json({
				message: "Raporti u dërgua me sukses.",
				report,
			});
		} catch (error) {
			if (error instanceof Error && error.message === "Campaign not found") {
				return res.status(404).json({ error: "Fushata nuk u gjet." });
			}

			return res.status(500).json({
				error: "Dërgimi i raportit dështoi. Ju lutemi provoni përsëri.",
			});
		}
	},

	async getReports(_req: Request, res: Response) {
		try {
			const reports = await reportService.getAllReports();
			return res.json({ reports });
		} catch {
			return res.status(500).json({
				error: "Ngarkimi i raporteve dështoi. Ju lutemi provoni përsëri.",
			});
		}
	},
};