import { Schema } from "../../firebaseORM/assets/type";
import FirebaseService from "../../firebaseORM/FirebaseService";
import { bookingModel } from "./bookings";
import { imageModel } from "./images";

export interface IUser {
  name: string;
  image_id: string;
  email: string;
  password: string;
  phone: string;
  role: "admin" | "customer" | "user";
  reset_token?: string;
  reset_token_expires?: string;
  // gemini_api_key: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export const UserSchema: Schema = {
  name: "string",
  image_id: "string",
  email: "string",
  password: "string",
  phone: "string",
  role: "string",
  reset_token: "string",
  reset_token_expires: "string",
  // gemini_api_key: "string",
  created_at: "string",
  updated_at: "string",
};

const userModel = new FirebaseService("users", UserSchema);

userModel.setRelation("bookings", {
  model: bookingModel,
  type: "one-to-many",
  foreignKey: "user_id",
  localKey: "id",
});

userModel.setRelation("image", {
  model: imageModel,
  type: "one-to-many",
  foreignKey: "FK",
  localKey: "id",
});

export { userModel };
