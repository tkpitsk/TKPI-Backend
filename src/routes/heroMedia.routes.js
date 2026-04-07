import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";
import {
    uploadHeroMedia,
    getHeroMedia,
    reorderHeroMedia,
    deleteHeroMedia,
} from "../controllers/heroMedia.controller.js";

const router = express.Router();

/* Public (website) */
router.get("/", getHeroMedia);

/* Admin only */
router.use(authMiddleware);
router.use(requireRole("admin"));

router.post("/", upload.single("file"), uploadHeroMedia);
router.put("/reorder", reorderHeroMedia);
router.delete("/:id", deleteHeroMedia);

export default router;
