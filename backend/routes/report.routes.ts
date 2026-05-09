import { Router } from "express";
import { reportController } from "../controllers/report.controller.ts";
import { authRequired, isAdmin } from "../middleware/auth.middleware.ts";
import { validate } from "../middleware/validate.middleware.ts";
import { createReportSchema } from "../schema/report.schema.ts";

const router = Router();

router.post("/", authRequired, validate(createReportSchema), reportController.createReport);
router.get("/", authRequired, isAdmin, reportController.getReports);

export default router;