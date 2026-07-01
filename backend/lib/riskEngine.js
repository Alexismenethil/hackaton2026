// Regla de riesgo determinística (sin ML): compara el promedio de las
// primeras 2 semanas contra las últimas 2, para asistencia, notas,
// comprensión lectora, participación y entrega de tareas.
// 2+ señales activas = Alto, 1 = Medio, 0 = Bajo.
const THRESHOLDS = {
  asistencia: 15, // puntos porcentuales
  notas: 2, // escala vigesimal (0-20)
  comprension: 2, // escala vigesimal (0-20)
  participacion: 1.5, // escala 1-5
  tareas: 20, // puntos porcentuales
};

function promedio(valores) {
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// Semana con la caída más pronunciada entre semanas consecutivas, usada como
// el "dato exacto" que cita la señal (y luego la IA, con el marcador [Semana N]).
function semanaDeMayorCaida(historial, campo) {
  let peorDelta = -Infinity;
  let semana = historial[historial.length - 1].semana;
  for (let i = 1; i < historial.length; i++) {
    const delta = Number(historial[i - 1][campo]) - Number(historial[i][campo]);
    if (delta > peorDelta) {
      peorDelta = delta;
      semana = historial[i].semana;
    }
  }
  return semana;
}

function calcularRiesgo(historialSemanal) {
  const historial = [...historialSemanal].sort((a, b) => a.semana - b.semana);
  const primeras2 = historial.slice(0, 2);
  const ultimas2 = historial.slice(-2);

  const asistenciaInicio = promedio(primeras2.map((s) => Number(s.asistencia_pct)));
  const asistenciaFin = promedio(ultimas2.map((s) => Number(s.asistencia_pct)));
  const notasInicio = promedio(primeras2.map((s) => Number(s.promedio_notas)));
  const notasFin = promedio(ultimas2.map((s) => Number(s.promedio_notas)));
  const comprensionInicio = promedio(primeras2.map((s) => Number(s.comprension_lectora)));
  const comprensionFin = promedio(ultimas2.map((s) => Number(s.comprension_lectora)));
  const participacionInicio = promedio(primeras2.map((s) => Number(s.participacion_score)));
  const participacionFin = promedio(ultimas2.map((s) => Number(s.participacion_score)));
  const tareasInicio = promedio(primeras2.map((s) => Number(s.tareas_entregadas_pct)));
  const tareasFin = promedio(ultimas2.map((s) => Number(s.tareas_entregadas_pct)));

  const deltaAsistencia = asistenciaInicio - asistenciaFin;
  const deltaNotas = notasInicio - notasFin;
  const deltaComprension = comprensionInicio - comprensionFin;
  const deltaParticipacion = participacionInicio - participacionFin;
  const deltaTareas = tareasInicio - tareasFin;

  const senales = [];

  if (deltaAsistencia > THRESHOLDS.asistencia) {
    senales.push({
      tipo: "asistencia",
      semana: semanaDeMayorCaida(historial, "asistencia_pct"),
      valorInicio: round1(asistenciaInicio),
      valorFin: round1(asistenciaFin),
      delta: round1(deltaAsistencia),
      resumen: `La asistencia bajó de ${round1(asistenciaInicio)}% a ${round1(asistenciaFin)}%.`,
    });
  }

  if (deltaNotas > THRESHOLDS.notas) {
    senales.push({
      tipo: "notas",
      semana: semanaDeMayorCaida(historial, "promedio_notas"),
      valorInicio: round1(notasInicio),
      valorFin: round1(notasFin),
      delta: round1(deltaNotas),
      resumen: `El promedio de notas bajó de ${round1(notasInicio)} a ${round1(notasFin)} (escala vigesimal).`,
    });
  }

  if (deltaComprension > THRESHOLDS.comprension) {
    senales.push({
      tipo: "comprension",
      semana: semanaDeMayorCaida(historial, "comprension_lectora"),
      valorInicio: round1(comprensionInicio),
      valorFin: round1(comprensionFin),
      delta: round1(deltaComprension),
      resumen: `La comprensión lectora bajó de ${round1(comprensionInicio)} a ${round1(comprensionFin)} (escala vigesimal).`,
    });
  }

  if (deltaParticipacion > THRESHOLDS.participacion) {
    senales.push({
      tipo: "participacion",
      semana: semanaDeMayorCaida(historial, "participacion_score"),
      valorInicio: round1(participacionInicio),
      valorFin: round1(participacionFin),
      delta: round1(deltaParticipacion),
      resumen: `La participación bajó de ${round1(participacionInicio)} a ${round1(participacionFin)} (escala 1-5).`,
    });
  }

  if (deltaTareas > THRESHOLDS.tareas) {
    senales.push({
      tipo: "tareas",
      semana: semanaDeMayorCaida(historial, "tareas_entregadas_pct"),
      valorInicio: round1(tareasInicio),
      valorFin: round1(tareasFin),
      delta: round1(deltaTareas),
      resumen: `La entrega de tareas bajó de ${round1(tareasInicio)}% a ${round1(tareasFin)}%.`,
    });
  }

  const nivel = senales.length >= 2 ? "Alto" : senales.length === 1 ? "Medio" : "Bajo";

  return {
    nivel,
    senales,
    metricas: {
      asistenciaInicio: round1(asistenciaInicio),
      asistenciaFin: round1(asistenciaFin),
      deltaAsistencia: round1(deltaAsistencia),
      notasInicio: round1(notasInicio),
      notasFin: round1(notasFin),
      deltaNotas: round1(deltaNotas),
      comprensionInicio: round1(comprensionInicio),
      comprensionFin: round1(comprensionFin),
      deltaComprension: round1(deltaComprension),
      participacionInicio: round1(participacionInicio),
      participacionFin: round1(participacionFin),
      deltaParticipacion: round1(deltaParticipacion),
      tareasInicio: round1(tareasInicio),
      tareasFin: round1(tareasFin),
      deltaTareas: round1(deltaTareas),
    },
  };
}

module.exports = { calcularRiesgo, THRESHOLDS };
