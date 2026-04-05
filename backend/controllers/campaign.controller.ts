import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import { campaignService } from "../services/campaign.service.ts";

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Server error";
}

function sendError(res: Response, error: unknown) {
	const message = getErrorMessage(error);
	const normalizedMessage = message.toLowerCase();

	if (normalizedMessage.includes("not found")) {
		return res.status(404).json({ error: message });
	}

	if (
		normalizedMessage.includes("exists") ||
		normalizedMessage.includes("required") ||
		normalizedMessage.includes("must be") ||
		normalizedMessage.includes("invalid")
	) {
		return res.status(400).json({ error: message });
	}

	if (
		normalizedMessage.includes("not allowed") ||
		normalizedMessage.includes("forbidden") ||
		normalizedMessage.includes("unauthorized")
	) {
		return res.status(403).json({ error: message });
	}

	return res.status(500).json({ error: message });
}

export const campaignController = {
	async createCampaign(req: Request, res: Response) {
		try {
			const userId = (req as AuthenticatedRequest).userId;
			const campaign = await campaignService.createCampaign(userId, req.body);
			res.status(201).json(campaign);
		} catch (error) {
			sendError(res, error);
		}
	},

	async updateCampaign(req: Request, res: Response) {
		try {
			const userId = (req as AuthenticatedRequest).userId;
			const campaignId = req.params.id as string;
			const campaign = await campaignService.updateCampaign(userId, campaignId, req.body);
			res.json(campaign);
		} catch (error) {
			sendError(res, error);
		}
	},

	async deleteCampaign(req: Request, res: Response) {
		try {
			const userId = (req as AuthenticatedRequest).userId;
			const campaignId = req.params.id as string;
			await campaignService.deleteCampaign(userId, campaignId);
			res.status(204).send();
		} catch (error) {
			sendError(res, error);
		}
	},

	async getCampaignById(req: Request, res: Response) {
		try {
			const campaignId = req.params.id as string;
			const campaign = await campaignService.getCampaignById(campaignId);
			res.json(campaign);
		} catch (error) {
			sendError(res, error);
		}
	},

	async getAllCampaigns(_req: Request, res: Response) {
		try {
			const campaigns = await campaignService.getAllCampaigns();
			res.json(campaigns);
		} catch (error) {
			sendError(res, error);
		}
	},
};