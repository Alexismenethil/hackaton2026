const assert = require("node:assert/strict");
const test = require("node:test");

const { calcularRiesgo, THRESHOLDS } = require("../lib/riskEngine");

function semana({
  semana,
  asistencia = 92,
  notas = 16,
  comprension = 15,
  participacion = 4,
  tareas = 90,
}) {
  return {
    semana,
    asistencia_pct: asistencia,
    promedio_notas: notas,
    comprension_lectora: comprension,
    participacion_score: participacion,
    tareas_entregadas_pct: tareas,
  };
}

test("clasifica riesgo Alto cuando hay dos o mas senales activas", () => {
  const riesgo = calcularRiesgo([
    semana({ semana: 4, asistencia: 70, notas: 12, tareas: 60 }),
    semana({ semana: 1, asistencia: 95, notas: 17, tareas: 96 }),
    semana({ semana: 3, asistencia: 76, notas: 13, tareas: 62 }),
    semana({ semana: 2, asistencia: 94, notas: 16.5, tareas: 94 }),
  ]);

  assert.equal(riesgo.nivel, "Alto");
  assert.deepEqual(
    riesgo.senales.map((senal) => senal.tipo),
    ["asistencia", "notas", "tareas"]
  );
  assert.equal(riesgo.metricas.deltaAsistencia, 21.5);
  assert.equal(riesgo.metricas.deltaNotas, 4.3);
});

test("clasifica riesgo Medio con una sola senal y respeta umbral estricto", () => {
  const riesgo = calcularRiesgo([
    semana({ semana: 1, asistencia: 95, notas: 16, comprension: 15, participacion: 4, tareas: 90 }),
    semana({ semana: 2, asistencia: 95, notas: 16, comprension: 15, participacion: 4, tareas: 90 }),
    semana({ semana: 3, asistencia: 80, notas: 14, comprension: 13, participacion: 2.5, tareas: 70 }),
    semana({ semana: 4, asistencia: 79, notas: 14, comprension: 13, participacion: 2.5, tareas: 70 }),
  ]);

  assert.equal(riesgo.nivel, "Medio");
  assert.deepEqual(
    riesgo.senales.map((senal) => senal.tipo),
    ["asistencia"]
  );
  assert.equal(THRESHOLDS.notas, 2);
  assert.equal(THRESHOLDS.comprension, 2);
  assert.equal(THRESHOLDS.participacion, 1.5);
  assert.equal(THRESHOLDS.tareas, 20);
});

test("clasifica riesgo Bajo cuando no existen caidas relevantes", () => {
  const riesgo = calcularRiesgo([
    semana({ semana: 1 }),
    semana({ semana: 2, asistencia: 91, notas: 15.8 }),
    semana({ semana: 3, asistencia: 92, notas: 16.1 }),
    semana({ semana: 4, asistencia: 93, notas: 16 }),
  ]);

  assert.equal(riesgo.nivel, "Bajo");
  assert.deepEqual(riesgo.senales, []);
});
