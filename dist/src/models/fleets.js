"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fleetModel = exports.FleetSchema = void 0;
const FirebaseService_1 = __importDefault(require("../../firebaseORM/FirebaseService"));
const packageSchedules_1 = require("./packageSchedules");
exports.FleetSchema = {
    name: "string",
    type: "string",
    plate_number: "string",
    capacity: "number",
    driver_name: "string",
    status: "string",
};
const fleetModel = new FirebaseService_1.default("fleets", exports.FleetSchema);
exports.fleetModel = fleetModel;
fleetModel.setRelation("package_schedules", {
    model: packageSchedules_1.packageScheduleModel,
    type: "one-to-many",
    foreignKey: "fleet_id",
    localKey: "id",
});
