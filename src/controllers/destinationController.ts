import { OrderBy, Where } from "../../firebaseORM/assets/type";
import { destinationModel, IDestination } from "../models/destinations";
import { Request, Response } from "express";
import { createImage } from "./imageController";

class DestinationController {
  async list(req: Request, res: Response) {
    try {
      const {
        page,
        limit,
        id,
        name,
        slug,
        category,
        city,
        province,
        country,
        is_active,
        orderBy = "name_asc",
      } = req.query;

      const filters: Where[] = [];

      if (id) {
        filters.push({ field: "id", operator: "==", value: id });
      }
      if (name) {
        filters.push({ field: "name", operator: "in", value: name });
      }
      if (slug) {
        filters.push({ field: "slug", operator: "in", value: slug });
      }
      if (category) {
        filters.push({ field: "category", operator: "==", value: category });
      }
      if (city) {
        filters.push({ field: "city", operator: "in", value: city });
      }
      if (province) {
        filters.push({ field: "province", operator: "in", value: province });
      }
      if (country) {
        filters.push({ field: "country", operator: "in", value: country });
      }
      if (is_active !== undefined) {
        filters.push({
          field: "is_active",
          operator: "==",
          value: is_active === "true",
        });
      }

      const orderByOptions: OrderBy = {
        field: (orderBy as string).split("_")[0],
        direction: (orderBy as string).split("_")[1] as "asc" | "desc",
      };

      const destinations: IDestination[] = await destinationModel.searchWheres(
        filters,
        orderByOptions
      );

      // Pagination
      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedDestinations = destinations.slice(startIndex, endIndex);

      const data = paginatedDestinations.map((d, i) => ({
        no: i + 1 + startIndex,
        ...d,
      }));

      res.status(200).json({
        list: data,
        total: destinations.length,
        page: pageNumber,
        limit: limitNumber,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Failed to fetch destinations" });
    }
  }

  async store(req: Request, res: Response) {
    try {
      const {
        name,
        slug,
        description,
        location_point,
        province,
        city,
        country,
        category,
        featured,
        gallery,
        meta_keywords,
        meta_description,
      } = req.body;

      if (!name || !slug || !description || !category) {
        res
          .status(400)
          .json({ msg: "Name, slug, description, and category are required" });
        return;
      }

      const existingName = await destinationModel.search("name", "==", name);
      if (existingName.length > 0) {
        res.status(400).json({ msg: "Destination name already exists" });
        return;
      }

      const existingSlug = await destinationModel.search("slug", "==", slug);
      if (existingSlug.length > 0) {
        res.status(400).json({ msg: "Slug already taken" });
        return;
      }

      const newDestination: IDestination = {
        name,
        slug,
        description,
        location_point: location_point || "",
        province: province || "",
        city: city || "",
        country: country || "Indonesia",
        category,
        popularity: 0,
        featured: featured ? Boolean(featured) : false,
        image_id: "",
        gallery: gallery || "[]",
        average_rating: 0.0,
        review_count: 0,
        is_active: true,
        meta_keywords: meta_keywords || "",
        meta_description: meta_description || "",
      };

      const result = await destinationModel.create(newDestination);

      // Handle image jika ada
      const { image } = req.body;
      if (image) {
        await createImage(image as string, result.id);
      }

      res
        .status(201)
        .json({ msg: "Destination created successfully", data: result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Failed to create destination" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        slug,
        description,
        location_point,
        province,
        city,
        country,
        category,
        featured,
        gallery,
        meta_keywords,
        meta_description,
        is_active,
      } = req.body;

      const destinations = await destinationModel.search("id", "==", id);

      if (!destinations[0]) {
        res.status(404).json({ msg: "Destination not found" });
        return;
      }

      // Cek slug unik jika diupdate
      if (slug && slug !== destinations[0].slug) {
        const existingSlug = await destinationModel.search("slug", "==", slug);
        if (existingSlug.length > 0) {
          res.status(400).json({ msg: "Slug already taken" });
          return;
        }
      }

      // Handle image jika ada
      const { image } = req.body;
      if (image) {
        await createImage(image as string, id);
      }

      const updatedDestination: IDestination = {
        ...destinations[0],
        name: name || destinations[0].name,
        slug: slug || destinations[0].slug,
        description: description || destinations[0].description,
        location_point: location_point || destinations[0].location_point,
        province: province || destinations[0].province,
        city: city || destinations[0].city,
        country: country || destinations[0].country,
        category: category || destinations[0].category,
        featured:
          featured !== undefined ? Boolean(featured) : destinations[0].featured,
        gallery: gallery || destinations[0].gallery,
        meta_keywords: meta_keywords || destinations[0].meta_keywords,
        meta_description: meta_description || destinations[0].meta_description,
        is_active:
          is_active !== undefined
            ? Boolean(is_active)
            : destinations[0].is_active,
      };

      await destinationModel.update(id, updatedDestination);
      res.status(200).json({
        msg: "Destination updated successfully",
        data: updatedDestination,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Failed to update destination" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const destinations = await destinationModel.search("id", "==", id);

      if (!destinations[0]) {
        res.status(404).json({ msg: "Destination not found" });
        return;
      }

      await destinationModel.deleteWithRelation(id);
      res.status(200).json({ msg: "Destination deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Failed to delete destination" });
    }
  }
}

export const destinationController = new DestinationController();
