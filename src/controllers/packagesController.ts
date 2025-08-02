import { Request, Response } from "express";
import { packageModel, IPackage } from "../models/packages";
import { OrderBy, Where } from "../../firebaseORM/assets/type";
import { destinationModel, IDestination } from "../models/destinations";
import { createImage } from "./imageController";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { bookingModel, IBooking } from "../models/bookings";
import { userModel } from "../models/users";
import { packageScheduleModel } from "../models/packageSchedules";
import { useGemini } from "../utils/gemini-ai";
import { useGroq } from "../utils/groq-ai";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

class PackageController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page,
        limit,
        id,
        name,
        destination_ids,
        orderBy = "name.asc",
      } = req.query;

      const filters: Where[] = [];

      if (id) filters.push({ field: "id", operator: "==", value: id });
      if (name) filters.push({ field: "name", operator: "in", value: name });
      if (destination_ids && Array.isArray(destination_ids)) {
        filters.push({
          field: "destination_ids",
          operator: "array-contains-any",
          value: destination_ids,
        });
      }

      const orderByOptions: OrderBy = {
        field: (orderBy as string).split(".")[0],
        direction: (orderBy as string).split(".")[1] as "asc" | "desc",
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

      const data = await Promise.all(
        paginatedPackages.map(async (pkg, index) => {
          let destinations = [];
          if (Array.isArray(pkg.destination_ids)) {
            destinations = await Promise.all(
              pkg.destination_ids.map(async (destId: string) => {
                const dest = await destinationModel.search("id", "==", destId);
                return dest[0] || null;
              })
            );
          }
          return {
            no: index + 1 + startIndex,
            ...pkg,
            destinations,
          };
        })
      );

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
      const { name, description, destination_ids, price, image } = req.body;

      if (
        !name ||
        !description ||
        !price ||
        !Array.isArray(destination_ids) ||
        destination_ids.length === 0
      ) {
        res.status(400).json({
          msg: "All fields are required, destination_ids harus array dan tidak kosong",
        });
        return;
      }

      let image_id = "";
      const newPackage: IPackage = {
        name,
        description,
        destination_ids,
        price: parseFloat(price),
        image_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const createdPackage = await packageModel.create(newPackage);
      if (image) {
        image_id = await createImage(image as string, createdPackage.id);
        await packageModel.update(createdPackage.id, {
          ...createdPackage,
          image_id,
        });
      }
      res.status(201).json({
        msg: "Package created successfully",
        data: { ...createdPackage, image_id },
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to create package" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, destination_ids, price, image } = req.body;

      const packages = await packageModel.search("id", "==", id);

      if (!packages[0]) {
        res.status(404).json({ msg: "Package not found" });
        return;
      }

      let image_id = packages[0].image_id || "";
      if (image) {
        image_id = await createImage(image as string, id);
      }

      const updatedPackage: IPackage = {
        ...packages[0],
        name: name || packages[0].name,
        destination_ids:
          Array.isArray(destination_ids) && destination_ids.length > 0
            ? destination_ids
            : packages[0].destination_ids,
        description: description || packages[0].description,
        price: price !== undefined ? parseFloat(price) : packages[0].price,
        image_id,
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

  async listForUser(req: Request, res: Response) {
    try {
      const { page, limit, search, orderBy = "name_asc" } = req.query;

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ msg: "No token provided" });
        return;
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        role: string;
        email: string;
      };

      let AIRecomendation: {
        category: string;
        provensi: string;
        city: string;
      } | null = null;

      if (decoded.role === "customer" || decoded.role === "user") {
        const bookings: IBooking[] = await bookingModel.searchWheres(
          [{ field: "user_id", operator: "==", value: decoded.id }],
          {
            field: "booking_date",
            direction: "asc",
          }
        );

        const pageNumber = 1;
        const limitNumber = 10;
        const startIndex = (pageNumber - 1) * limitNumber;
        const endIndex = startIndex + limitNumber;
        const paginatedBookings = bookings.slice(startIndex, endIndex);

        const data = paginatedBookings.map((booking, index) => ({
          no: index + 1 + startIndex,
          ...booking,
        }));

        const dataRelation = [];
        const user = await userModel.search("id", "==", decoded.id);

        for (let d of data) {
          const scheduleResults = await packageScheduleModel.search(
            "id",
            "==",
            d.package_schedule_id
          );

          let scheduleWithPackage = null;

          if (scheduleResults && scheduleResults.length > 0) {
            const pkg = await packageModel.search(
              "id",
              "==",
              scheduleResults[0].package_id
            );

            let destinations = [];

            for (let d of pkg[0].destination_ids) {
              const des = await destinationModel.search("id", "==", d);
              destinations.push(des[0]);
            }

            const newPackage = {
              ...pkg[0],
              destinations,
            };

            scheduleWithPackage = {
              ...scheduleResults[0],
              package: newPackage,
            };
          }

          const newData = {
            ...d,
            user: user && user.length > 0 ? user[0] : null,
            schedule: scheduleWithPackage,
          };

          dataRelation.push(newData);
        }

        AIRecomendation = await useGroq(dataRelation);
      }

      const filters: Where[] = [];

      if (search) {
        filters.push({ field: "name", operator: ">=", value: search });
      }

      const orderByOptions: OrderBy = {
        field: (orderBy as string).split("_")[0],
        direction: (orderBy as string).split("_")[1] as "asc" | "desc",
      };

      // Get all packages first
      const allPackages = await packageModel.searchWheres(
        filters,
        orderByOptions
      );

      // Get destinations for each package
      const packagesWithDestinations = await Promise.all(
        allPackages.map(async (pkg) => {
          const destinations = await Promise.all(
            pkg.destination_ids.map(async (destId: string) => {
              const dest = await destinationModel.search("id", "==", destId);
              return dest[0];
            })
          );
          return {
            ...pkg,
            destinations,
          };
        })
      );

      let finalPackages = [];

      if (AIRecomendation) {
        // Query 1: Packages yang match dengan AI Recommendation
        const recommendedPackages = packagesWithDestinations.filter((pkg) => {
          return pkg.destinations.some(
            (destination: IDestination) =>
              destination.city === AIRecomendation.city ||
              destination.province === AIRecomendation.provensi ||
              destination.category === AIRecomendation.category
          );
        });

        // Query 2: Packages yang tidak match dengan AI Recommendation
        const otherPackages = packagesWithDestinations.filter((pkg) => {
          return !pkg.destinations.some(
            (destination: IDestination) =>
              destination.city === AIRecomendation.city ||
              destination.province === AIRecomendation.provensi ||
              destination.category === AIRecomendation.category
          );
        });

        // Gabungkan: recommended packages di awal, diikuti other packages
        // Pastikan tidak ada duplikasi ID
        const usedIds = new Set();

        // Tambahkan recommended packages terlebih dahulu
        recommendedPackages.forEach((pkg) => {
          if (!usedIds.has(pkg.id)) {
            finalPackages.push(pkg);
            usedIds.add(pkg.id);
          }
        });

        // Tambahkan other packages
        otherPackages.forEach((pkg) => {
          if (!usedIds.has(pkg.id)) {
            finalPackages.push(pkg);
            usedIds.add(pkg.id);
          }
        });
      } else {
        // Jika tidak ada AI Recommendation, gunakan packages biasa
        finalPackages = packagesWithDestinations;
      }

      // Apply pagination pada final packages
      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      const paginatedPackages = finalPackages.slice(startIndex, endIndex);

      res.status(200).json({
        list: paginatedPackages,
        total: finalPackages.length,
        page: pageNumber,
        limit: limitNumber,
        aiRecommendation: AIRecomendation, // Optional: untuk debugging
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch packages" });
    }
  }

  async detailForUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const packages = await packageModel.search("id", "==", id);

      if (!packages[0]) {
        res.status(404).json({ msg: "Package not found" });
        return;
      }

      const pkg = packages[0];

      // Get destinations
      const destinations = await Promise.all(
        pkg.destination_ids.map(async (destId: string) => {
          const dest = await destinationModel.search("id", "==", destId);
          return dest[0];
        })
      );

      const packageWithDetails = {
        ...pkg,
        destinations,
      };

      res.status(200).json({ data: packageWithDetails });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch package details" });
    }
  }
}

export const packageController = new PackageController();
