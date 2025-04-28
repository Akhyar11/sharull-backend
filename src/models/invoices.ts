import { Schema } from "../../firebaseORM/assets/type.ts";
import FirebaseAdminService from "../../firebaseORM/FirebaseService.ts";

export interface IInvoice {
  booking_id: string;
  invoice_number: string;
  issued_date: string;
  due_date: string;
  status: "unpaid" | "paid";
  [key: string]: any;
}

export const InvoiceSchema: Schema = {
  booking_id: "string",
  invoice_number: "string",
  issued_date: "string",
  due_date: "string",
  status: "string",
};

// Initialize the FirebaseService for the 'invoices' collection
const invoiceModel = new FirebaseAdminService("invoices", InvoiceSchema);

export { invoiceModel };
