require("dotenv").config();
const express = require("express");
const cors = require("cors");

const estudiantesRouter = require("./routes/estudiantes");
const configRouter = require("./routes/config");

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3002")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use((req, res, next) => {
  const origin = req.get("origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: "Origen no permitido" });
  }
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
  })
);
app.use(express.json({ limit: "100kb" }));

app.use("/api/estudiantes", estudiantesRouter);
app.use("/api/config", configRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`Radar Escolar backend escuchando en http://localhost:${PORT}`);
});
