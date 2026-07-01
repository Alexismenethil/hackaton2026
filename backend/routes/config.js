const express = require("express");
const { THRESHOLDS } = require("../lib/riskEngine");
const { getProviderOrderInfo } = require("../lib/aiClient");

const router = express.Router();

router.get("/", (req, res) => {
  const { aiMode, providerOrder, personalizado } = getProviderOrderInfo();

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
