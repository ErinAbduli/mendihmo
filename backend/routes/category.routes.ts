import { Router } from "express";
import { categoryController } from "../controllers/category.controller.ts";

const router = Router();

router.get("/", categoryController.getAllCategories);

export default router;