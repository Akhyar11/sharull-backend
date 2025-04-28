"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageScheduleModel = exports.PackageScheduleSchema = void 0;
const FirebaseService_1 = __importDefault(require("../../firebaseORM/FirebaseService"));
const bookings_1 = require("./bookings");
exports.PackageScheduleSchema = {
    package_id: "string",
    fleet_id: "string",
    departure_date: "string",
    return_date: "string",
    departure_time: "string",
    available_seats: "number",
};
const packageScheduleModel = new FirebaseService_1.default("package_schedules", exports.PackageScheduleSchema);
exports.packageScheduleModel = packageScheduleModel;
packageScheduleModel.setRelation("bookings", {
    model: bookings_1.bookingModel,
    type: "one-to-many",
    foreignKey: "booking_id",
    localKey: "id",
});
