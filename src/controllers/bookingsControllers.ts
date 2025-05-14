import { Request, Response } from "express";
import { bookingModel, IBooking } from "../models/bookings";
import { OrderBy, Where } from "../../firebaseORM/assets/type";
import { userModel } from "../models/users";
import { packageScheduleModel } from "../models/packageSchedules";
import { packageModel } from "../models/packages";

class BookingController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page,
        limit,
        id,
        user_id,
        package_schedule_id,
        payment_status,
        orderBy = "booking_date_asc",
      } = req.query;

      const filters: Where[] = [];

      if (id) filters.push({ field: "id", operator: "==", value: id });
      if (user_id)
        filters.push({ field: "user_id", operator: "==", value: user_id });
      if (package_schedule_id)
        filters.push({
          field: "package_schedule_id",
          operator: "==",
          value: package_schedule_id,
        });
      if (payment_status)
        filters.push({
          field: "payment_status",
          operator: "==",
          value: payment_status,
        });

      const orderByOptions: OrderBy = {
        field: (orderBy as string).split("_")[0],
        direction: (orderBy as string).split("_")[1] as "asc" | "desc",
      };

      const bookings: IBooking[] = await bookingModel.searchWheres(
        filters,
        orderByOptions
      );

      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedBookings = bookings.slice(startIndex, endIndex);

      const data = paginatedBookings.map((booking, index) => ({
        no: index + 1 + startIndex,
        ...booking,
      }));

      const dataRelation = [];

      for (let d of data) {
        const user = await userModel.search("id", "==", d.user_id);
        const schedule = (
          await packageScheduleModel.search("id", "==", d.package_schedule_id)
        ).map(async (d) => {
          const pkg = await packageModel.search("id", "==", d.package_id);
          return { ...d, package: pkg[0] };
        });

        const newData = { ...d, user: user[0], schedule: schedule[0] };
        dataRelation.push(newData);
      }

      res.status(200).json({
        list: dataRelation,
        total: bookings.length,
        page: pageNumber,
        limit: limitNumber,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch bookings" });
    }
  }

  async store(req: Request, res: Response): Promise<void> {
    try {
      const {
        user_id,
        package_schedule_id,
        booking_date,
        number_of_seats,
        total_price,
        payment_status,
      } = req.body;

      if (
        !user_id ||
        !package_schedule_id ||
        !booking_date ||
        !number_of_seats ||
        !total_price ||
        !payment_status
      ) {
        res.status(400).json({ msg: "All fields are required" });
        return;
      }

      const newBooking: IBooking = {
        user_id,
        package_schedule_id,
        booking_date,
        number_of_seats: parseInt(number_of_seats),
        total_price: parseFloat(total_price),
        payment_status,
      };

      await bookingModel.create(newBooking);
      res
        .status(201)
        .json({ msg: "Booking created successfully", data: newBooking });
    } catch (error) {
      res.status(500).json({ msg: "Failed to create booking" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        user_id,
        package_schedule_id,
        booking_date,
        number_of_seats,
        total_price,
        payment_status,
      } = req.body;

      const bookings = await bookingModel.search("id", "==", id);

      if (!bookings[0]) {
        res.status(404).json({ msg: "Booking not found" });
        return;
      }

      const updatedBooking: IBooking = {
        ...bookings[0],
        user_id: user_id || bookings[0].user_id,
        package_schedule_id:
          package_schedule_id || bookings[0].package_schedule_id,
        booking_date: booking_date || bookings[0].booking_date,
        number_of_seats:
          number_of_seats !== undefined
            ? parseInt(number_of_seats)
            : bookings[0].number_of_seats,
        total_price:
          total_price !== undefined
            ? parseFloat(total_price)
            : bookings[0].total_price,
        payment_status: payment_status || bookings[0].payment_status,
      };

      await bookingModel.update(id, updatedBooking);
      res
        .status(200)
        .json({ msg: "Booking updated successfully", data: updatedBooking });
    } catch (error) {
      res.status(500).json({ msg: "Failed to update booking" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const bookings = await bookingModel.search("id", "==", id);

      if (!bookings[0]) {
        res.status(404).json({ msg: "Booking not found" });
        return;
      }

      await bookingModel.deleteWithRelation(id);
      res.status(200).json({ msg: "Booking deleted successfully" });
    } catch (error) {
      res.status(500).json({ msg: "Failed to delete booking" });
    }
  }
}

export const bookingController = new BookingController();
