import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";

import { getLedgerByEntity } from "../controllers/ledger.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:entityType/:entityId", getLedgerByEntity);

export default router;