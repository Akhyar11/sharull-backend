import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Sama kayak di AuthController

export const adminAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const path = req.path.split("/")[1]; // Ambil path pertama setelah /api

    if (path !== "admin") {
      next();
      return;
    }

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

    if (decoded.role !== "admin") {
      res.status(403).json({ msg: "Access denied, admins only" });
      return;
    }

    // Tempel user info ke req (optional, untuk keperluan lain)
    (req as any).user = decoded;

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ msg: "Invalid or expired token" });
  }
};
