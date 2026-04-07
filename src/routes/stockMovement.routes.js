import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
    getStockMovements,
    getVariantMovement,
    adjustStock,
    getStockByVariant,
} from "../controllers/stockMovement.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

router.get("/", getStockMovements);
router.get("/variant/:variantId", getVariantMovement);
router.get("/stock/:variantId", getStockByVariant);
router.post("/adjust", adjustStock);

export default router;