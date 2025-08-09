import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
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
app.use(cors());
app.use(compression());
app.use(morgan("combined"));
app.use(express.json());

// Rutas
app.use("/api", router);

// Documentación Swagger
setupSwagger(app);

export default app;
