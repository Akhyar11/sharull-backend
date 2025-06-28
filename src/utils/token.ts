import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

export const generateResetToken = (userId: string): string => {
  return jwt.sign({ userId, purpose: "reset_password" }, SECRET_KEY, {
    expiresIn: "1h",
  });
};

export const verifyResetToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as {
      userId: string;
      purpose: string;
    };
    if (decoded.purpose !== "reset_password") return null;
    return decoded.userId;
  } catch (error) {
    return null;
  }
};
