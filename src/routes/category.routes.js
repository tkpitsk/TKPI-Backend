import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

import {
    createCategory,
    getCategories,
    getCategoryBySlug,
    updateCategory,
    deactivateCategory
} from "../controllers/category.controller.js";

const router = express.Router();

/* PUBLIC ROUTES */

router.get("/", getCategories);
router.get("/slug/:slug", getCategoryBySlug);


/* ADMIN & MANAGER ROUTES */

router.post(
    "/",
    authMiddleware,
    requireRole("admin", "manager"),
    upload.single("image"),
    createCategory
);

router.put(
    "/:id",
    authMiddleware,
    requireRole("admin", "manager"),
    upload.single("image"),
    updateCategory
);

router.delete(
    "/:id",
    authMiddleware,
    requireRole("admin", "manager"),
    deactivateCategory
);

export default router;