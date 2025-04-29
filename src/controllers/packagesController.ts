import { Request, Response } from "express";
import { packageModel, IPackage } from "../models/packages";
import { OrderBy, Where } from "../../firebaseORM/assets/type";

class PackageController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page,
        limit,
        id,
        name,
        destination,
        orderBy = "name_asc",
      } = req.query;

      const filters: Where[] = [];

      if (id) filters.push({ field: "id", operator: "==", value: id });
      if (name) filters.push({ field: "name", operator: "in", value: name });
      if (destination)
        filters.push({
          field: "destination",
          operator: "in",
          value: destination,
        });

      const orderByOptions: OrderBy = {
        field: (orderBy as string).split("_")[0],
        direction: (orderBy as string).split("_")[1] as "asc" | "desc",
      };

      const packages: IPackage[] = await packageModel.searchWheres(
        filters,
        orderByOptions
      );

      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedPackages = packages.slice(startIndex, endIndex);

      const data = paginatedPackages.map((pkg, index) => ({
        no: index + 1 + startIndex,
        ...pkg,
      }));

      res.status(200).json({
        list: data,
        total: packages.length,
        page: pageNumber,
        limit: limitNumber,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch packages" });
    }
  }

  async store(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        description,
        destination,
        price,
        available_seats,
        start_date,
        end_date,
      } = req.body;

      if (!name || !description || !destination || !price) {
        res.status(400).json({ msg: "All fields are required" });
        return;
      }

      const newPackage: IPackage = {
        name,
        description,
        destination,
        price: parseFloat(price),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await packageModel.create(newPackage);
      res
        .status(201)
        .json({ msg: "Package created successfully", data: newPackage });
    } catch (error) {
      res.status(500).json({ msg: "Failed to create package" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, destination, price } = req.body;

      const packages = await packageModel.search("id", "==", id);

      if (!packages[0]) {
        res.status(404).json({ msg: "Package not found" });
        return;
      }

      const updatedPackage: IPackage = {
        ...packages[0],
        name: name || packages[0].name,
        description: description || packages[0].description,
        destination: destination || packages[0].destination,
        price: price !== undefined ? parseFloat(price) : packages[0].price,
        updated_at: new Date().toISOString(),
      };

      await packageModel.update(id, updatedPackage);
      res
        .status(200)
        .json({ msg: "Package updated successfully", data: updatedPackage });
    } catch (error) {
      res.status(500).json({ msg: "Failed to update package" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const packages = await packageModel.search("id", "==", id);

      if (!packages[0]) {
        res.status(404).json({ msg: "Package not found" });
        return;
      }

      await packageModel.deleteWithRelation(id);
      res.status(200).json({ msg: "Package deleted successfully" });
    } catch (error) {
      res.status(500).json({ msg: "Failed to delete package" });
    }
  }
}

export const packageController = new PackageController();
