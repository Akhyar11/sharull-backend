import { Request, Response } from "express";
import { paymentModel, IPayment } from "../models/payments";
import { OrderBy, Where } from "../../firebaseORM/assets/type";
import { bookingModel, IBooking } from "../models/bookings";
import { IUser, userModel } from "../models/users";
import {
  IPackageSchedule,
  packageScheduleModel,
} from "../models/packageSchedules";
import { IPackage, packageModel } from "../models/packages";
import { IPaymentMethod, paymentMethodModel } from "../models/paymentMetode";

class PaymentController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page,
        limit,
        id,
        booking_id,
        payment_method_id,
        status,
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
      if (payment_method_id)
        filters.push({
          field: "payment_method_id",
          operator: "==",
          value: payment_method_id,
        });
      if (status)
        filters.push({ field: "status", operator: "==", value: status });

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
      const paginated = payments.slice(startIndex, startIndex + limitNumber);

      const relationData = [];

      for (let payment of paginated) {
        const bookings: IBooking[] = await bookingModel.search(
          "id",
          "==",
          payment.booking_id
        );
        const PMethode: IPaymentMethod[] = await paymentMethodModel.search(
          "id",
          "==",
          payment.payment_method_id
        );
        const relationDataBookings = [];
        for (let booking of bookings) {
          const user: IUser[] = await userModel.search(
            "id",
            "==",
            booking.user_id
          );
          const schedule: IPackageSchedule[] =
            await packageScheduleModel.search(
              "id",
              "==",
              booking.package_schedule_id
            );
          const shceduleWithPackage = [];
          for (let s of schedule) {
            const packages: IPackage[] = await packageModel.search(
              "id",
              "==",
              s.package_id
            );
            shceduleWithPackage.push({ ...schedule, package: packages[0] });
          }
          relationDataBookings.push({
            ...booking,
            user: user[0],
            schedule: shceduleWithPackage[0],
          });
        }

        relationData.push({
          ...payment,
          booking: relationDataBookings[0],
          payment_method: PMethode[0],
        });
      }

      res.status(200).json({
        list: relationData.map((p, i) => ({ no: i + 1 + startIndex, ...p })),
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
        payment_method_id,
        payment_amount,
        payment_proof,
      } = req.body;

      if (
        !booking_id ||
        !payment_date ||
        !payment_method_id ||
        !payment_amount ||
        !payment_proof
      ) {
        res.status(400).json({ msg: "All fields are required" });
        return;
      }

      const newPayment: IPayment = {
        booking_id,
        payment_method_id,
        payment_date,
        payment_amount: parseFloat(payment_amount),
        payment_proof,
        status: "pending",
        is_approved: false,
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
        payment_method_id,
        payment_amount,
        payment_proof,
        status,
      } = req.body;

      const payments = await paymentModel.search("id", "==", id);
      const payment = payments[0];

      if (!payment) {
        res.status(404).json({ msg: "Payment not found" });
        return;
      }

      const updatedPayment: IPayment = {
        ...payment,
        booking_id: booking_id || payment.booking_id,
        payment_date: payment_date || payment.payment_date,
        payment_method_id: payment_method_id || payment.payment_method_id,
        payment_amount:
          payment_amount !== undefined
            ? parseFloat(payment_amount)
            : payment.payment_amount,
        payment_proof: payment_proof || payment.payment_proof,
        status: status || payment.status,
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

  async approve(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { admin_id, approved } = req.body;

      if (!admin_id || approved === undefined) {
        res
          .status(400)
          .json({ msg: "admin_id and approved flag are required" });
        return;
      }

      const payments = await paymentModel.search("id", "==", id);
      const payment = payments[0];

      if (!payment) {
        res.status(404).json({ msg: "Payment not found" });
        return;
      }

      const now = new Date().toISOString();

      const updated: IPayment = {
        ...payment,
        status: approved ? "approved" : "rejected",
        is_approved: approved,
        approved_by: admin_id,
        approved_at: now,
      };

      await paymentModel.update(id, updated);
      res.status(200).json({
        msg: `Payment ${approved ? "approved" : "rejected"}`,
        data: updated,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to approve payment" });
    }
  }
}

export const paymentController = new PaymentController();
