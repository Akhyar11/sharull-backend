import { OrderBy, Where } from "../../firebaseORM/assets/type";
import { userModel, IUser } from "../models/users";
import { Request, Response } from "express";
import bcrypt from "bcrypt";

class UserController {
  async list(req: Request, res: Response) {
    try {
      const {
        page,
        limit,
        id,
        name,
        email,
        phone,
        role,
        orderBy = "name_asc",
      } = req.query;

      const filters: Where[] = [];

      if (id) {
        filters.push({ field: "id", operator: "==", value: id });
      }
      if (name) {
        filters.push({ field: "name", operator: "in", value: name });
      }
      if (email) {
        filters.push({ field: "email", operator: "in", value: email });
      }
      if (phone) {
        filters.push({ field: "phone", operator: "in", value: phone });
      }
      if (role) {
        filters.push({ field: "role", operator: "==", value: role });
      }

      const orderByOptions: OrderBy = {
        field: (orderBy as string).split("_")[0],
        direction: (orderBy as string).split("_")[1] as "asc" | "desc",
      };

      const users: IUser[] = await userModel.searchWheres(
        filters,
        orderByOptions
      );

      // Apply pagination logic
      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;

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
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch users" });
    }
  }

  async store(req: Request, res: Response) {
    try {
      const { name, email, password, phone, role } = req.body;

      if (!name || !email || !password || !phone || !role) {
        res.status(400).json({ msg: "All fields are required" });
        return;
      }

      const users = await userModel.read();

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

      const newUser: IUser = {
        name,
        email,
        password: bcrypt.hashSync(password, 10),
        phone,
        role,
      };

      await userModel.create(newUser);
      res.status(201).json({ msg: "User created successfully", data: newUser });
      return;
    } catch (error) {
      res.status(500).json({ msg: "Failed to create user" });
      return;
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, email, password, phone, role } = req.body;

      const users = await userModel.search("id", "==", id);

      if (!users[0]) {
        res.status(404).json({ msg: "User not found" });
        return;
      }

      const newPassword = password
        ? bcrypt.hashSync(password, 10)
        : users[0].password;

      const updatedUser: IUser = {
        ...users[0],
        name: name || users[0].name,
        email: email || users[0].email,
        password: newPassword,
        phone: phone || users[0].phone,
        role: role || users[0].role,
      };

      await userModel.update(id, updatedUser);
      res
        .status(200)
        .json({ msg: "User updated successfully", data: updatedUser });
      return;
    } catch (error) {
      res.status(500).json({ msg: "Failed to update user" });
      return;
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const users = await userModel.search("id", "==", id);

      if (!users[0]) {
        res.status(404).json({ msg: "User not found" });
        return;
      }

      await userModel.deleteWithRelation(id);
      res.status(200).json({ msg: "User deleted successfully" });
      return;
    } catch (error) {
      res.status(500).json({ msg: "Failed to delete user" });
      return;
    }
  }
}

export const userController = new UserController();
