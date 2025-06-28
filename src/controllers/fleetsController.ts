import { Request, Response } from "express";
import { fleetModel, IFleet } from "../models/fleets";
import { OrderBy, Where } from "../../firebaseORM/assets/type";
import { createImage } from "./imageController";

class FleetController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page,
        limit,
        id,
        name,
        type,
        status,
        orderBy = "name_asc",
      } = req.query;

      const filters: Where[] = [];

      if (id) filters.push({ field: "id", operator: "==", value: id });
      if (name) filters.push({ field: "name", operator: "in", value: name });
      if (type) filters.push({ field: "type", operator: "==", value: type });
      if (status)
        filters.push({ field: "status", operator: "==", value: status });

      const orderByOptions: OrderBy = {
        field: (orderBy as string).split("_")[0],
        direction: (orderBy as string).split("_")[1] as "asc" | "desc",
      };

      const fleets: IFleet[] = await fleetModel.searchWheres(
        filters,
        orderByOptions
      );

      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedFleets = fleets.slice(startIndex, endIndex);

      const data = paginatedFleets.map((fleet, index) => ({
        no: index + 1 + startIndex,
        ...fleet,
      }));

      res.status(200).json({
        list: data,
        total: fleets.length,
        page: pageNumber,
        limit: limitNumber,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch fleets" });
    }
  }

  async store(req: Request, res: Response): Promise<void> {
    try {
      const { name, type, plate_number, capacity, driver_name, status, image } =
        req.body;

      if (
        !name ||
        !type ||
        !plate_number ||
        !capacity ||
        !driver_name ||
        !status
      ) {
        res.status(400).json({ msg: "All fields are required" });
        return;
      }

      let image_id = "";
      const newFleet: IFleet = {
        name,
        type,
        plate_number,
        capacity: parseInt(capacity),
        driver_name,
        status,
        image_id,
      };

      const createdFleet = await fleetModel.create(newFleet);
      if (image) {
        image_id = await createImage(image as string, createdFleet.id);
        await fleetModel.update(createdFleet.id, { ...createdFleet, image_id });
      }
      res.status(201).json({
        msg: "Fleet created successfully",
        data: { ...createdFleet, image_id },
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to create fleet" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, type, plate_number, capacity, driver_name, status, image } =
        req.body;

      const fleets = await fleetModel.search("id", "==", id);

      if (!fleets[0]) {
        res.status(404).json({ msg: "Fleet not found" });
        return;
      }

      let image_id = fleets[0].image_id || "";
      if (image) {
        image_id = await createImage(image as string, id);
      }

      const updatedFleet: IFleet = {
        ...fleets[0],
        name: name || fleets[0].name,
        type: type || fleets[0].type,
        plate_number: plate_number || fleets[0].plate_number,
        capacity:
          capacity !== undefined ? parseInt(capacity) : fleets[0].capacity,
        driver_name: driver_name || fleets[0].driver_name,
        status: status || fleets[0].status,
        image_id,
      };

      await fleetModel.update(id, updatedFleet);
      res
        .status(200)
        .json({ msg: "Fleet updated successfully", data: updatedFleet });
    } catch (error) {
      res.status(500).json({ msg: "Failed to update fleet" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const fleets = await fleetModel.search("id", "==", id);

      if (!fleets[0]) {
        res.status(404).json({ msg: "Fleet not found" });
        return;
      }

      await fleetModel.deleteWithRelation(id);
      res.status(200).json({ msg: "Fleet deleted successfully" });
    } catch (error) {
      res.status(500).json({ msg: "Failed to delete fleet" });
    }
  }
}

export const fleetController = new FleetController();
