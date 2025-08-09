import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { setupSwagger } from "./docs/swagger";

// Ruta Global
import router from "./routes";

const app = express();



// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan("combined"));
app.use(express.json());

// Rutas
app.use("/api", router);

// Documentación Swagger
setupSwagger(app);

export default app;
