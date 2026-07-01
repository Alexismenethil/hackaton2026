const express = require("express");
const { pool } = require("../lib/db");
const { calcularRiesgo } = require("../lib/riskEngine");
const { generarRecomendacion } = require("../lib/aiClient");

const router = express.Router();

// Cache en memoria: se pierde al reiniciar el server. No hay tabla en el
// esquema para persistir recomendaciones, y no la necesitamos para la demo.
const cacheRecomendaciones = new Map();
const rateLimitRecomendaciones = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = Number(process.env.RECOMMENDATION_RATE_LIMIT_MAX || 30);

function parseEstudianteId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "ID de estudiante inválido" });
    return null;
  }
  return id;
}

function verificarRateLimit(req, res) {
  const key = req.ip || req.socket.remoteAddress || "anon";
  const now = Date.now();
  const actual = rateLimitRecomendaciones.get(key);

  if (!actual || now - actual.inicio > RATE_LIMIT_WINDOW_MS) {
    rateLimitRecomendaciones.set(key, { inicio: now, total: 1 });
    return true;
  }

  if (actual.total >= RATE_LIMIT_MAX) {
    res.status(429).json({ error: "Demasiadas recomendaciones solicitadas. Intenta nuevamente más tarde." });
    return false;
  }

  actual.total += 1;
  return true;
}

function resumenSalud(valor) {
  if (!valor || valor.toLowerCase().includes("sin antecedentes")) return "Sin antecedentes relevantes reportados";
  return "Antecedente de salud registrado; coordinar con familia o tutoría sin exponer detalles.";
}

function estudianteDetalleDTO(estudiante) {
  return {
    id: estudiante.id,
    nombre_ficticio: estudiante.nombre_ficticio,
    grado: estudiante.grado,
    seccion: estudiante.seccion,
    clasificacion_socioeconomica: estudiante.clasificacion_socioeconomica,
    internet_en_casa: estudiante.internet_en_casa,
    lengua_materna: estudiante.lengua_materna,
    distancia_a_escuela_km: estudiante.distancia_a_escuela_km,
    observacion_docente: estudiante.observacion_docente,
    situacion_laboral_familiar: estudiante.situacion_laboral_familiar,
    costo_estudio_mensual: estudiante.costo_estudio_mensual,
    estudiante_trabaja: estudiante.estudiante_trabaja,
    problemas_salud_antecedentes: resumenSalud(estudiante.problemas_salud_antecedentes),
    es_foraneo: estudiante.es_foraneo,
  };
}

function contextoParaIA(estudiante) {
  return {
    clasificacion_socioeconomica: estudiante.clasificacion_socioeconomica,
    internet_en_casa: estudiante.internet_en_casa,
    lengua_materna: estudiante.lengua_materna,
    distancia_a_escuela_km: estudiante.distancia_a_escuela_km,
    situacion_laboral_familiar: estudiante.situacion_laboral_familiar,
    costo_estudio_mensual: estudiante.costo_estudio_mensual,
    estudiante_trabaja: estudiante.estudiante_trabaja,
    tiene_antecedente_salud: Boolean(
      estudiante.problemas_salud_antecedentes &&
        !estudiante.problemas_salud_antecedentes.toLowerCase().includes("sin antecedentes")
    ),
    es_foraneo: estudiante.es_foraneo,
    observacion_docente: estudiante.observacion_docente,
  };
}

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
    const id = parseEstudianteId(req, res);
    if (!id) return;

    const { rows } = await pool.query("SELECT * FROM estudiantes WHERE id = $1", [id]);
    if (!rows[0]) return res.status(404).json({ error: "Estudiante no encontrado" });

    const { rows: historial } = await pool.query(
      "SELECT * FROM seguimiento_semanal WHERE estudiante_id = $1 ORDER BY semana",
      [id]
    );

    const riesgo = calcularRiesgo(historial);
    res.json({
      estudiante: estudianteDetalleDTO(rows[0]),
      historial,
      riesgo,
      metricasRecientes: metricasRecientes(historial),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/recomendacion", async (req, res, next) => {
  try {
    const id = parseEstudianteId(req, res);
    if (!id) return;
    if (!verificarRateLimit(req, res)) return;

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
      estudiante: estudianteDetalleDTO(rows[0]),
      riesgo,
      metricasRecientes: metricasRecientes(historial),
      contextoIA: contextoParaIA(rows[0]),
    });

    cacheRecomendaciones.set(id, recomendacion);
    res.json(recomendacion);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
