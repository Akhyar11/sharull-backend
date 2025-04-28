import { Schema } from "../../firebaseORM/assets/type.ts";
import FirebaseService from "../../firebaseORM/FirebaseService.ts";
import { bookingModel } from "./bookings.ts";

export interface IPackageSchedule {
  id?: string;
  package_id: string; // Reference to packages.id
  fleet_id: string; // Reference to fleets.id
  departure_date: string; // Format: YYYY-MM-DD
  return_date: string; // Format: YYYY-MM-DD
  departure_time: string; // Format: HH:mm:ss
  available_seats: number;
  [key: string]: any;
}

export const PackageScheduleSchema: Schema = {
  package_id: "string",
  fleet_id: "string",
  departure_date: "string",
  return_date: "string",
  departure_time: "string",
  available_seats: "number",
};

const packageScheduleModel = new FirebaseService(
  "package_schedules",
  PackageScheduleSchema
);

packageScheduleModel.setRelation("bookings", {
  model: bookingModel,
  type: "one-to-many",
  foreignKey: "booking_id",
  localKey: "id",
});

// Export the model
export { packageScheduleModel };
