import { Router } from "express";
import { authController } from "../controllers/auth.controller.ts";
import { validate } from "../middleware/validate.middleware.ts";
import { registerSchema, loginSchema } from "../schema/auth.schema.ts";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

export default router;
