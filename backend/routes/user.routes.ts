import { Router } from "express";
import { userController } from "../controllers/user.controller.ts";
import { authRequired } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/:id", authRequired, userController.getUser);
router.get("/", authRequired, userController.getAllUsers);

export default router;
