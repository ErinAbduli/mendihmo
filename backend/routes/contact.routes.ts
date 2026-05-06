import { Router } from "express";
import { contactController } from "../controllers/contact.controller.ts";
import { validate } from "../middleware/validate.middleware.ts";
import { createContactSchema } from "../schema/contact.schema.ts";

const router = Router();

router.post("/", validate(createContactSchema), contactController.createMessage);

export default router;
