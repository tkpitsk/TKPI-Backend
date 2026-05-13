import express from "express";
import {
    createBrand,
    getBrands,
    getBrandById,
    updateBrand,
    deleteBrand
} from "../controllers/brand.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

const router = express.Router();

/* Public Routes */
router.get("/", getBrands);
router.get("/:id", getBrandById);

/* Admin Routes */
router.use(authMiddleware);
router.use(requireRole("admin"));

router.post("/", createBrand);
router.put("/:id", updateBrand);
router.delete("/:id", deleteBrand);

export default router;
