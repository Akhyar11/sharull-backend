import { Schema } from "../../firebaseORM/assets/type";
import FirebaseService from "../../firebaseORM/FirebaseService";
import { bookingModel } from "./bookings";

export interface IUser {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "admin" | "customer";
  [key: string]: any;
}

export const UserSchema: Schema = {
  name: "string",
  email: "string",
  password: "string",
  phone: "string",
  role: "string",
};

const userModel = new FirebaseService("users", UserSchema);

userModel.setRelation("bookings", {
  model: bookingModel,
  type: "one-to-many",
  foreignKey: "user_id",
  localKey: "id",
});

export { userModel };
