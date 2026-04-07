import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
    createCompany,
    getCompanies,
    getCompanyById,
    updateCompany,
    deactivateCompany
} from "../controllers/company.controller.js";

const router = express.Router();

/* PUBLIC (optional) */
// router.get("/", getCompanies);

/* ADMIN ONLY */
router.use(authMiddleware);
router.use(requireRole("admin"));

router.post("/", createCompany);
router.get("/", getCompanies);
router.get("/:id", getCompanyById);
router.put("/:id", updateCompany);
router.patch("/:id/deactivate", deactivateCompany);

export default router;