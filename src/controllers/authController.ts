import { Request, Response } from "express";
import { userModel, IUser } from "../models/users";
import bcrypt from "bcrypt";
import { FirebaseError } from "firebase-admin";

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, phone } = req.body;

      if (!name || !email || !password || !phone) {
        res.status(400).json({ message: "All fields are required" });
        return;
      }

      const existingUser = await userModel.search("email", "==", email);

      if (existingUser.length > 0) {
        res.status(409).json({ message: "User already exists" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser: Partial<IUser> = {
        name,
        email,
        password: hashedPassword,
        phone,
        role: "customer",
        image_id: "",
        created_at: new Date().toISOString(),
        reset_token: "",
        reset_token_expires: "",
        updated_at: new Date().toISOString(),
      };

      const createdUser = await userModel.create(newUser);

      const { password: _, ...userWithoutPassword } = createdUser;

      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if ((error as FirebaseError).code) {
        res.status(500).json({ message: (error as FirebaseError).message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
