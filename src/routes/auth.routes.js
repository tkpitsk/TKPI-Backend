import express from "express";

import {
    login,
    refreshToken,
    logout,
    me
} from "../controllers/auth.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

/* ================= AUTH ================= */
router.post("/login", login);
router.post("/refresh", refreshToken);

/* ================= PROTECTED ================= */
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, me);

export default router;