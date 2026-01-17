import { prisma } from "../../config/prisma";
import { logger } from "../../utils/logger";
import { AppError } from "../../middlewares/error.middleware";
import { CreateAddressInput, UpdateAddressInput } from "./address.validation";

export class AddressService {
  /**
   * Create a new address for a user
   */
  async createAddress(userId: string, data: CreateAddressInput) {
    const address = await prisma.address.create({
      data: {
        userId,
        title: data.title,
        address: data.address,
      },
    });

    logger.info({ addressId: address.id, userId }, "Address created");
    return address;
  }

  /**
   * Get all addresses for a user
   */
  async getUserAddresses(userId: string) {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return addresses;
  }

  /**
   * Get a specific address by ID (with user scope validation)
   */
  async getAddressById(addressId: string, userId: string) {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new AppError(404, "Address not found");
    }

    if (address.userId !== userId) {
      throw new AppError(403, "You can only view your own addresses");
    }

    return address;
  }

  /**
   * Update an address (with user scope validation)
   */
  async updateAddress(addressId: string, userId: string, data: UpdateAddressInput) {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new AppError(404, "Address not found");
    }

    if (address.userId !== userId) {
      throw new AppError(403, "You can only update your own addresses");
    }

    const updateData: any = {};
    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.address !== undefined) {
      updateData.address = data.address;
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });

    logger.info({ addressId, userId }, "Address updated");
    return updatedAddress;
  }

  /**
   * Delete an address (with user scope validation)
   */
  async deleteAddress(addressId: string, userId: string) {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new AppError(404, "Address not found");
    }

    if (address.userId !== userId) {
      throw new AppError(403, "You can only delete your own addresses");
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    logger.info({ addressId, userId }, "Address deleted");
    return { message: "Address deleted successfully" };
  }
}
