"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingController = void 0;
const bookings_1 = require("../models/bookings");
class BookingController {
    async list(req, res) {
        try {
            const { page, limit, id, user_id, package_schedule_id, payment_status, orderBy = "booking_date_asc", } = req.query;
            const filters = [];
            if (id)
                filters.push({ field: "id", operator: "==", value: id });
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
            const orderByOptions = {
                field: orderBy.split("_")[0],
                direction: orderBy.split("_")[1],
            };
            const bookings = await bookings_1.bookingModel.searchWheres(filters, orderByOptions);
            const pageNumber = parseInt(page) || 1;
            const limitNumber = parseInt(limit) || 10;
            const startIndex = (pageNumber - 1) * limitNumber;
            const endIndex = startIndex + limitNumber;
            const paginatedBookings = bookings.slice(startIndex, endIndex);
            const data = paginatedBookings.map((booking, index) => ({
                no: index + 1 + startIndex,
                ...booking,
            }));
            res.status(200).json({
                list: data,
                total: bookings.length,
                page: pageNumber,
                limit: limitNumber,
            });
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to fetch bookings" });
        }
    }
    async store(req, res) {
        try {
            const { user_id, package_schedule_id, booking_date, number_of_seats, total_price, payment_status, } = req.body;
            if (!user_id ||
                !package_schedule_id ||
                !booking_date ||
                !number_of_seats ||
                !total_price ||
                !payment_status) {
                res.status(400).json({ msg: "All fields are required" });
                return;
            }
            const newBooking = {
                user_id,
                package_schedule_id,
                booking_date,
                number_of_seats: parseInt(number_of_seats),
                total_price: parseFloat(total_price),
                payment_status,
            };
            await bookings_1.bookingModel.create(newBooking);
            res
                .status(201)
                .json({ msg: "Booking created successfully", data: newBooking });
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to create booking" });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const { user_id, package_schedule_id, booking_date, number_of_seats, total_price, payment_status, } = req.body;
            const bookings = await bookings_1.bookingModel.search("id", "==", id);
            if (!bookings[0]) {
                res.status(404).json({ msg: "Booking not found" });
                return;
            }
            const updatedBooking = {
                ...bookings[0],
                user_id: user_id || bookings[0].user_id,
                package_schedule_id: package_schedule_id || bookings[0].package_schedule_id,
                booking_date: booking_date || bookings[0].booking_date,
                number_of_seats: number_of_seats !== undefined
                    ? parseInt(number_of_seats)
                    : bookings[0].number_of_seats,
                total_price: total_price !== undefined
                    ? parseFloat(total_price)
                    : bookings[0].total_price,
                payment_status: payment_status || bookings[0].payment_status,
            };
            await bookings_1.bookingModel.update(id, updatedBooking);
            res
                .status(200)
                .json({ msg: "Booking updated successfully", data: updatedBooking });
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to update booking" });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            const bookings = await bookings_1.bookingModel.search("id", "==", id);
            if (!bookings[0]) {
                res.status(404).json({ msg: "Booking not found" });
                return;
            }
            await bookings_1.bookingModel.deleteWithRelation(id);
            res.status(200).json({ msg: "Booking deleted successfully" });
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to delete booking" });
        }
    }
}
exports.bookingController = new BookingController();
