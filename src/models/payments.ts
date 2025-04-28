import { Schema } from "../../firebaseORM/assets/type.ts";
import FirebaseService from "../../firebaseORM/FirebaseService.ts";

export interface IPayment {
  booking_id: string;
  payment_date: string;
  payment_method: "bank_transfer" | "credit_card" | "e-wallet";
  payment_amount: number;
  payment_proof: string;
  [key: string]: any;
}

export const PaymentSchema: Schema = {
  booking_id: "string",
  payment_date: "string",
  payment_method: "string",
  payment_amount: "number",
  payment_proof: "string",
};

const paymentModel = new FirebaseService("payments", PaymentSchema);

export { paymentModel };
