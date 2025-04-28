import { Schema } from "../../firebaseORM/assets/type.ts";
import FirebaseService from "../../firebaseORM/FirebaseService.ts";
import { packageScheduleModel } from "./packageSchedules.ts";

export interface IFleet {
  id?: string;
  name: string;
  type: "bus" | "van" | "car" | "motorcycle" | "boat";
  plate_number: string;
  capacity: number;
  driver_name: string;
  status: "available" | "maintenance" | "on_trip";
  [key: string]: any;
}

export const FleetSchema: Schema = {
  name: "string",
  type: "string",
  plate_number: "string",
  capacity: "number",
  driver_name: "string",
  status: "string",
};

const fleetModel = new FirebaseService("fleets", FleetSchema);

fleetModel.setRelation("package_schedules", {
  model: packageScheduleModel,
  type: "one-to-many",
  foreignKey: "fleet_id",
  localKey: "id",
});

// Export the model
export { fleetModel };
