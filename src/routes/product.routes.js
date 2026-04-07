import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

import auditMiddleware from "../audit/audit.middleware.js";
import { AUDIT_ACTIONS } from "../audit/audit.constants.js";

import {
  createProduct,
  createVariants,
  getProducts,
  getProductsAdmin,
  getProductBySlug,
  updateProduct,
  updateVariant,
  getVariantsByProduct,
  deactivateProduct,
  deactivateVariant
} from "../controllers/product.controller.js";

const router = express.Router();

/* ================= PUBLIC ================= */
router.get("/", getProducts);
router.get("/slug/:slug", getProductBySlug);

/* ================= ADMIN ================= */
router.use(authMiddleware);
router.use(requireRole("admin"));

router.get("/admin", getProductsAdmin);

router.post(
  "/",
  upload.array("images", 5),
  auditMiddleware({ action: AUDIT_ACTIONS.CREATE, entity: "PRODUCT" }),
  createProduct
);

router.post("/:productId/variants", createVariants);

/* Better route */
router.get("/variants/:productId", getVariantsByProduct);

router.put(
  "/:id",
  upload.array("images", 5),
  auditMiddleware({ action: AUDIT_ACTIONS.UPDATE, entity: "PRODUCT" }),
  updateProduct
);

router.put("/variants/:id", updateVariant);

router.patch(
  "/:id/deactivate",
  auditMiddleware({ action: AUDIT_ACTIONS.DELETE, entity: "PRODUCT" }),
  deactivateProduct
);

router.patch("/variants/:id/deactivate", deactivateVariant);

export default router;