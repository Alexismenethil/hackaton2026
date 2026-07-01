require("dotenv").config();
const express = require("express");
const cors = require("cors");

const estudiantesRouter = require("./routes/estudiantes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/estudiantes", estudiantesRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`Radar Escolar backend escuchando en http://localhost:${PORT}`);
});
