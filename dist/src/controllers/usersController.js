"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const users_1 = require("../models/users");
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserController {
    async list(req, res) {
        try {
            const { page, limit, id, name, email, phone, role, orderBy = "name_asc", } = req.query;
            const filters = [];
            if (id) {
                filters.push({ field: "id", operator: "==", value: id });
            }
            if (name) {
                filters.push({ field: "name", operator: "==", value: name });
            }
            if (email) {
                filters.push({ field: "email", operator: "==", value: email });
            }
            if (phone) {
                filters.push({ field: "phone", operator: "==", value: phone });
            }
            if (role) {
                filters.push({ field: "role", operator: "==", value: role });
            }
            const orderByOptions = {
                field: orderBy.split("_")[0],
                direction: orderBy.split("_")[1],
            };
            const users = await users_1.userModel.searchWheres(filters, orderByOptions);
            // Apply pagination logic
            const pageNumber = parseInt(page) || 1;
            const limitNumber = parseInt(limit) || 10;
            const startIndex = (pageNumber - 1) * limitNumber;
            const endIndex = startIndex + limitNumber;
            const paginatedUsers = users.slice(startIndex, endIndex);
            const data = [];
            for (let i = 0; i < paginatedUsers.length; i++) {
                const { password, ...user } = paginatedUsers[i];
                const no = i + 1 + startIndex;
                data.push({ no, ...user });
            }
            res.status(200).json({
                list: data,
                total: users.length,
                page: pageNumber,
                limit: limitNumber,
            });
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to fetch users" });
        }
    }
    async store(req, res) {
        try {
            const { name, email, password, phone, role } = req.body;
            if (!name || !email || !password || !phone || !role) {
                res.status(400).json({ msg: "All fields are required" });
                return;
            }
            const users = await users_1.userModel.read();
            const existingEmailUser = users.filter((user) => user.email === email);
            const existingPhoneUser = users.filter((user) => user.phone === phone);
            if (existingEmailUser.length > 0) {
                res.status(400).json({ msg: "Email already exists" });
                return;
            }
            if (existingPhoneUser.length > 0) {
                res.status(400).json({ msg: "Phone number already exists" });
                return;
            }
            const newUser = {
                name,
                email,
                password: bcrypt_1.default.hashSync(password, 10),
                phone,
                role,
            };
            await users_1.userModel.create(newUser);
            res.status(201).json({ msg: "User created successfully", data: newUser });
            return;
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to create user" });
            return;
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, email, password, phone, role } = req.body;
            const users = await users_1.userModel.search("id", "==", id);
            if (!users[0]) {
                res.status(404).json({ msg: "User not found" });
                return;
            }
            const newPassword = password
                ? bcrypt_1.default.hashSync(password, 10)
                : users[0].password;
            const updatedUser = {
                ...users[0],
                name: name || users[0].name,
                email: email || users[0].email,
                password: newPassword,
                phone: phone || users[0].phone,
                role: role || users[0].role,
            };
            await users_1.userModel.update(id, updatedUser);
            res
                .status(200)
                .json({ msg: "User updated successfully", data: updatedUser });
            return;
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to update user" });
            return;
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            const users = await users_1.userModel.search("id", "==", id);
            if (!users[0]) {
                res.status(404).json({ msg: "User not found" });
                return;
            }
            await users_1.userModel.deleteWithRelation(id);
            res.status(200).json({ msg: "User deleted successfully" });
            return;
        }
        catch (error) {
            res.status(500).json({ msg: "Failed to delete user" });
            return;
        }
    }
}
exports.userController = new UserController();
