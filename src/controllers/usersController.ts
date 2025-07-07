import { OrderBy, Where } from "../../firebaseORM/assets/type";
import { userModel, IUser } from "../models/users";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { createImage } from "./imageController";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/email";
import { generateResetToken, verifyResetToken } from "../utils/token";

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
        orderBy = "name.asc",
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
        field: (orderBy as string).split(".")[0],
        direction: (orderBy as string).split(".")[1] as "asc" | "desc",
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
        image_id: "",
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
      const { name, email, password, phone, role, image } = req.body;

      const users = await userModel.search("id", "==", id);

      if (!users[0]) {
        res.status(404).json({ msg: "User not found" });
        return;
      }

      let imageData = users[0].image_id;

      if (image) {
        imageData = await createImage(image as string, id);
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
        image_id: imageData,
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

  async profile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ msg: "Unauthorized" });
        return;
      }
      const users = await userModel.search("id", "==", userId);
      if (!users[0]) {
        res.status(404).json({ msg: "User not found" });
        return;
      }
      const { password, ...user } = users[0];
      res.status(200).json({ data: user });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch profile" });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ msg: "Unauthorized" });
        return;
      }
      const { name, email, password, phone, image } = req.body;
      const users = await userModel.search("id", "==", userId);
      if (!users[0]) {
        res.status(404).json({ msg: "User not found" });
        return;
      }
      if (image) {
        await createImage(image as string, userId);
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
      };
      await userModel.update(userId, updatedUser);
      res
        .status(200)
        .json({ msg: "Profile updated successfully", data: updatedUser });
    } catch (error) {
      res.status(500).json({ msg: "Failed to update profile" });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, phone } = req.body;

      // Validate required fields
      if (!name || !email || !password || !phone) {
        res.status(400).json({ msg: "All fields are required" });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ msg: "Invalid email format" });
        return;
      }

      // Validate phone format (minimal 10 digit, maksimal 13 digit)
      const phoneRegex = /^[0-9]{10,13}$/;
      if (!phoneRegex.test(phone)) {
        res.status(400).json({ msg: "Invalid phone number format" });
        return;
      }

      // Check existing email and phone
      const users = await userModel.read();
      const existingEmailUser = users.find((user) => user.email === email);
      const existingPhoneUser = users.find((user) => user.phone === phone);

      if (existingEmailUser) {
        res.status(400).json({ msg: "Email already registered" });
        return;
      }

      if (existingPhoneUser) {
        res.status(400).json({ msg: "Phone number already registered" });
        return;
      }

      // Create new user
      const newUser: IUser = {
        name,
        email,
        password: bcrypt.hashSync(password, 10),
        phone,
        role: "user",
        image_id: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const createdUser = await userModel.create(newUser);
      const { password: _, ...userWithoutPassword } = createdUser;

      // Generate JWT token
      const token = jwt.sign(
        { id: createdUser.id, role: "user" },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      res.status(201).json({
        msg: "Registration successful",
        data: userWithoutPassword,
        token,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to register user" });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ msg: "Email and password are required" });
        return;
      }

      // Find user by email
      const users = await userModel.search("email", "==", email);
      const user = users[0];

      if (!user || user.role !== "user") {
        res.status(401).json({ msg: "Invalid credentials" });
        return;
      }

      // Verify password
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ msg: "Invalid credentials" });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, role: "user" },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        msg: "Login successful",
        data: userWithoutPassword,
        token,
      });
    } catch (error) {
      res.status(500).json({ msg: "Failed to login" });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ msg: "Email is required" });
        return;
      }

      // Find user by email
      const users = await userModel.search("email", "==", email);
      const user = users[0];

      if (!user || user.role !== "user") {
        res.status(404).json({ msg: "User not found" });
        return;
      }

      // Generate reset token
      const resetToken = generateResetToken(user.id);

      // Save reset token to user data
      await userModel.update(user.id, {
        ...user,
        reset_token: resetToken,
        reset_token_expires: new Date(Date.now() + 3600000).toISOString(), // Token valid for 1 hour
      });

      // Send reset password email
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await sendEmail({
        to: email,
        subject: "Reset Password",
        html: `
          <h1>Reset Password</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link will expire in 1 hour.</p>
        `,
      });

      res.status(200).json({
        msg: "Reset password instructions sent to your email",
      });
    } catch (error) {
      res
        .status(500)
        .json({ msg: "Failed to process forgot password request" });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, new_password } = req.body;

      if (!token || !new_password) {
        res.status(400).json({ msg: "Token and new password are required" });
        return;
      }

      // Verify token and get user ID
      const userId = verifyResetToken(token);
      if (!userId) {
        res.status(400).json({ msg: "Invalid or expired token" });
        return;
      }

      // Find user
      const users = await userModel.search("id", "==", userId);
      const user = users[0];

      if (!user || user.role !== "user") {
        res.status(404).json({ msg: "User not found" });
        return;
      }

      // Verify token expiration
      if (
        !user.reset_token ||
        user.reset_token !== token ||
        new Date() > new Date(user.reset_token_expires)
      ) {
        res.status(400).json({ msg: "Invalid or expired token" });
        return;
      }

      // Update password
      const hashedPassword = bcrypt.hashSync(new_password, 10);
      await userModel.update(user.id, {
        ...user,
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
        updated_at: new Date().toISOString(),
      });

      res.status(200).json({ msg: "Password reset successful" });
    } catch (error) {
      res.status(500).json({ msg: "Failed to reset password" });
    }
  }
}

export const userController = new UserController();
