const express = require("express");
const { pool } = require("../lib/db");
const { calcularRiesgo } = require("../lib/riskEngine");
const { generarRecomendacion } = require("../lib/aiClient");

const router = express.Router();

// Cache en memoria: se pierde al reiniciar el server. No hay tabla en el
// esquema para persistir recomendaciones, y no la necesitamos para la demo.
const cacheRecomendaciones = new Map();

function promedio(valores) {
  if (!valores.length) return null;
  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;
}

function metricasRecientes(historial) {
  const ultimas4 = historial.slice(-4);
  return {
    asistencia_ultimas_4_semanas: promedio(ultimas4.map((h) => Number(h.asistencia_pct))),
    promedio_notas: promedio(ultimas4.map((h) => Number(h.promedio_notas))),
    comprension_lectora: promedio(ultimas4.map((h) => Number(h.comprension_lectora))),
    participacion: promedio(ultimas4.map((h) => Number(h.participacion_score))),
    tareas_entregadas: promedio(ultimas4.map((h) => Number(h.tareas_entregadas_pct))),
  };
}

function contextoResumen(estudiante) {
  const etiquetas = [];
  if (estudiante.clasificacion_socioeconomica === "pobre_extremo") etiquetas.push("Pobre extremo");
  if (estudiante.clasificacion_socioeconomica === "pobre") etiquetas.push("Pobre");
  if (estudiante.internet_en_casa === false) etiquetas.push("Sin internet");
  if (estudiante.estudiante_trabaja) etiquetas.push("Trabaja");
  if (estudiante.es_foraneo) etiquetas.push("Foráneo");
  if (Number(estudiante.distancia_a_escuela_km) >= 5) etiquetas.push("Traslado largo");
  return etiquetas;
}

async function obtenerEstudiantesConHistorial() {
  const { rows: estudiantes } = await pool.query("SELECT * FROM estudiantes ORDER BY id");
  const { rows: historial } = await pool.query("SELECT * FROM seguimiento_semanal ORDER BY estudiante_id, semana");

  const historialPorEstudiante = new Map();
  for (const fila of historial) {
    if (!historialPorEstudiante.has(fila.estudiante_id)) historialPorEstudiante.set(fila.estudiante_id, []);
    historialPorEstudiante.get(fila.estudiante_id).push(fila);
  }

  return estudiantes.map((estudiante) => ({
    estudiante,
    historial: historialPorEstudiante.get(estudiante.id) || [],
  }));
}

router.get("/", async (req, res, next) => {
  try {
    const datos = await obtenerEstudiantesConHistorial();
    const resultado = datos.map(({ estudiante, historial }) => {
      const riesgo = calcularRiesgo(historial);
      return {
        id: estudiante.id,
        nombre_ficticio: estudiante.nombre_ficticio,
        grado: estudiante.grado,
        seccion: estudiante.seccion,
        contextoResumen: contextoResumen(estudiante),
        metricasRecientes: metricasRecientes(historial),
        nivelRiesgo: riesgo.nivel,
        senalPrincipal: riesgo.senales[0]?.resumen || "Sin alertas activas.",
        tendenciaAsistencia: historial.map((h) => Number(h.asistencia_pct)),
        tendenciaNotas: historial.map((h) => Number(h.promedio_notas)),
      };
    });
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query("SELECT * FROM estudiantes WHERE id = $1", [id]);
    if (!rows[0]) return res.status(404).json({ error: "Estudiante no encontrado" });

    const { rows: historial } = await pool.query(
      "SELECT * FROM seguimiento_semanal WHERE estudiante_id = $1 ORDER BY semana",
      [id]
    );

    const riesgo = calcularRiesgo(historial);
    res.json({ estudiante: rows[0], historial, riesgo, metricasRecientes: metricasRecientes(historial) });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/recomendacion", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (cacheRecomendaciones.has(id)) {
      return res.json(cacheRecomendaciones.get(id));
    }

    const { rows } = await pool.query("SELECT * FROM estudiantes WHERE id = $1", [id]);
    if (!rows[0]) return res.status(404).json({ error: "Estudiante no encontrado" });

    const { rows: historial } = await pool.query(
      "SELECT * FROM seguimiento_semanal WHERE estudiante_id = $1 ORDER BY semana",
      [id]
    );

    const riesgo = calcularRiesgo(historial);
    const recomendacion = await generarRecomendacion({
      estudiante: rows[0],
      riesgo,
      metricasRecientes: metricasRecientes(historial),
    });

    cacheRecomendaciones.set(id, recomendacion);
    res.json(recomendacion);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
