import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userModel } from "../models/users"; // Pastikan path-nya benar
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Sesuaikan di .env ya

class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ msg: "Email and password are required" });
        return;
      }

      // Cari user berdasarkan email
      const users = await userModel.search("email", "==", email);

      if (users.length === 0) {
        res.status(404).json({ msg: "User not found" });
        return;
      }

      const user = users[0];

      // Cek apakah user role nya admin
      if (user.role !== "admin") {
        res.status(403).json({ msg: "Access denied, not an admin" });
        return;
      }

      // Bandingkan password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        res.status(400).json({ msg: "Invalid credentials" });
        return;
      }

      // Buat JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.status(200).json({
        msg: "Login successful",
        token,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }
}

export const authController = new AuthController();
