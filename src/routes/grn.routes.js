import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
    createGRN,
    getGRNsByOrder,
    deactivateGRN
} from "../controllers/grn.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

router.post("/", createGRN);
router.get("/order/:purchaseOrderId", getGRNsByOrder);
router.patch("/:id/deactivate", deactivateGRN);

export default router;