import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

export const userAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
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
    // Hanya izinkan user atau admin
    if (decoded.role !== "user" && decoded.role !== "admin") {
      res.status(403).json({ msg: "Access denied, user only" });
      return;
    }
    (req as any).user = decoded;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ msg: "Invalid or expired token" });
  }
};
