import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deactivateCustomer
} from "../controllers/customer.controller.js";

const router = express.Router();

/* ADMIN ONLY */
router.use(authMiddleware);
router.use(requireRole("admin"));

router.post("/", createCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.put("/:id", updateCustomer);
router.patch("/:id/deactivate", deactivateCustomer);

export default router;