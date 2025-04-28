"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingModel = exports.BookingSchema = void 0;
const FirebaseService_1 = __importDefault(require("../../firebaseORM/FirebaseService"));
const invoices_1 = require("./invoices");
const payments_1 = require("./payments");
exports.BookingSchema = {
    user_id: "string",
    package_schedule_id: "string",
    booking_date: "string",
    number_of_seats: "number",
    total_price: "number",
    payment_status: "string",
};
const bookingModel = new FirebaseService_1.default("bookings", exports.BookingSchema);
exports.bookingModel = bookingModel;
bookingModel.setRelation("payments", {
    model: payments_1.paymentModel,
    type: "one-to-many",
    foreignKey: "booking_id",
    localKey: "id",
});
bookingModel.setRelation("invoices", {
    model: invoices_1.invoiceModel,
    type: "one-to-many",
    foreignKey: "booking_id",
    localKey: "id",
});
