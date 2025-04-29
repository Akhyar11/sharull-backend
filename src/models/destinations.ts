import { Schema } from "../../firebaseORM/assets/type";
import FirebaseService from "../../firebaseORM/FirebaseService";
import { imageModel } from "./images";
import { packageModel } from "./packages";

export interface IDestination {
  id?: string;
  name: string;
  slug: string;
  description: string;
  location_point: string; // point -> stored as string or [lat, lng]
  province: string;
  city: string;
  country: string;
  category:
    | "mountain"
    | "beach"
    | "culture"
    | "urban"
    | "lake"
    | "forest"
    | "other";
  popularity: number;
  featured: boolean;
  image_id: string;
  gallery: string; // json -> stored as stringified JSON array
  average_rating: number;
  review_count: number;
  is_active: boolean;
  meta_keywords: string; // could be a comma-separated string or JSON array
  meta_description: string;
  created_at?: string;
  updated_at?: string;
}

export const DestinationSchema: Schema = {
  id: "string",
  name: "string",
  slug: "string",
  description: "string",
  location_point: "string", // e.g., '{"lat": -6.123, "lng": 106.456}'
  province: "string",
  city: "string",
  country: "string",
  category: "string",
  popularity: "number",
  featured: "boolean",
  image_id: "string",
  gallery: "string", // JSON.stringify([...])
  average_rating: "number",
  review_count: "number",
  is_active: "boolean",
  meta_keywords: "string", // e.g., "keyword1, keyword2" or '["keyword1", "keyword2"]'
  meta_description: "string",
};

const destinationModel = new FirebaseService("destinations", DestinationSchema);

// Relasi: destination.image_id => images.id
destinationModel.setRelation("image", {
  model: imageModel,
  type: "one-to-many",
  foreignKey: "FK",
  localKey: "id",
});

destinationModel.setRelation("package", {
  model: packageModel,
  type: "one-to-many",
  foreignKey: "destination_id",
  localKey: "id",
});

export { destinationModel };
