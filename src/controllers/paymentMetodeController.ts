import { Request, Response } from "express";
import { OrderBy, Where } from "../../firebaseORM/assets/type";
import { IPaymentMethod, paymentMethodModel } from "../models/paymentMetode";

class PaymentMethodController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page,
        limit,
        id,
        type,
        is_active,
        orderBy = "created_at.desc",
      } = req.query;

      const filters: Where[] = [];

      if (id) filters.push({ field: "id", operator: "==", value: id });
      if (type) filters.push({ field: "type", operator: "==", value: type });
      if (is_active !== undefined)
        filters.push({
          field: "is_active",
          operator: "==",
          value: is_active === "true",
        });

      const orderByOptions: OrderBy = {
        field: (orderBy as string).split(".")[0],
        direction: (orderBy as string).split(".")[1] as "asc" | "desc",
      };

      const items: IPaymentMethod[] = await paymentMethodModel.searchWheres(
        filters,
        orderByOptions
      );

      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedItems = items.slice(startIndex, endIndex);

      res.status(200).json({
        list: paginatedItems,
        total: items.length,
        page: pageNumber,
        limit: limitNumber,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch payment methods" });
    }
  }

  async store(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        provider,
        type,
        account_number,
        account_name,
        is_active = true,
      } = req.body;

      if (!name || !provider || !type || !account_number || !account_name) {
        res.status(400).json({ msg: "All fields are required" });
        return;
      }

      const now = new Date().toISOString();

      const newItem: IPaymentMethod = {
        name,
        provider,
        type,
        account_number,
        account_name,
        is_active,
      };

      await paymentMethodModel.create(newItem);

      res
        .status(201)
        .json({ msg: "Payment method created successfully", data: newItem });
    } catch (error) {
      res.status(500).json({ msg: "Failed to create payment method" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, provider, type, account_number, account_name, is_active } =
        req.body;

      const records = await paymentMethodModel.search("id", "==", id);
      if (!records[0]) {
        res.status(404).json({ msg: "Payment method not found" });
        return;
      }

      const current = records[0];
      const updated: IPaymentMethod = {
        ...current,
        name: name || current.name,
        provider: provider || current.provider,
        type: type || current.type,
        account_number: account_number || current.account_number,
        account_name: account_name || current.account_name,
        is_active: is_active !== undefined ? is_active : current.is_active,
      };

      await paymentMethodModel.update(id, updated);

      res
        .status(200)
        .json({ msg: "Payment method updated successfully", data: updated });
    } catch (error) {
      res.status(500).json({ msg: "Failed to update payment method" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const records = await paymentMethodModel.search("id", "==", id);
      if (!records[0]) {
        res.status(404).json({ msg: "Payment method not found" });
        return;
      }

      await paymentMethodModel.delete(id);
      res.status(200).json({ msg: "Payment method deleted successfully" });
    } catch (error) {
      res.status(500).json({ msg: "Failed to delete payment method" });
    }
  }

  async listForUser(req: Request, res: Response) {
    try {
      const { orderBy = "name_asc" } = req.query;

      const orderByOptions: OrderBy = {
        field: (orderBy as string).split("_")[0],
        direction: (orderBy as string).split("_")[1] as "asc" | "desc",
      };

      // Get all active payment methods
      const paymentMethods = await paymentMethodModel.searchWheres(
        [{ field: "is_active", operator: "==", value: true }],
        orderByOptions
      );

      res.status(200).json({
        list: paymentMethods,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch payment methods" });
    }
  }
}

export const paymentMethodController = new PaymentMethodController();
