const assert = require("node:assert/strict");
const test = require("node:test");

function conAiClient(env, callback) {
  const modulePath = require.resolve("../lib/aiClient");
  delete require.cache[modulePath];

  const anteriores = {
    AI_MODE: process.env.AI_MODE,
    AI_PROVIDER_ORDER: process.env.AI_PROVIDER_ORDER,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };

  delete process.env.AI_MODE;
  delete process.env.AI_PROVIDER_ORDER;
  delete process.env.GEMINI_API_KEY;
  Object.assign(process.env, env);

  const aiClient = require("../lib/aiClient");

  try {
    return callback(aiClient);
  } finally {
    delete process.env.AI_MODE;
    delete process.env.AI_PROVIDER_ORDER;
    delete process.env.GEMINI_API_KEY;
    for (const [key, value] of Object.entries(anteriores)) {
      if (value !== undefined) process.env[key] = value;
    }
  }
}

test("usa orden cloud-first por defecto", () => {
  conAiClient({}, ({ getProviderOrderInfo }) => {
    assert.deepEqual(getProviderOrderInfo(), {
      aiMode: "cloud-first",
      providerOrder: ["gemini", "ollama", "plantilla-local"],
      personalizado: false,
    });
  });
});

test("respeta orden personalizado y elimina proveedores duplicados o invalidos", () => {
  conAiClient({ AI_PROVIDER_ORDER: "ollama,gemini,ollama,invalido,plantilla-local" }, ({ getProviderOrderInfo }) => {
    assert.deepEqual(getProviderOrderInfo(), {
      aiMode: "cloud-first",
      providerOrder: ["ollama", "gemini", "plantilla-local"],
      personalizado: true,
    });
  });
});

test("puede responder solo con plantilla local como fallback deterministico", async () => {
  await conAiClient({ AI_PROVIDER_ORDER: "plantilla-local" }, async ({ generarRecomendacion }) => {
    const respuesta = await generarRecomendacion({
      estudiante: {
        nombre_ficticio: "Estudiante Demo",
        grado: "5to Grado",
        seccion: "B",
        clasificacion_socioeconomica: "no_pobre",
        internet_en_casa: true,
        lengua_materna: "Castellano",
      },
      riesgo: {
        nivel: "Bajo",
        senales: [],
        metricas: {
          asistenciaInicio: 92,
          asistenciaFin: 92,
          deltaAsistencia: 0,
          notasInicio: 16,
          notasFin: 16,
          deltaNotas: 0,
          comprensionInicio: 15,
          comprensionFin: 15,
          deltaComprension: 0,
          participacionInicio: 4,
          participacionFin: 4,
          deltaParticipacion: 0,
          tareasInicio: 90,
          tareasFin: 90,
          deltaTareas: 0,
        },
      },
    });

    assert.equal(respuesta.fuente, "plantilla-local");
    assert.match(respuesta.recomendacion, /Seguimiento preventivo/);
  });
});
