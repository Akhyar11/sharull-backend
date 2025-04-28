"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Sama kayak di AuthController
const adminAuthMiddleware = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== "admin") {
            res.status(403).json({ msg: "Access denied, admins only" });
            return;
        }
        // Tempel user info ke req (optional, untuk keperluan lain)
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error(error);
        res.status(401).json({ msg: "Invalid or expired token" });
    }
};
exports.adminAuthMiddleware = adminAuthMiddleware;
