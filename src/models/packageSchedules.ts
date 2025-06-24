import { Schema } from "../../firebaseORM/assets/type";
import FirebaseService from "../../firebaseORM/FirebaseService";
import { bookingModel } from "./bookings";

export interface IPackageSchedule {
  id?: string;
  package_id: string; // Reference to packages.id
  destination_ids: string[]; // Reference to destinations.id (multiple)
  fleet_id: string; // Reference to fleets.id
  departure_date: string; // Format: YYYY-MM-DD
  return_date: string; // Format: YYYY-MM-DD
  departure_time: string; // Format: HH:mm:ss
  available_seats: number;
  [key: string]: any;
}

export const PackageScheduleSchema: Schema = {
  package_id: "string",
  destination_ids: ["string"],
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
