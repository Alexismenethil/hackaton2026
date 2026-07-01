const assert = require("node:assert/strict");
const test = require("node:test");

const { generarRecomendacionTemplate } = require("../lib/recommendationTemplate");

const estudianteBase = {
  nombre_ficticio: "Estudiante Demo",
  grado: "5to Grado",
  seccion: "B",
  clasificacion_socioeconomica: "pobre",
  internet_en_casa: false,
  lengua_materna: "Quechua",
  distancia_a_escuela_km: 6.8,
  estudiante_trabaja: true,
  problemas_salud_antecedentes: "Antecedente de salud registrado; coordinar con familia o tutoria sin exponer detalles.",
  es_foraneo: true,
};

test("la plantilla para riesgo Alto cita evidencias semanales y propone apoyo no punitivo", () => {
  const respuesta = generarRecomendacionTemplate({
    estudiante: estudianteBase,
    riesgo: {
      nivel: "Alto",
      senales: [
        {
          tipo: "asistencia",
          semana: 6,
          resumen: "La asistencia bajo de 94.5% a 73%.",
        },
        {
          tipo: "notas",
          semana: 7,
          resumen: "El promedio de notas bajo de 16.8 a 12.5.",
        },
      ],
    },
  });

  assert.match(respuesta.explicacion, /\[Semana 6\]/);
  assert.match(respuesta.explicacion, /\[Semana 7\]/);
  assert.match(respuesta.recomendacion, /ofrecer apoyo, no sancionar/);
  assert.match(respuesta.recomendacion, /material impreso/);
});

test("la plantilla para riesgo Bajo mantiene seguimiento preventivo", () => {
  const respuesta = generarRecomendacionTemplate({
    estudiante: { ...estudianteBase, clasificacion_socioeconomica: "no_pobre", internet_en_casa: true },
    riesgo: { nivel: "Bajo", senales: [] },
  });

  assert.match(respuesta.explicacion, /sin señales de alerta activas/);
  assert.match(respuesta.recomendacion, /Seguimiento preventivo de rutina/);
});
