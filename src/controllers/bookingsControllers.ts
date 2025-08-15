import { Request, Response } from "express";
import { bookingModel, IBooking } from "../models/bookings";
import { OrderBy, Where } from "../../firebaseORM/assets/type";
import { userModel } from "../models/users";
import { packageScheduleModel } from "../models/packageSchedules";
import { packageModel } from "../models/packages";
import { destinationModel } from "../models/destinations";
import { fleetModel } from "../models/fleets";
import { paymentModel } from "../models/payments";
import { invoiceModel } from "../models/invoices";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Sama kayak di AuthController

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
        orderBy = "booking_date.asc",
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
        field: (orderBy as string).split(".")[0],
        direction: (orderBy as string).split(".")[1] as "asc" | "desc",
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

        const scheduleResults = await packageScheduleModel.search(
          "id",
          "==",
          d.package_schedule_id
        );

        let scheduleWithPackage = null;

        if (scheduleResults && scheduleResults.length > 0) {
          const pkg = await packageModel.search(
            "id",
            "==",
            scheduleResults[0].package_id
          );

          scheduleWithPackage = {
            ...scheduleResults[0],
            package: pkg && pkg.length > 0 ? pkg[0] : null,
          };
        }

        const newData = {
          ...d,
          user: user && user.length > 0 ? user[0] : null,
          schedule: scheduleWithPackage,
        };

        dataRelation.push(newData);
      }

      res.status(200).json({
        list: dataRelation,
        total: bookings.length,
        page: pageNumber,
        limit: limitNumber,
      });
    } catch (error) {
      console.log(error);
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

  async listForUser(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ msg: "No token provided" });
        return;
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        role: string;
        email: string;
      };

      const userId = decoded.id;

      const { page, limit, orderBy = "created_at_desc" } = req.query;

      const filters: Where[] = [
        { field: "user_id", operator: "==", value: userId },
      ];

      const orderByOptions: OrderBy = {
        field: (orderBy as string).split("_")[0],
        direction: (orderBy as string).split("_")[1] as "asc" | "desc",
      };

      const bookings = await bookingModel.searchWheres(filters, orderByOptions);

      // Get all related data for each booking
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          // User
          const [user] = await userModel.search("id", "==", booking.user_id);

          // Schedule
          const [schedule] = await packageScheduleModel.search(
            "id",
            "==",
            booking.package_schedule_id
          );

          // Package & Destinations
          let packageData = null;
          let destinations = [];
          if (schedule && schedule.package_id) {
            const [pkg] = await packageModel.search(
              "id",
              "==",
              schedule.package_id
            );
            packageData = pkg;
            if (pkg && Array.isArray(pkg.destination_ids)) {
              destinations = await Promise.all(
                pkg.destination_ids.map(async (destId: string) => {
                  const [dest] = await destinationModel.search(
                    "id",
                    "==",
                    destId
                  );
                  return dest || null;
                })
              );
            }
          }

          // Fleet
          let fleet = null;
          if (schedule && schedule.fleet_id) {
            const [flt] = await fleetModel.search(
              "id",
              "==",
              schedule.fleet_id
            );
            fleet = flt || null;
          }

          // Payments
          const payments = await paymentModel.search(
            "booking_id",
            "==",
            booking.id
          );

          // Invoices
          const invoices = await invoiceModel.search(
            "booking_id",
            "==",
            booking.id
          );

          return {
            ...booking,
            user: user || null,
            schedule: schedule
              ? {
                  ...schedule,
                  package: packageData
                    ? {
                        ...packageData,
                        destinations: destinations.filter(Boolean),
                      }
                    : null,
                  fleet: fleet,
                }
              : null,
            payments: payments || [],
            invoices: invoices || [],
          };
        })
      );

      // Apply pagination
      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedBookings = bookingsWithDetails.slice(startIndex, endIndex);

      res.status(200).json({
        list: paginatedBookings,
        total: bookings.length,
        page: pageNumber,
        limit: limitNumber,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch bookings" });
      console.log(error);
    }
  }

  async detailForUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      const bookings = await bookingModel.search("id", "==", id);

      if (!bookings[0]) {
        res.status(404).json({ msg: "Booking not found" });
        return;
      }

      const booking = bookings[0];

      // Verify booking belongs to user
      if (booking.user_id !== userId) {
        res.status(403).json({ msg: "Unauthorized to view this booking" });
        return;
      }

      // Get package and schedule details
      const [package_data] = await packageModel.search(
        "id",
        "==",
        booking.package_id
      );
      const [schedule_data] = await packageScheduleModel.search(
        "id",
        "==",
        booking.schedule_id
      );

      const bookingWithDetails = {
        ...booking,
        package_data,
        schedule_data,
      };

      res.status(200).json({ data: bookingWithDetails });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch booking details" });
    }
  }

  async createForUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { schedule_id, number_of_people, notes } = req.body;

      if (!schedule_id || !number_of_people) {
        res
          .status(400)
          .json({ msg: "Schedule ID and number of people are required" });
        return;
      }

      // Get schedule details
      const schedules = await packageScheduleModel.search(
        "id",
        "==",
        schedule_id
      );
      if (!schedules[0]) {
        res.status(404).json({ msg: "Schedule not found" });
        return;
      }

      const schedule = schedules[0];

      // Check available seats
      if (schedule.available_seats < number_of_people) {
        res.status(400).json({ msg: "Not enough available seats" });
        return;
      }

      // Get package details for price calculation
      const packages = await packageModel.search(
        "id",
        "==",
        schedule.package_id
      );
      if (!packages[0]) {
        res.status(404).json({ msg: "Package not found" });
        return;
      }

      const package_data = packages[0];

      // Calculate total price
      const total_price = package_data.price * number_of_people;

      // Create booking
      const newBooking: IBooking = {
        user_id: userId,
        package_schedule_id: schedule_id,
        booking_date: new Date().toISOString(),
        number_of_seats: number_of_people,
        total_price,
        payment_status: "pending",
        notes: notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const createdBooking = await bookingModel.create(newBooking);

      // Update available seats
      await packageScheduleModel.update(schedule_id, {
        ...schedule,
        available_seats: schedule.available_seats - number_of_people,
      });

      res.status(201).json({
        msg: "Booking created successfully",
        data: createdBooking,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to create booking" });
    }
  }
}

export const bookingController = new BookingController();
