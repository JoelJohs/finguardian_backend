import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";
import colors from "colors";

export interface AuthRequest extends Request {
  userId?: string;
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Primero intentar obtener el token de las cookies
  let token = req.cookies?.authToken;

  // Si no hay token en las cookies, intentar obtenerlo del header Authorization (para retrocompatibilidad)
  if (!token) {
    const header = req.headers.authorization;
    if (header) {
      const [type, headerToken] = header.split(" ");
      if (type === "Bearer" && headerToken) {
        token = headerToken;
      }
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Falta el token de autorización" });
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    console.log(colors.green(`Usuario autenticado: ${req.userId}`));
    next();
  } catch (error) {
    console.error(colors.red("Error al verificar el token:"), error);
    return res.status(401).json({ message: "Token de autorización inválido" });
  }
};
