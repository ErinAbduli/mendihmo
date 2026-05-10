import { Router } from "express";
import { checkoutController } from "../controllers/checkout.controller.ts";
import { campaignController } from "../controllers/campaign.controller.ts";
import { authOptional, authRequired } from "../middleware/auth.middleware.ts";
import { validate } from "../middleware/validate.middleware.ts";
import { confirmCheckoutSessionSchema, createCheckoutSessionSchema } from "../schema/checkout.schema.ts";
import { createCampaignSchema, updateCampaignSchema } from "../schema/campaign.schema.ts";

const router = Router();

router.get("/", campaignController.getAllCampaigns);
router.get("/:id", campaignController.getCampaignById);
router.post("/:id/checkout-session", authOptional, validate(createCheckoutSessionSchema), checkoutController.createCampaignCheckoutSession);
router.post("/:id/checkout-session/confirm", validate(confirmCheckoutSessionSchema), checkoutController.confirmCampaignCheckoutSession);

router.post(
	"/",
	authRequired,
	validate(createCampaignSchema),
	campaignController.createCampaign,
);
router.put(
	"/:id",
	authRequired,
	validate(updateCampaignSchema),
	campaignController.updateCampaign,
);
router.delete("/:id", authRequired, campaignController.deleteCampaign);

export default router;