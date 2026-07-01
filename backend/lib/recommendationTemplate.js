// Tercer nivel del fallback de IA: no depende de red ni de ningún modelo,
// así que siempre puede responder aunque Gemini y Ollama fallen.
const ACCIONES_POR_TIPO = {
  asistencia:
    "conversar con el estudiante y, de ser necesario, contactar al apoderado para entender qué está impidiendo la asistencia regular",
  notas:
    "revisar con el estudiante los temas donde bajó su rendimiento y ofrecer una sesión corta de refuerzo",
  comprension:
    "trabajar una lectura breve con preguntas guiadas y comprobar comprensión antes de dejar tareas independientes",
  participacion:
    "generar espacios de participación de bajo riesgo (trabajo en pares, preguntas dirigidas) para reconstruir su confianza en clase",
  tareas:
    "acordar una meta pequeña de entrega para esta semana y revisar si la carga o los recursos están impidiendo completar las tareas",
};

function contextoApoyo(estudiante) {
  const acciones = [];

  if (estudiante.internet_en_casa === false) {
    acciones.push("priorizar material impreso o actividades que no dependan de internet en casa");
  }

  if (["pobre", "pobre_extremo"].includes(estudiante.clasificacion_socioeconomica)) {
    acciones.push("coordinar apoyos disponibles sin presentar la situación económica como causa del riesgo");
  }

  if (estudiante.lengua_materna && estudiante.lengua_materna.toLowerCase() !== "castellano") {
    acciones.push(`usar consignas claras y, si es posible, apoyo bilingüe en ${estudiante.lengua_materna}`);
  }

  if (Number(estudiante.distancia_a_escuela_km) >= 5 || estudiante.es_foraneo) {
    acciones.push("considerar el traslado y acordar seguimiento flexible si hay dificultades para llegar");
  }

  if (estudiante.estudiante_trabaja) {
    acciones.push("revisar horarios y proponer una carga semanal realista");
  }

  if (
    estudiante.problemas_salud_antecedentes &&
    !estudiante.problemas_salud_antecedentes.toLowerCase().includes("sin antecedentes")
  ) {
    acciones.push("coordinar con familia o tutoría sin diagnosticar ni exponer información sensible de salud");
  }

  return acciones;
}

function fraseContexto(estudiante) {
  const acciones = contextoApoyo(estudiante);
  if (!acciones.length) return "";
  return ` Para adaptar el apoyo, conviene ${acciones.slice(0, 2).join(" y ")}.`;
}

function generarRecomendacionTemplate({ estudiante, riesgo }) {
  const { nivel, senales } = riesgo;
  const ajusteContexto = fraseContexto(estudiante);

  if (nivel === "Bajo") {
    return {
      explicacion: `${estudiante.nombre_ficticio} mantiene una tendencia estable en las métricas de seguimiento durante las últimas semanas registradas, sin señales de alerta activas.`,
      recomendacion:
        `Seguimiento preventivo de rutina: no se requiere intervención. Se sugiere una breve retroalimentación positiva al estudiante para reforzar la constancia mostrada.${ajusteContexto}`,
    };
  }

  const detalles = senales.map((s) => `${s.resumen} [Semana ${s.semana}]`).join(" ");

  if (nivel === "Medio") {
    const senal = senales[0];
    return {
      explicacion: `Se detectó una señal a seguir en ${estudiante.nombre_ficticio}: ${detalles}`,
      recomendacion: `Vale la pena revisar esta situación pronto: se sugiere ${ACCIONES_POR_TIPO[senal.tipo]}.${ajusteContexto}`,
    };
  }

  return {
    explicacion: `Se detectaron múltiples señales en ${estudiante.nombre_ficticio} que ameritan atención prioritaria: ${detalles}`,
    recomendacion:
      `Se sugiere agendar una reunión con los padres o apoderados esta semana para conversar sobre los cambios observados, e involucrar al tutor o psicólogo escolar si la institución cuenta con uno. El objetivo es entender qué factores externos podrían estar afectando al estudiante y ofrecer apoyo, no sancionar.${ajusteContexto}`,
  };
}

module.exports = { generarRecomendacionTemplate };
