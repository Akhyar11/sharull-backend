"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageController = void 0;
const packages_1 = require("../models/packages");
class PackageController {
    async list(req, res) {
        try {
            const { page, limit, id, name, destination, orderBy = "name_asc", } = req.query;
            const filters = [];
            if (id)
                filters.push({ field: "id", operator: "==", value: id });
            if (name)
                filters.push({ field: "name", operator: "==", value: name });
            if (destination)
                filters.push({
                    field: "destination",
                    operator: "==",
                    value: destination,
                });
            const orderByOptions = {
                field: orderBy.split("_")[0],
                direction: orderBy.split("_")[1],
            };
            const packages = await packages_1.packageModel.searchWheres(filters, orderByOptions);
            const pageNumber = parseInt(page) || 1;
            const limitNumber = parseInt(limit) || 10;
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
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to fetch packages" });
        }
    }
    async store(req, res) {
        try {
            const { name, description, destination, price, available_seats, start_date, end_date, } = req.body;
            if (!name ||
                !description ||
                !destination ||
                !price ||
                !available_seats ||
                !start_date ||
                !end_date) {
                res.status(400).json({ msg: "All fields are required" });
                return;
            }
            const newPackage = {
                name,
                description,
                destination,
                price: parseFloat(price),
                available_seats: parseInt(available_seats),
                start_date,
                end_date,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            await packages_1.packageModel.create(newPackage);
            res
                .status(201)
                .json({ msg: "Package created successfully", data: newPackage });
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to create package" });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, destination, price, available_seats, start_date, end_date, } = req.body;
            const packages = await packages_1.packageModel.search("id", "==", id);
            if (!packages[0]) {
                res.status(404).json({ msg: "Package not found" });
                return;
            }
            const updatedPackage = {
                ...packages[0],
                name: name || packages[0].name,
                description: description || packages[0].description,
                destination: destination || packages[0].destination,
                price: price !== undefined ? parseFloat(price) : packages[0].price,
                available_seats: available_seats !== undefined
                    ? parseInt(available_seats)
                    : packages[0].available_seats,
                start_date: start_date || packages[0].start_date,
                end_date: end_date || packages[0].end_date,
                updated_at: new Date().toISOString(),
            };
            await packages_1.packageModel.update(id, updatedPackage);
            res
                .status(200)
                .json({ msg: "Package updated successfully", data: updatedPackage });
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to update package" });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            const packages = await packages_1.packageModel.search("id", "==", id);
            if (!packages[0]) {
                res.status(404).json({ msg: "Package not found" });
                return;
            }
            await packages_1.packageModel.deleteWithRelation(id);
            res.status(200).json({ msg: "Package deleted successfully" });
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to delete package" });
        }
    }
}
exports.packageController = new PackageController();
