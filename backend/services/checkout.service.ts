import type Stripe from "stripe";
import { campaignService } from "./campaign.service.ts";
import { stripe } from "../lib/stripe.ts";
import { prisma } from "../lib/prisma.ts";
import { Prisma } from "../generated/prisma/client.ts";

function resolveFrontendOrigin(requestOrigin?: string) {
	return requestOrigin?.trim() || process.env.FRONTEND_URL || "http://localhost:5173";
}

async function finalizeSuccessfulCheckoutSession(
	campaignId: string,
	session: Stripe.Checkout.Session,
) {
	const campaign = await campaignService.getCampaignById(campaignId);
	const existingTransaction = await prisma.transaction.findUnique({
		where: { stripeSessionId: session.id },
		select: {
			id: true,
			amount: true,
			currency: true,
			createdAt: true,
		},
	});

	if (existingTransaction) {
		return {
			alreadyProcessed: true,
			amount: existingTransaction.amount,
			currency: existingTransaction.currency,
			createdAt: existingTransaction.createdAt,
		};
	}

	const sessionCampaignId = session.metadata?.campaignId;
	const sessionUserId = Number(session.metadata?.userId ?? session.client_reference_id ?? "");
	if (sessionCampaignId !== String(campaign.id) || !Number.isFinite(sessionUserId)) {
		throw new Error("Checkout session mismatch");
	}

	const amount = Number((session.amount_total ?? session.amount_subtotal ?? 0) / 100);
	if (!Number.isFinite(amount) || amount <= 0) {
		throw new Error("Invalid checkout amount");
	}

	if (session.payment_status !== "paid" && session.status !== "complete") {
		throw new Error("Checkout session not paid");
	}

	const currency = (session.currency || campaign.currency || "EUR").toUpperCase();

	try {
		const result = await prisma.$transaction(async (transaction) => {
			const createdTransaction = await transaction.transaction.create({
				data: {
					userId: sessionUserId,
					campaignId: campaign.id,
					amount,
					currency,
					status: "paid",
					paymentMethod: "stripe",
					stripeSessionId: session.id,
				},
				select: {
					id: true,
					amount: true,
					currency: true,
					status: true,
					createdAt: true,
				},
			});

			const contribution = await transaction.contribution.create({
				data: {
					userId: sessionUserId,
					campaignId: campaign.id,
					amount,
					paymentStatus: "paid",
				},
				select: {
					id: true,
					amount: true,
					paymentStatus: true,
					createdAt: true,
				},
			});

			await transaction.campaign.update({
				where: { id: campaign.id },
				data: {
					currentAmount: { increment: amount },
					backersCount: { increment: 1 },
				},
			});

			return { contribution, payment: createdTransaction };
		});

		return {
			alreadyProcessed: false,
			amount,
			currency,
			...result,
		};
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			const createdTransaction = await prisma.transaction.findUnique({
				where: { stripeSessionId: session.id },
				select: {
					id: true,
					amount: true,
					currency: true,
					createdAt: true,
				},
			});

			if (createdTransaction) {
				return {
					alreadyProcessed: true,
					amount: createdTransaction.amount,
					currency: createdTransaction.currency,
					createdAt: createdTransaction.createdAt,
				};
			}
		}

		throw error;
	}
}

export const checkoutService = {
	createCampaignCheckoutSession: async (
		campaignId: string,
		amount: number,
		userId: number,
		requestOrigin?: string,
	) => {
		const campaign = await campaignService.getCampaignById(campaignId);
		const frontendOrigin = resolveFrontendOrigin(requestOrigin);
		const currency = (campaign.currency || "EUR").toLowerCase();

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			payment_method_types: ["card"],
			client_reference_id: String(userId),
			line_items: [
				{
					quantity: 1,
					price_data: {
						currency,
						unit_amount: Math.round(amount * 100),
						product_data: {
							name: campaign.title,
							description: campaign.category?.name ? `Fushatë: ${campaign.category.name}` : "Fushatë bamirësie",
						},
					},
				},
			],
			success_url: `${frontendOrigin}/donate/${campaign.id}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${frontendOrigin}/donate/${campaign.id}?checkout=cancelled`,
			metadata: {
				campaignId: String(campaign.id),
				amount: String(amount),
				campaignTitle: campaign.title,
				userId: String(userId),
			},
			payment_intent_data: {
				metadata: {
					campaignId: String(campaign.id),
					amount: String(amount),
					campaignTitle: campaign.title,
					userId: String(userId),
				},
			},
		});

		if (!session.url) {
			throw new Error("Stripe checkout session could not be created.");
		}

		return {
			url: session.url,
			sessionId: session.id,
		};
	},
	confirmCampaignCheckoutSession: async (campaignId: string, sessionId: string) => {
		const session = await stripe.checkout.sessions.retrieve(sessionId);
		return finalizeSuccessfulCheckoutSession(campaignId, session);
	},
	processCheckoutWebhookEvent: async (event: Stripe.Event) => {
		if (event.type !== "checkout.session.completed") {
			return { ignored: true };
		}

		const session = event.data.object as Stripe.Checkout.Session;
		const campaignId = session.metadata?.campaignId;
		if (!campaignId) {
			throw new Error("Checkout session mismatch");
		}

		return finalizeSuccessfulCheckoutSession(campaignId, session);
	},
};