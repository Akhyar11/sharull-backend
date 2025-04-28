import { Schema } from "../../firebaseORM/assets/type";
import FirebaseService from "../../firebaseORM/FirebaseService";
import { invoiceModel } from "./invoices";
import { paymentModel } from "./payments";

export interface IBooking {
  id?: string;
  user_id: string;
  package_schedule_id: string;
  booking_date: string;
  number_of_seats: number;
  total_price: number;
  payment_status: "pending" | "paid" | "cancelled";
  [key: string]: any;
}

export const BookingSchema: Schema = {
  user_id: "string",
  package_schedule_id: "string",
  booking_date: "string",
  number_of_seats: "number",
  total_price: "number",
  payment_status: "string",
};

const bookingModel = new FirebaseService("bookings", BookingSchema);

bookingModel.setRelation("payments", {
  model: paymentModel,
  type: "one-to-many",
  foreignKey: "booking_id",
  localKey: "id",
});

bookingModel.setRelation("invoices", {
  model: invoiceModel,
  type: "one-to-many",
  foreignKey: "booking_id",
  localKey: "id",
});

export { bookingModel };
