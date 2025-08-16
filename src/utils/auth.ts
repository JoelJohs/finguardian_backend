import jwt from "jsonwebtoken";
import { Response } from "express";

const SECRET = process.env.JWT_SECRET || "guardian-dev";

export const signToken = (userId: string, rememberMe: boolean = false) => {
  // Duración del JWT:
  // - Si rememberMe es true: 7 días
  // - Si rememberMe es false: 24 horas
  const expiresIn = rememberMe ? "7d" : "24h";

  return jwt.sign({ userId }, SECRET, { expiresIn });
};

export const verifyToken = (token: string) =>
  jwt.verify(token, SECRET) as { userId: string };

// Función para establecer el token en una cookie
export const setTokenCookie = (res: Response, token: string, rememberMe: boolean = false) => {
  // Duración de la cookie:
  // - Si rememberMe es true: 7 días
  // - Si rememberMe es false: 24 horas
  const maxAge = rememberMe
    ? 7 * 24 * 60 * 60 * 1000  // 7 días
    : 24 * 60 * 60 * 1000;     // 24 horas

  res.cookie("authToken", token, {
    httpOnly: true, // No accesible desde JavaScript del cliente
    secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Más permisivo en desarrollo
    maxAge: maxAge,
  });
};

// Función para limpiar la cookie del token
export const clearTokenCookie = (res: Response) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });
};
