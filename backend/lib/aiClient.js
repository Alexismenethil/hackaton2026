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
const AI_MODE = (process.env.AI_MODE || "cloud-first").toLowerCase();
const VALID_PROVIDERS = new Set(["ollama", "gemini", "plantilla-local"]);

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    explicacion: { type: "string" },
    recomendacion: { type: "string" },
  },
  required: ["explicacion", "recomendacion"],
};

function buildUserPrompt({ estudiante, riesgo, contextoIA }) {
  const contexto = contextoIA || estudiante;
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
- Clasificación socioeconómica simulada: ${contexto.clasificacion_socioeconomica || "no registrada"}
- Internet en casa: ${contexto.internet_en_casa ? "sí" : "no"}
- Lengua materna: ${contexto.lengua_materna || "no registrada"}
- Distancia a la escuela: ${contexto.distancia_a_escuela_km || "no registrada"} km
- Situación laboral familiar: ${contexto.situacion_laboral_familiar || "no registrada"}
- Costo mensual estimado de estudio: S/ ${contexto.costo_estudio_mensual || "no registrado"}
- Estudiante trabaja: ${contexto.estudiante_trabaja ? "sí" : "no"}
- Antecedente de salud registrado: ${contexto.tiene_antecedente_salud ? "sí" : "no"}
- Es foráneo: ${contexto.es_foraneo ? "sí" : "no"}
- Observación docente: ${contexto.observacion_docente || "sin observación"}

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

// Se exporta también para /api/config (routes/config.js), así la pantalla de
// Configuración muestra el orden real sin reimplementar esta lógica.
function getProviderOrderInfo() {
  const customOrder = (process.env.AI_PROVIDER_ORDER || "")
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider) => VALID_PROVIDERS.has(provider));

  if (customOrder.length) {
    return { aiMode: AI_MODE, providerOrder: [...new Set(customOrder)], personalizado: true };
  }

  if (AI_MODE === "cloud-first") {
    return { aiMode: AI_MODE, providerOrder: ["gemini", "ollama", "plantilla-local"], personalizado: false };
  }

  if (AI_MODE === "hybrid") {
    return { aiMode: AI_MODE, providerOrder: ["ollama", "gemini", "plantilla-local"], personalizado: false };
  }

  return { aiMode: AI_MODE, providerOrder: ["ollama", "plantilla-local"], personalizado: false };
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

// Estrategia configurable:
// - cloud-first (por defecto): Gemini -> Ollama -> plantilla local
// - hybrid: Ollama -> Gemini -> plantilla local
// - offline: Ollama -> plantilla local
// También se puede personalizar con AI_PROVIDER_ORDER=gemini,ollama,plantilla-local
// para definir el orden exacto.
async function generarRecomendacion(payload) {
  const { providerOrder } = getProviderOrderInfo();

  for (const provider of providerOrder) {
    if (provider === "ollama") {
      try {
        const resultado = await callOllama(payload);
        return { ...resultado, fuente: "ollama" };
      } catch (err) {
        console.warn(`[IA] Ollama no disponible (${err.message}).`);
      }
      continue;
    }

    if (provider === "gemini") {
      try {
        const resultado = await callGemini(payload);
        return { ...resultado, fuente: "gemini" };
      } catch (err) {
        console.warn(`[IA] Gemini no disponible (${err.message}).`);
      }
      continue;
    }

    if (provider === "plantilla-local") {
      return { ...generarRecomendacionTemplate(payload), fuente: "plantilla-local" };
    }
  }

  return { ...generarRecomendacionTemplate(payload), fuente: "plantilla-local" };
}

module.exports = { generarRecomendacion, getProviderOrderInfo };
