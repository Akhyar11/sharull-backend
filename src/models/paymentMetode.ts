import { Schema } from "../../firebaseORM/assets/type";
import FirebaseService from "../../firebaseORM/FirebaseService";
import { paymentModel } from "./payments";

export interface IPaymentMethod {
  id?: string;
  name: string;
  provider: string;
  type: "bank_transfer" | "credit_card" | "e-wallet";
  account_number: string;
  account_name: string;
  is_active: boolean;
  [key: string]: any;
}

export const PaymentMethodSchema: Schema = {
  name: "string",
  provider: "string",
  type: "string", // You can add enum validation in your form/UI layer
  account_number: "string",
  account_name: "string",
  is_active: "boolean",
};

const paymentMethodModel = new FirebaseService(
  "payment_methods",
  PaymentMethodSchema
);

paymentMethodModel.setRelation("payments", {
  model: paymentModel,
  type: "one-to-many",
  foreignKey: "payment_method_id",
  localKey: "id",
});

export { paymentMethodModel };
