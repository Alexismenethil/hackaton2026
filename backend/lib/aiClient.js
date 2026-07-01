const { GoogleGenAI } = require("@google/genai");
const { RADAR_SYSTEM_PROMPT } = require("../prompts/radarSystemPrompt");
const { generarRecomendacionTemplate } = require("./recommendationTemplate");

// Carga perezosa/defensiva: si el paquete no está disponible el fallback
// simplemente salta a la plantilla local en vez de romper el server.
let ollama = null;
try {
  ollama = require("ollama").default;
} catch {
  ollama = null;
}

const GEMINI_MODEL = "gemini-2.5-flash";
const OLLAMA_MODEL = "qwen2.5:7b";

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    explicacion: { type: "string" },
    recomendacion: { type: "string" },
  },
  required: ["explicacion", "recomendacion"],
};

function buildUserPrompt({ estudiante, riesgo }) {
  const senalesTexto =
    riesgo.senales.map((s) => `- ${s.tipo}: ${s.resumen} (dato clave en la Semana ${s.semana})`).join("\n") ||
    "- Ninguna señal activa (tendencia estable).";

  return `Estudiante: ${estudiante.nombre_ficticio} (${estudiante.grado}, Sección ${estudiante.seccion})
Nivel de riesgo calculado: ${riesgo.nivel}

Señales activas:
${senalesTexto}

Métricas completas (inicio = promedio semanas 1-2, fin = promedio últimas 2 semanas):
- Asistencia: ${riesgo.metricas.asistenciaInicio}% -> ${riesgo.metricas.asistenciaFin}% (delta ${riesgo.metricas.deltaAsistencia})
- Notas (0-20): ${riesgo.metricas.notasInicio} -> ${riesgo.metricas.notasFin} (delta ${riesgo.metricas.deltaNotas})
- Comprensión lectora (0-20): ${riesgo.metricas.comprensionInicio} -> ${riesgo.metricas.comprensionFin} (delta ${riesgo.metricas.deltaComprension})
- Participación (1-5): ${riesgo.metricas.participacionInicio} -> ${riesgo.metricas.participacionFin} (delta ${riesgo.metricas.deltaParticipacion})
- Tareas entregadas: ${riesgo.metricas.tareasInicio}% -> ${riesgo.metricas.tareasFin}% (delta ${riesgo.metricas.deltaTareas})

Contexto de apoyo (no usar para calcular ni justificar el riesgo; solo adaptar la intervención):
- Clasificación socioeconómica simulada: ${estudiante.clasificacion_socioeconomica || "no registrada"}
- Internet en casa: ${estudiante.internet_en_casa ? "sí" : "no"}
- Lengua materna: ${estudiante.lengua_materna || "no registrada"}
- Distancia a la escuela: ${estudiante.distancia_a_escuela_km || "no registrada"} km
- Situación laboral familiar: ${estudiante.situacion_laboral_familiar || "no registrada"}
- Costo mensual estimado de estudio: S/ ${estudiante.costo_estudio_mensual || "no registrado"}
- Estudiante trabaja: ${estudiante.estudiante_trabaja ? "sí" : "no"}
- Antecedentes de salud: ${estudiante.problemas_salud_antecedentes || "no registrados"}
- Es foráneo: ${estudiante.es_foraneo ? "sí" : "no"}
- Observación docente: ${estudiante.observacion_docente || "sin observación"}

Genera la explicación y recomendación siguiendo las reglas del sistema.`;
}

function parseJsonRespuesta(texto) {
  const limpio = texto
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();
  const data = JSON.parse(limpio);
  if (!data.explicacion || !data.recomendacion) throw new Error("Respuesta incompleta");
  return { explicacion: data.explicacion, recomendacion: data.recomendacion };
}

async function callGemini(payload) {
  if (!ai) throw new Error("GEMINI_API_KEY no configurada");
  // Gancho de prueba: FORCE_GEMINI_FAILURE=true fuerza el salto a Ollama sin
  // esperar a que Gemini falle solo (ver .env.example).
  if (process.env.FORCE_GEMINI_FAILURE === "true") {
    throw new Error("Fallo simulado vía FORCE_GEMINI_FAILURE=true");
  }

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: buildUserPrompt(payload) }] }],
    config: {
      systemInstruction: RADAR_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  return parseJsonRespuesta(response.text);
}

async function callOllama(payload) {
  if (!ollama) throw new Error("Cliente de Ollama no disponible");
  if (process.env.FORCE_OLLAMA_FAILURE === "true") {
    throw new Error("Fallo simulado vía FORCE_OLLAMA_FAILURE=true");
  }

  const response = await ollama.chat({
    model: OLLAMA_MODEL,
    format: "json",
    messages: [
      { role: "system", content: `${RADAR_SYSTEM_PROMPT}\n\nResponde solo con el JSON, sin texto adicional.` },
      { role: "user", content: buildUserPrompt(payload) },
    ],
  });

  return parseJsonRespuesta(response.message.content);
}

// Fallback en 3 niveles: Gemini -> Ollama (local) -> plantilla local sin IA.
// Cualquier error en un nivel (falta de API key, sin internet, servidor de
// Ollama apagado, JSON mal formado, etc.) cae al siguiente sin romper la demo.
async function generarRecomendacion(payload) {
  try {
    const resultado = await callGemini(payload);
    return { ...resultado, fuente: "gemini" };
  } catch (err) {
    console.warn(`[IA] Gemini no disponible (${err.message}). Probando Ollama...`);
  }

  try {
    const resultado = await callOllama(payload);
    return { ...resultado, fuente: "ollama" };
  } catch (err) {
    console.warn(`[IA] Ollama no disponible (${err.message}). Usando plantilla local.`);
  }

  return { ...generarRecomendacionTemplate(payload), fuente: "plantilla-local" };
}

module.exports = { generarRecomendacion };
