import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "guardian-dev";

export const signToken = (userId: string) =>
  jwt.sign({ userId }, SECRET, { expiresIn: "30d" });

export const verifyToken = (token: string) =>
  jwt.verify(token, SECRET) as { userId: string };
