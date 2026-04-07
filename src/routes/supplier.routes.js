import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deactivateSupplier
} from "../controllers/supplier.controller.js";

const router = express.Router();

/* ADMIN ONLY */
router.use(authMiddleware);
router.use(requireRole("admin"));

router.post("/", createSupplier);
router.get("/", getSuppliers);
router.get("/:id", getSupplierById);
router.put("/:id", updateSupplier);
router.patch("/:id/deactivate", deactivateSupplier);

export default router;