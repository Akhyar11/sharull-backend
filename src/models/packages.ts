import { Schema } from "../../firebaseORM/assets/type";
import FirebaseService from "../../firebaseORM/FirebaseService";
import { bookingModel } from "./bookings";
import { packageScheduleModel } from "./packageSchedules";

export interface IPackage {
  name: string;
  description: string;
  destination: string;
  price: number;
  available_seats: number;
  start_date: string;
  end_date: string;
  [key: string]: any;
}

export const PackageSchema: Schema = {
  name: "string",
  description: "string",
  destination: "string",
  price: "number",
  available_seats: "number",
  start_date: "string",
  end_date: "string",
};

const packageModel = new FirebaseService("packages", PackageSchema);

packageModel.setRelation("bookings", {
  model: bookingModel,
  type: "one-to-many",
  foreignKey: "package_id",
  localKey: "id",
});

packageModel.setRelation("package_schedules", {
  model: packageScheduleModel,
  type: "one-to-many",
  foreignKey: "package_id",
  localKey: "id",
});

export { packageModel };
