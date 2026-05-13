import express from "express";
import { 
    setSupplierBaseRate, 
    getSupplierRateMatrix, 
    getRateHistory 
} from "../controllers/supplierBaseRate.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

router.post("/", setSupplierBaseRate);
router.get("/matrix", getSupplierRateMatrix);
router.get("/history", getRateHistory);

export default router;
