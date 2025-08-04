import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

// Ruta Global
import router from "./routes";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan("combined"));
app.use(express.json());

// Health check
app.use("/api", router);

export default app;
