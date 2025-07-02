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
import { createImage } from "./imageController";

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

      let payment_proof_id = "";
      if (payment_proof) {
        payment_proof_id = await createImage(
          payment_proof as string,
          booking_id
        );
      }

      const newPayment: IPayment = {
        booking_id,
        payment_method_id,
        payment_date,
        payment_amount: parseFloat(payment_amount),
        payment_proof: payment_proof_id,
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

      let payment_proof_id = payment.payment_proof || "";
      if (payment_proof) {
        payment_proof_id = await createImage(payment_proof as string, id);
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
        payment_proof: payment_proof_id,
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

  async listForUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { page, limit, orderBy = "created_at_desc" } = req.query;

      // Get user's bookings first
      const bookings = await bookingModel.searchWheres([
        { field: "user_id", operator: "==", value: userId },
      ]);

      const booking_ids = bookings.map((booking) => booking.id);

      // Get payments for those bookings
      const filters: Where[] = [
        { field: "booking_id", operator: "in", value: booking_ids },
      ];

      const orderByOptions: OrderBy = {
        field: (orderBy as string).split("_")[0],
        direction: (orderBy as string).split("_")[1] as "asc" | "desc",
      };

      const payments = await paymentModel.searchWheres(filters, orderByOptions);

      // Get payment method details
      const paymentsWithDetails = await Promise.all(
        payments.map(async (payment) => {
          const [payment_method] = await paymentMethodModel.search(
            "id",
            "==",
            payment.payment_method_id
          );
          const [booking] = await bookingModel.search(
            "id",
            "==",
            payment.booking_id
          );

          return {
            ...payment,
            payment_method,
            booking,
          };
        })
      );

      // Apply pagination
      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedPayments = paymentsWithDetails.slice(startIndex, endIndex);

      res.status(200).json({
        list: paginatedPayments,
        total: payments.length,
        page: pageNumber,
        limit: limitNumber,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch payments" });
    }
  }

  async detailForUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      const payments = await paymentModel.search("id", "==", id);

      if (!payments[0]) {
        res.status(404).json({ msg: "Payment not found" });
        return;
      }

      const payment = payments[0];

      // Verify payment belongs to user's booking
      const [booking] = await bookingModel.search(
        "id",
        "==",
        payment.booking_id
      );
      if (!booking || booking.user_id !== userId) {
        res.status(403).json({ msg: "Unauthorized to view this payment" });
        return;
      }

      // Get payment method details
      const [payment_method] = await paymentMethodModel.search(
        "id",
        "==",
        payment.payment_method_id
      );

      const paymentWithDetails = {
        ...payment,
        payment_method,
        booking,
      };

      res.status(200).json({ data: paymentWithDetails });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch payment details" });
    }
  }

  async createForUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { booking_id, payment_method_id, amount, payment_proof } = req.body;

      if (!booking_id || !payment_method_id || !amount || !payment_proof) {
        res.status(400).json({ msg: "All fields are required" });
        return;
      }

      // Verify booking belongs to user
      const bookings = await bookingModel.search("id", "==", booking_id);
      if (!bookings[0]) {
        res.status(404).json({ msg: "Booking not found" });
        return;
      }

      const booking = bookings[0];
      if (booking.user_id !== userId) {
        res.status(403).json({ msg: "Unauthorized to pay for this booking" });
        return;
      }

      // Verify payment method exists and is active
      const paymentMethods = await paymentMethodModel.search(
        "id",
        "==",
        payment_method_id
      );
      if (!paymentMethods[0] || !paymentMethods[0].is_active) {
        res.status(400).json({ msg: "Invalid or inactive payment method" });
        return;
      }

      // Create payment
      const newPayment: IPayment = {
        booking_id,
        payment_method_id,
        payment_date: new Date().toISOString(),
        payment_amount: amount,
        payment_proof: "",
        status: "waiting_approval",
        is_approved: false,
        approved_by: "",
        approved_at: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const createdPayment = await paymentModel.create(newPayment);

      // Simpan image payment_proof jika ada
      let payment_proof_id = "";

      if (payment_proof) {
        const { id } = await createImage(payment_proof, createdPayment.id);
        payment_proof_id = id;
      }

      await paymentModel.update(createdPayment.id, {
        ...createdPayment,
        payment_proof: payment_proof_id,
      });

      // Update booking payment status
      await bookingModel.update(booking_id, {
        ...booking,
        payment_status: "waiting_approval",
        updated_at: new Date().toISOString(),
      });

      res.status(201).json({
        msg: "Payment created successfully",
        data: createdPayment,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Failed to create payment", error: error });
    }
  }
}

export const paymentController = new PaymentController();
