import { Router } from "express";
import { getTransactions } from "../controllers/transaction.controller.ts";
import { authRequired } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/", authRequired, getTransactions);

export default router;
