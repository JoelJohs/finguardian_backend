import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";
import colors from "colors";

export interface AuthRequest extends Request {
  userId?: string;
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: "Falta el token de autorización" });
  }

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ message: "Formato de autorización inválido" });
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
