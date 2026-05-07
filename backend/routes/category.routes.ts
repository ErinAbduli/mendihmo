import { Router } from "express";
import { categoryController } from "../controllers/category.controller.ts";
import { authRequired, isAdmin } from "../middleware/auth.middleware.ts";
import { validate } from "../middleware/validate.middleware.ts";
import {
	createCategorySchema,
	updateCategoryStatusSchema,
	updateCategorySchema,
} from "../schema/category.schema.ts";

const router = Router();

router.get("/", categoryController.getAllCategories);
router.post(
	"/",
	authRequired,
	isAdmin,
	validate(createCategorySchema),
	categoryController.createCategory,
);
router.put(
	"/:id",
	authRequired,
	isAdmin,
	validate(updateCategorySchema),
	categoryController.updateCategory,
);
router.patch(
	"/:id/status",
	authRequired,
	isAdmin,
	validate(updateCategoryStatusSchema),
	categoryController.updateCategoryStatus,
);
router.delete("/:id", authRequired, isAdmin, categoryController.deleteCategory);

export default router;