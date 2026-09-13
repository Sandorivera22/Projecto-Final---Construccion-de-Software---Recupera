require("./utils/bigintSerializer");
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const apiRoutes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use(errorHandler);

module.exports = app;
