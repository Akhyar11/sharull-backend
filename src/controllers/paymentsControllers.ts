import { Request, Response } from "express";
import { paymentModel, IPayment } from "../models/payments";
import { OrderBy, Where } from "../../firebaseORM/assets/type";

class PaymentController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page,
        limit,
        id,
        booking_id,
        payment_method,
        orderBy = "payment_date_desc",
      } = req.query;

      const filters: Where[] = [];

      if (id) filters.push({ field: "id", operator: "==", value: id });
      if (booking_id)
        filters.push({
          field: "booking_id",
          operator: "==",
          value: booking_id,
        });
      if (payment_method)
        filters.push({
          field: "payment_method",
          operator: "==",
          value: payment_method,
        });

      const orderByOptions: OrderBy = {
        field: (orderBy as string).split("_")[0],
        direction: (orderBy as string).split("_")[1] as "asc" | "desc",
      };

      const payments: IPayment[] = await paymentModel.searchWheres(
        filters,
        orderByOptions
      );

      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedPayments = payments.slice(startIndex, endIndex);

      const data = paginatedPayments.map((payment, index) => ({
        no: index + 1 + startIndex,
        ...payment,
      }));

      res.status(200).json({
        list: data,
        total: payments.length,
        page: pageNumber,
        limit: limitNumber,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch payments" });
    }
  }

  async store(req: Request, res: Response): Promise<void> {
    try {
      const {
        booking_id,
        payment_date,
        payment_method,
        payment_amount,
        payment_proof,
      } = req.body;

      if (
        !booking_id ||
        !payment_date ||
        !payment_method ||
        !payment_amount ||
        !payment_proof
      ) {
        res.status(400).json({ msg: "All fields are required" });
        return;
      }

      const newPayment: IPayment = {
        booking_id,
        payment_date,
        payment_method,
        payment_amount: parseFloat(payment_amount),
        payment_proof,
        created_at: new Date().toISOString(),
      };

      await paymentModel.create(newPayment);
      res
        .status(201)
        .json({ msg: "Payment created successfully", data: newPayment });
    } catch (error) {
      res.status(500).json({ msg: "Failed to create payment" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        booking_id,
        payment_date,
        payment_method,
        payment_amount,
        payment_proof,
      } = req.body;

      const payments = await paymentModel.search("id", "==", id);

      if (!payments[0]) {
        res.status(404).json({ msg: "Payment not found" });
        return;
      }

      const updatedPayment: IPayment = {
        ...payments[0],
        booking_id: booking_id || payments[0].booking_id,
        payment_date: payment_date || payments[0].payment_date,
        payment_method: payment_method || payments[0].payment_method,
        payment_amount:
          payment_amount !== undefined
            ? parseFloat(payment_amount)
            : payments[0].payment_amount,
        payment_proof: payment_proof || payments[0].payment_proof,
        created_at: payments[0].created_at,
      };

      await paymentModel.update(id, updatedPayment);
      res
        .status(200)
        .json({ msg: "Payment updated successfully", data: updatedPayment });
    } catch (error) {
      res.status(500).json({ msg: "Failed to update payment" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const payments = await paymentModel.search("id", "==", id);

      if (!payments[0]) {
        res.status(404).json({ msg: "Payment not found" });
        return;
      }

      await paymentModel.delete(id);
      res.status(200).json({ msg: "Payment deleted successfully" });
    } catch (error) {
      res.status(500).json({ msg: "Failed to delete payment" });
    }
  }
}

export const paymentController = new PaymentController();
