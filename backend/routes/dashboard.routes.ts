import { Router } from "express";
import { getStats } from "../controllers/dashboard.controller.ts";
import { authRequired } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/stats", authRequired, getStats);

export default router;
