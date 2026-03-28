import { Router } from "express";
import { userController } from "../controllers/user.controller.ts";
import { authRequired, isAdmin } from "../middleware/auth.middleware.ts";
import { validate } from "../middleware/validate.middleware.ts";
import { createUserSchema, updateUserSchema } from "../schema/user.schema.ts";

const router = Router();

router.post(
	"/",
	authRequired,
	isAdmin,
	validate(createUserSchema),
	userController.createUser,
);
router.put(
	"/:id",
	authRequired,
	isAdmin,
	validate(updateUserSchema),
	userController.updateUser,
);
router.delete("/:id", authRequired, isAdmin, userController.deleteUser);
router.get("/:id", authRequired, userController.getUser);
router.get("/", authRequired, userController.getAllUsers);

export default router;
