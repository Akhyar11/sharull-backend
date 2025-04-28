"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageModel = exports.PackageSchema = void 0;
const FirebaseService_1 = __importDefault(require("../../firebaseORM/FirebaseService"));
const bookings_1 = require("./bookings");
const packageSchedules_1 = require("./packageSchedules");
exports.PackageSchema = {
    name: "string",
    description: "string",
    destination: "string",
    price: "number",
    available_seats: "number",
    start_date: "string",
    end_date: "string",
};
const packageModel = new FirebaseService_1.default("packages", exports.PackageSchema);
exports.packageModel = packageModel;
packageModel.setRelation("bookings", {
    model: bookings_1.bookingModel,
    type: "one-to-many",
    foreignKey: "package_id",
    localKey: "id",
});
packageModel.setRelation("package_schedules", {
    model: packageSchedules_1.packageScheduleModel,
    type: "one-to-many",
    foreignKey: "package_id",
    localKey: "id",
});
