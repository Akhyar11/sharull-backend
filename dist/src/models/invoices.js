"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceModel = exports.InvoiceSchema = void 0;
const FirebaseService_1 = __importDefault(require("../../firebaseORM/FirebaseService"));
exports.InvoiceSchema = {
    booking_id: "string",
    invoice_number: "string",
    issued_date: "string",
    due_date: "string",
    status: "string",
};
// Initialize the FirebaseService for the 'invoices' collection
const invoiceModel = new FirebaseService_1.default("invoices", exports.InvoiceSchema);
exports.invoiceModel = invoiceModel;
