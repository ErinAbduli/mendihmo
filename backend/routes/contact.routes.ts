import { Router } from "express";
import { contactController } from "../controllers/contact.controller.ts";
import { validate } from "../middleware/validate.middleware.ts";
import { createContactSchema } from "../schema/contact.schema.ts";
import { authRequired } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/", validate(createContactSchema), contactController.createMessage);
router.get("/", authRequired, contactController.listMessages);
router.patch("/:id/status", authRequired, contactController.updateStatus);
router.delete("/:id", authRequired, contactController.deleteMessage);

export default router;
