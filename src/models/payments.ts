import { Schema } from "../../firebaseORM/assets/type";
import FirebaseService from "../../firebaseORM/FirebaseService";

export interface IPayment {
  id?: string;
  booking_id: string;
  payment_method_id: string;
  payment_date: string;
  payment_amount: number;
  payment_proof: string;
  status:
    | "pending"
    | "waiting_approval"
    | "approved"
    | "rejected"
    | "paid"
    | "cancelled";
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  [key: string]: any;
}

export const PaymentSchema: Schema = {
  booking_id: "string",
  payment_method_id: "string",
  payment_date: "string",
  payment_amount: "number",
  payment_proof: "string",
  status: "string",
  is_approved: "boolean",
  approved_by: "string",
  approved_at: "string",
};

const paymentModel = new FirebaseService("payments", PaymentSchema);

export { paymentModel };
