import app from "./server";
import colors from "colors";
import { AppDataSource } from "./config/database";
import dotenv from "dotenv";
import { runRecurring } from "./jobs/recurring.job";

// Cargar variables de entorno
dotenv.config();


const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "localhost";

// Iniciar base de datos y servidor
AppDataSource.initialize()
  .then(() => {
    console.log(colors.green("Database connected successfully"));

    setInterval(runRecurring, 24 * 60 * 60 * 1000); // cada 24 h
    console.log('⏰ Job de recurrentes iniciado (24 h)');

    app.listen(PORT, HOST, () => {
      console.log(colors.blue(`Server is running on http://${HOST}:${PORT}/`));
    });
  })
  .catch((error) => {
    console.error(colors.red("Error connecting to the database:"), error);
  });
