import type { Request, Response } from "express";
import { stripe } from "../lib/stripe.ts";
import { checkoutService } from "../services/checkout.service.ts";
import type { MaybeAuthenticatedRequest } from "../middleware/auth.middleware.ts";

export const checkoutController = {
	async createCampaignCheckoutSession(req: Request, res: Response) {
		try {
			const userId = (req as MaybeAuthenticatedRequest).userId;
			const anonymous = Boolean(req.body.anonymous);

			const campaignId = req.params.id as string;
			const amount = Number(req.body.amount);
			const session = await checkoutService.createCampaignCheckoutSession(
				campaignId,
				amount,
				userId,
				anonymous,
				req.headers.origin,
			);

			return res.status(201).json({
				message: "Stripe checkout session u krijua me sukses.",
				...session,
			});
		} catch (error) {
			if (error instanceof Error && error.message === "Campaign not found") {
				return res.status(404).json({ error: "Fushata nuk u gjet." });
			}

			if (error instanceof Error && error.message === "Unauthorized") {
				return res.status(401).json({ error: "Duhet të hyni në llogari ose të zgjidhni donacion anonim." });
			}

			if (error instanceof Error && error.message.toLowerCase().includes("stripe checkout session could not be created")) {
				return res.status(500).json({ error: "Nuk u krijua checkout-i i Stripe." });
			}

			return res.status(500).json({
				error: "Krijimi i checkout-it dështoi. Ju lutemi provoni përsëri.",
			});
		}
	},

	async confirmCampaignCheckoutSession(req: Request, res: Response) {
		try {
			const campaignId = req.params.id as string;
			const sessionId = String(req.body.sessionId ?? "");
			const result = await checkoutService.confirmCampaignCheckoutSession(
				campaignId,
				sessionId,
			);

			return res.json({
				message: result.alreadyProcessed
					? "Pagesa ishte përpunuar më parë."
					: "Pagesa u përpunua me sukses.",
				...result,
			});
		} catch (error) {
			if (error instanceof Error && error.message === "Campaign not found") {
				return res.status(404).json({ error: "Fushata nuk u gjet." });
			}

			if (error instanceof Error && error.message === "Checkout session not paid") {
				return res.status(400).json({ error: "Checkout-i ende nuk është paguar." });
			}

			if (error instanceof Error && error.message === "Checkout session mismatch") {
				return res.status(400).json({ error: "Checkout-i nuk përputhet me këtë fushatë ose përdorues." });
			}

			return res.status(500).json({
				error: "Konfirmimi i pagesës dështoi. Ju lutemi provoni përsëri.",
			});
		}
	},

	async handleStripeWebhook(req: Request, res: Response) {
		const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
		if (!webhookSecret) {
			return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET is missing." });
		}

		const signature = req.headers["stripe-signature"];
		if (typeof signature !== "string") {
			return res.status(400).json({ error: "Missing Stripe signature." });
		}

		try {
			const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
			await checkoutService.processCheckoutWebhookEvent(event);
			return res.json({ received: true });
		} catch (error) {
			return res.status(400).json({
				error: error instanceof Error ? error.message : "Invalid webhook payload.",
			});
		}
	},
};