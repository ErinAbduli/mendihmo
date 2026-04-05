import { Router } from "express";
import { campaignController } from "../controllers/campaign.controller.ts";
import { authRequired } from "../middleware/auth.middleware.ts";
import { validate } from "../middleware/validate.middleware.ts";
import { createCampaignSchema, updateCampaignSchema } from "../schema/campaign.schema.ts";

const router = Router();

router.get("/", campaignController.getAllCampaigns);
router.get("/:id", campaignController.getCampaignById);

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