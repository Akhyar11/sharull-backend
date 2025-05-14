import { Request, Response } from "express";
import {
  packageScheduleModel,
  IPackageSchedule,
} from "../models/packageSchedules";
import { OrderBy, Where } from "../../firebaseORM/assets/type";
import { packageModel } from "../models/packages";
import { fleetModel } from "../models/fleets";

class PackageScheduleController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page,
        limit,
        id,
        package_id,
        fleet_id,
        departure_date,
        orderBy = "departure_date_asc",
      } = req.query;

      const filters: Where[] = [];

      if (id) filters.push({ field: "id", operator: "==", value: id });
      if (package_id)
        filters.push({
          field: "package_id",
          operator: "==",
          value: package_id,
        });
      if (fleet_id)
        filters.push({ field: "fleet_id", operator: "==", value: fleet_id });
      if (departure_date)
        filters.push({
          field: "departure_date",
          operator: "==",
          value: departure_date,
        });

      const orderByOptions: OrderBy = {
        field: (orderBy as string).split("_")[0],
        direction: (orderBy as string).split("_")[1] as "asc" | "desc",
      };

      const schedules: IPackageSchedule[] =
        await packageScheduleModel.searchWheres(filters, orderByOptions);

      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedSchedules = schedules.slice(startIndex, endIndex);

      const data = paginatedSchedules.map(async (schedule, index) => ({
        no: index + 1 + startIndex,
        package: (
          await packageModel.search("id", "==", schedule.package_id)
        )[0],
        fleet: (await fleetModel.search("id", "==", schedule.fleet_id))[0],
        ...schedule,
      }));

      res.status(200).json({
        list: data,
        listData: paginatedSchedules,
        total: schedules.length,
        page: pageNumber,
        limit: limitNumber,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch package schedules" });
    }
  }

  async store(req: Request, res: Response): Promise<void> {
    try {
      const {
        package_id,
        fleet_id,
        departure_date,
        return_date,
        departure_time,
        available_seats,
      } = req.body;

      if (
        !package_id ||
        !fleet_id ||
        !departure_date ||
        !return_date ||
        !departure_time ||
        !available_seats
      ) {
        res.status(400).json({ msg: "All fields are required" });
        return;
      }

      const newSchedule: IPackageSchedule = {
        package_id,
        fleet_id,
        departure_date,
        return_date,
        departure_time,
        available_seats: parseInt(available_seats),
      };

      await packageScheduleModel.create(newSchedule);
      res.status(201).json({
        msg: "Package schedule created successfully",
        data: newSchedule,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to create package schedule" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        package_id,
        fleet_id,
        departure_date,
        return_date,
        departure_time,
        available_seats,
      } = req.body;

      const schedules = await packageScheduleModel.search("id", "==", id);

      if (!schedules[0]) {
        res.status(404).json({ msg: "Package schedule not found" });
        return;
      }

      const updatedSchedule: IPackageSchedule = {
        ...schedules[0],
        package_id: package_id || schedules[0].package_id,
        fleet_id: fleet_id || schedules[0].fleet_id,
        departure_date: departure_date || schedules[0].departure_date,
        return_date: return_date || schedules[0].return_date,
        departure_time: departure_time || schedules[0].departure_time,
        available_seats:
          available_seats !== undefined
            ? parseInt(available_seats)
            : schedules[0].available_seats,
      };

      await packageScheduleModel.update(id, updatedSchedule);
      res.status(200).json({
        msg: "Package schedule updated successfully",
        data: updatedSchedule,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to update package schedule" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const schedules = await packageScheduleModel.search("id", "==", id);

      if (!schedules[0]) {
        res.status(404).json({ msg: "Package schedule not found" });
        return;
      }

      await packageScheduleModel.deleteWithRelation(id);
      res.status(200).json({ msg: "Package schedule deleted successfully" });
    } catch (error) {
      res.status(500).json({ msg: "Failed to delete package schedule" });
    }
  }
}

export const packageScheduleController = new PackageScheduleController();
