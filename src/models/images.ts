import { Schema } from "../../firebaseORM/assets/type";
import FirebaseService from "../../firebaseORM/FirebaseService";
import { userModel } from "./users";

export interface IImage {
  id?: string;
  FK: string;
  image_base64: string;
}

export const ImageSchema: Schema = {
  FK: "string",
  image_base64: "string",
};

const imageModel = new FirebaseService("images", ImageSchema);

imageModel.setRelation("users", {
  model: userModel,
  type: "one-to-one",
  foreignKey: "image_id",
  localKey: "id",
  onDeleteNull: true,
});

export { imageModel };
