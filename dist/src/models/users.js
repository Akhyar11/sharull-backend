"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = exports.UserSchema = void 0;
const FirebaseService_1 = __importDefault(require("../../firebaseORM/FirebaseService"));
const bookings_1 = require("./bookings");
exports.UserSchema = {
    name: "string",
    email: "string",
    password: "string",
    phone: "string",
    role: "string",
};
const userModel = new FirebaseService_1.default("users", exports.UserSchema);
exports.userModel = userModel;
userModel.setRelation("bookings", {
    model: bookings_1.bookingModel,
    type: "one-to-many",
    foreignKey: "user_id",
    localKey: "id",
});
