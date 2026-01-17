import { Router } from "express";
import { AddressController } from "./address.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const addressController = new AddressController();

/**
 * POST /api/v1/addresses
 * Create a new address
 */
router.post("/", authenticate, (req, res, next) =>
  addressController.createAddress(req, res, next),
);

/**
 * GET /api/v1/addresses
 * Get all addresses for logged-in user
 */
router.get("/", authenticate, (req, res, next) =>
  addressController.getUserAddresses(req, res, next),
);

/**
 * GET /api/v1/addresses/:id
 * Get a specific address
 */
router.get("/:id", authenticate, (req, res, next) =>
  addressController.getAddressById(req, res, next),
);

/**
 * PUT /api/v1/addresses/:id
 * Update an address
 */
router.put("/:id", authenticate, (req, res, next) =>
  addressController.updateAddress(req, res, next),
);

/**
 * DELETE /api/v1/addresses/:id
 * Delete an address
 */
router.delete("/:id", authenticate, (req, res, next) =>
  addressController.deleteAddress(req, res, next),
);

export default router;
