import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import {
    giveAdvance,
    getAdvances,
    getMyAdvances,
} from "../controllers/advance.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
    "/",
    requireRole("admin", "manager"),
    giveAdvance
);

router.get(
    "/",
    requireRole("admin", "manager"),
    getAdvances
);

router.get("/me", getMyAdvances); // 👈 NEW

export default router;
