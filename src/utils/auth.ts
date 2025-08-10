import jwt from "jsonwebtoken";
import { Response } from "express";

const SECRET = process.env.JWT_SECRET || "guardian-dev";

export const signToken = (userId: string) =>
  jwt.sign({ userId }, SECRET, { expiresIn: "30d" });

export const verifyToken = (token: string) =>
  jwt.verify(token, SECRET) as { userId: string };

// Función para establecer el token en una cookie
export const setTokenCookie = (res: Response, token: string) => {
  res.cookie("authToken", token, {
    httpOnly: true, // No accesible desde JavaScript del cliente
    secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
    sameSite: "strict", // Protección CSRF
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  });
};

// Función para limpiar la cookie del token
export const clearTokenCookie = (res: Response) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};
