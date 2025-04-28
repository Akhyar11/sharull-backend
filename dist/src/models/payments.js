"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentModel = exports.PaymentSchema = void 0;
const FirebaseService_1 = __importDefault(require("../../firebaseORM/FirebaseService"));
exports.PaymentSchema = {
    booking_id: "string",
    payment_date: "string",
    payment_method: "string",
    payment_amount: "number",
    payment_proof: "string",
};
const paymentModel = new FirebaseService_1.default("payments", exports.PaymentSchema);
exports.paymentModel = paymentModel;
