const express = require("express");
const { THRESHOLDS } = require("../lib/riskEngine");

const router = express.Router();

const VALID_PROVIDERS = new Set(["ollama", "gemini", "plantilla-local"]);

// Espejo de lib/aiClient.js#getProviderOrder: solo lectura, para que la
// pantalla de Configuración muestre el orden real sin duplicar la lógica.
function getProviderOrder() {
  const aiMode = (process.env.AI_MODE || "offline").toLowerCase();
  const customOrder = (process.env.AI_PROVIDER_ORDER || "")
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider) => VALID_PROVIDERS.has(provider));

  if (customOrder.length) return { aiMode, providerOrder: [...new Set(customOrder)], personalizado: true };
  if (aiMode === "cloud-first") return { aiMode, providerOrder: ["gemini", "ollama", "plantilla-local"], personalizado: false };
  if (aiMode === "hybrid") return { aiMode, providerOrder: ["ollama", "gemini", "plantilla-local"], personalizado: false };
  return { aiMode, providerOrder: ["ollama", "plantilla-local"], personalizado: false };
}

router.get("/", (req, res) => {
  const { aiMode, providerOrder, personalizado } = getProviderOrder();

  res.json({
    ia: {
      modo: aiMode,
      ordenProveedores: providerOrder,
      personalizado,
      geminiConfigurado: Boolean(process.env.GEMINI_API_KEY),
    },
    riesgo: {
      umbrales: THRESHOLDS,
      regla: "2+ señales activas = Alto, 1 señal = Medio, 0 señales = Bajo",
      ventana: "Promedio de las primeras 2 semanas vs. las últimas 2 semanas del historial",
    },
    limites: {
      recomendacionesPorVentana: Number(process.env.RECOMMENDATION_RATE_LIMIT_MAX || 30),
      ventanaMinutos: 15,
    },
  });
});

module.exports = router;
