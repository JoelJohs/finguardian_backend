import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { setupSwagger } from "./docs/swagger";
import rateLimit from "express-rate-limit";


// Ruta Global
import router from "./routes";

const app = express();



// Middleware
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // Limitar cada IP a 100 solicitudes por ventana
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true // Permitir el envío de cookies
}));
app.use(compression());
app.use(morgan("combined"));
app.use(express.json());
app.use(cookieParser()); // Middleware para parsear cookies

// Rutas
app.use("/api", router);

// Documentación Swagger
setupSwagger(app);

export default app;
