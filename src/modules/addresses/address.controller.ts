import { Response, NextFunction } from "express";
import { AddressService } from "./address.service";
import { createAddressSchema, updateAddressSchema } from "./address.validation";
import { ResponseHandler } from "../../utils/response";
import { AuthRequest } from "../../middlewares/auth.middleware";

const addressService = new AddressService();

export class AddressController {
  /**
   * POST /api/v1/addresses
   * Create a new address for the logged-in user
   */
  async createAddress(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const data = createAddressSchema.parse(req.body);
      const address = await addressService.createAddress(req.userId, data);
      ResponseHandler.created(res, address, "Address created successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/addresses
   * Get all addresses for the logged-in user
   */
  async getUserAddresses(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const addresses = await addressService.getUserAddresses(req.userId);
      ResponseHandler.success(res, addresses);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/addresses/:id
   * Get a specific address by ID
   */
  async getAddressById(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const { id } = req.params as { id: string };
      const address = await addressService.getAddressById(id, req.userId);
      ResponseHandler.success(res, address);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/addresses/:id
   * Update a specific address
   */
  async updateAddress(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const { id } = req.params as { id: string };
      const data = updateAddressSchema.parse(req.body);
      const address = await addressService.updateAddress(id, req.userId, data);
      ResponseHandler.success(res, address, "Address updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/addresses/:id
   * Delete a specific address
   */
  async deleteAddress(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const { id } = req.params as { id: string };
      const result = await addressService.deleteAddress(id, req.userId);
      ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
