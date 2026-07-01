require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// PRNG determinístico (mulberry32) para que el dataset sea reproducible entre
// corridas del seed, en vez de depender de Math.random() puro.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(valor, min, max) {
  return Math.min(max, Math.max(min, valor));
}

function jitter(rng, amplitud) {
  return (rng() * 2 - 1) * amplitud;
}

// 8 semanas interpolando entre `inicio` (semanas 1 a semanaQuiebre-1) y `fin`
// (alcanzado en la semana 8), con ruido determinístico por estudiante.
function generarSerie({ rng, inicio, fin, semanaQuiebre = 5, amplitudRuido, min, max, decimales }) {
  const semanas = [];
  for (let semana = 1; semana <= 8; semana++) {
    let base;
    if (semana < semanaQuiebre) {
      base = inicio;
    } else {
      const progreso = (semana - semanaQuiebre + 1) / (8 - semanaQuiebre + 1);
      base = inicio + (fin - inicio) * progreso;
    }
    const valor = clamp(base + jitter(rng, amplitudRuido), min, max);
    semanas.push(Number(valor.toFixed(decimales)));
  }
  return semanas;
}

function generarSerieEntera(opciones) {
  return generarSerie({ ...opciones, decimales: 0 }).map((v) => Math.round(clamp(v, opciones.min, opciones.max)));
}

// Categorías de tendencia (ver PLAN.md): sano (~40%), caída de asistencia
// (~25%), caída de notas (~20%), caída de participación (~15%). Dos casos
// "combo" cruzan dos señales a la vez para que existan ejemplos de riesgo
// Alto realistas, no solo Medio.
const CATEGORIAS = {
  sano: (rng) => ({
    asistencia: generarSerie({ rng, inicio: 93, fin: 93, amplitudRuido: 3, min: 85, max: 100, decimales: 2 }),
    notas: generarSerie({ rng, inicio: 16, fin: 16, amplitudRuido: 0.8, min: 12, max: 19, decimales: 2 }),
    comprension: generarSerie({ rng, inicio: 15.5, fin: 15.5, amplitudRuido: 0.9, min: 12, max: 19, decimales: 2 }),
    participacion: generarSerieEntera({ rng, inicio: 4.5, fin: 4.5, amplitudRuido: 0.4, min: 3, max: 5 }),
    tareas: generarSerie({ rng, inicio: 94, fin: 94, amplitudRuido: 4, min: 80, max: 100, decimales: 2 }),
  }),
  asistencia_baja: (rng) => ({
    asistencia: generarSerie({ rng, inicio: 93, fin: 63, semanaQuiebre: 5, amplitudRuido: 2.5, min: 40, max: 100, decimales: 2 }),
    notas: generarSerie({ rng, inicio: 15, fin: 15, amplitudRuido: 0.7, min: 12, max: 18, decimales: 2 }),
    comprension: generarSerie({ rng, inicio: 14.5, fin: 14.5, amplitudRuido: 0.8, min: 11, max: 18, decimales: 2 }),
    participacion: generarSerieEntera({ rng, inicio: 4, fin: 4, amplitudRuido: 0.4, min: 3, max: 5 }),
    tareas: generarSerie({ rng, inicio: 90, fin: 68, semanaQuiebre: 5, amplitudRuido: 4, min: 45, max: 100, decimales: 2 }),
  }),
  asistencia_baja_combo: (rng) => ({
    asistencia: generarSerie({ rng, inicio: 92, fin: 60, semanaQuiebre: 5, amplitudRuido: 2.5, min: 40, max: 100, decimales: 2 }),
    notas: generarSerie({ rng, inicio: 16, fin: 12.5, semanaQuiebre: 5, amplitudRuido: 0.6, min: 8, max: 18, decimales: 2 }),
    comprension: generarSerie({ rng, inicio: 15, fin: 11.5, semanaQuiebre: 5, amplitudRuido: 0.7, min: 8, max: 18, decimales: 2 }),
    participacion: generarSerieEntera({ rng, inicio: 4, fin: 3.5, amplitudRuido: 0.4, min: 2, max: 5 }),
    tareas: generarSerie({ rng, inicio: 88, fin: 58, semanaQuiebre: 5, amplitudRuido: 4, min: 35, max: 100, decimales: 2 }),
  }),
  notas_bajas: (rng) => ({
    asistencia: generarSerie({ rng, inicio: 90, fin: 90, amplitudRuido: 2.5, min: 82, max: 98, decimales: 2 }),
    notas: generarSerie({ rng, inicio: 16.5, fin: 10, semanaQuiebre: 4, amplitudRuido: 0.6, min: 7, max: 18, decimales: 2 }),
    comprension: generarSerie({ rng, inicio: 16, fin: 9.5, semanaQuiebre: 4, amplitudRuido: 0.7, min: 6, max: 18, decimales: 2 }),
    participacion: generarSerieEntera({ rng, inicio: 4, fin: 4, amplitudRuido: 0.4, min: 3, max: 5 }),
    tareas: generarSerie({ rng, inicio: 89, fin: 82, amplitudRuido: 5, min: 65, max: 100, decimales: 2 }),
  }),
  participacion_baja: (rng) => ({
    asistencia: generarSerie({ rng, inicio: 91, fin: 91, amplitudRuido: 2.5, min: 83, max: 98, decimales: 2 }),
    notas: generarSerie({ rng, inicio: 15, fin: 15, amplitudRuido: 0.7, min: 12, max: 18, decimales: 2 }),
    comprension: generarSerie({ rng, inicio: 14.5, fin: 14.5, amplitudRuido: 0.8, min: 11, max: 18, decimales: 2 }),
    participacion: generarSerieEntera({ rng, inicio: 4.5, fin: 1.8, semanaQuiebre: 5, amplitudRuido: 0.3, min: 1, max: 5 }),
    tareas: generarSerie({ rng, inicio: 90, fin: 76, semanaQuiebre: 5, amplitudRuido: 4, min: 55, max: 100, decimales: 2 }),
  }),
  participacion_baja_combo: (rng) => ({
    asistencia: generarSerie({ rng, inicio: 91, fin: 72, semanaQuiebre: 5, amplitudRuido: 2.5, min: 50, max: 98, decimales: 2 }),
    notas: generarSerie({ rng, inicio: 15, fin: 15, amplitudRuido: 0.7, min: 12, max: 18, decimales: 2 }),
    comprension: generarSerie({ rng, inicio: 14.5, fin: 14, amplitudRuido: 0.8, min: 11, max: 18, decimales: 2 }),
    participacion: generarSerieEntera({ rng, inicio: 4.5, fin: 1.7, semanaQuiebre: 5, amplitudRuido: 0.3, min: 1, max: 5 }),
    tareas: generarSerie({ rng, inicio: 91, fin: 58, semanaQuiebre: 5, amplitudRuido: 4, min: 35, max: 100, decimales: 2 }),
  }),
};

const ESTUDIANTES = [
  {
    nombre: "Carlos Quispe",
    grado: "5to Grado",
    seccion: "B",
    categoria: "asistencia_baja_combo",
    contexto: {
      clasificacion_socioeconomica: "pobre_extremo",
      internet_en_casa: false,
      lengua_materna: "Quechua",
      distancia_a_escuela_km: 6.8,
      observacion_docente: "Faltas recientes coinciden con apoyo en labores familiares.",
      situacion_laboral_familiar: "Ingreso eventual por agricultura",
      costo_estudio_mensual: 38.5,
      estudiante_trabaja: true,
      problemas_salud_antecedentes: "Asma leve reportada por familia",
      es_foraneo: true,
    },
  },
  {
    nombre: "Rosa Mamani",
    grado: "5to Grado",
    seccion: "B",
    categoria: "notas_bajas",
    contexto: {
      clasificacion_socioeconomica: "pobre",
      internet_en_casa: false,
      lengua_materna: "Quechua",
      distancia_a_escuela_km: 3.2,
      observacion_docente: "Se esfuerza en clase, pero muestra dificultad en lectura de consignas.",
      situacion_laboral_familiar: "Madre con empleo temporal",
      costo_estudio_mensual: 26.0,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Sin antecedentes relevantes reportados",
      es_foraneo: false,
    },
  },
  {
    nombre: "Mateo Condori",
    grado: "5to Grado",
    seccion: "B",
    categoria: "sano",
    contexto: {
      clasificacion_socioeconomica: "no_pobre",
      internet_en_casa: true,
      lengua_materna: "Castellano",
      distancia_a_escuela_km: 1.1,
      observacion_docente: "Mantiene rutina estable y participa con regularidad.",
      situacion_laboral_familiar: "Padre con empleo fijo",
      costo_estudio_mensual: 52.0,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Sin antecedentes relevantes reportados",
      es_foraneo: false,
    },
  },
  {
    nombre: "Elena Yucra",
    grado: "5to Grado",
    seccion: "B",
    categoria: "participacion_baja_combo",
    contexto: {
      clasificacion_socioeconomica: "pobre",
      internet_en_casa: false,
      lengua_materna: "Quechua",
      distancia_a_escuela_km: 4.7,
      observacion_docente: "Evita leer en voz alta desde las ultimas evaluaciones.",
      situacion_laboral_familiar: "Cuidado de hermanos por las tardes",
      costo_estudio_mensual: 31.5,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Cansancio frecuente observado, sin diagnostico registrado",
      es_foraneo: true,
    },
  },
  {
    nombre: "Javier Huamán",
    grado: "5to Grado",
    seccion: "B",
    categoria: "sano",
    contexto: {
      clasificacion_socioeconomica: "no_pobre",
      internet_en_casa: true,
      lengua_materna: "Castellano",
      distancia_a_escuela_km: 0.8,
      observacion_docente: "Buen acompanamiento familiar.",
      situacion_laboral_familiar: "Comercio familiar estable",
      costo_estudio_mensual: 46.0,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Sin antecedentes relevantes reportados",
      es_foraneo: false,
    },
  },
  {
    nombre: "Sonia Flores",
    grado: "5to Grado",
    seccion: "B",
    categoria: "notas_bajas",
    contexto: {
      clasificacion_socioeconomica: "pobre_extremo",
      internet_en_casa: false,
      lengua_materna: "Aimara",
      distancia_a_escuela_km: 5.9,
      observacion_docente: "Entrega tareas incompletas cuando hay actividades de cosecha.",
      situacion_laboral_familiar: "Ingreso variable por venta ambulante",
      costo_estudio_mensual: 24.0,
      estudiante_trabaja: true,
      problemas_salud_antecedentes: "Migrañas ocasionales reportadas",
      es_foraneo: false,
    },
  },
  {
    nombre: "Ana Torres",
    grado: "5to Grado",
    seccion: "A",
    categoria: "sano",
    contexto: {
      clasificacion_socioeconomica: "no_pobre",
      internet_en_casa: true,
      lengua_materna: "Castellano",
      distancia_a_escuela_km: 1.5,
      observacion_docente: "Lidera trabajos grupales con buena disposicion.",
      situacion_laboral_familiar: "Empleo formal",
      costo_estudio_mensual: 58.0,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Sin antecedentes relevantes reportados",
      es_foraneo: false,
    },
  },
  {
    nombre: "Luis Apaza",
    grado: "5to Grado",
    seccion: "A",
    categoria: "asistencia_baja",
    contexto: {
      clasificacion_socioeconomica: "pobre",
      internet_en_casa: false,
      lengua_materna: "Quechua",
      distancia_a_escuela_km: 7.4,
      observacion_docente: "El traslado se complica cuando llueve.",
      situacion_laboral_familiar: "Trabajo agricola temporal",
      costo_estudio_mensual: 35.0,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Sin antecedentes relevantes reportados",
      es_foraneo: true,
    },
  },
  {
    nombre: "Fiorella Choque",
    grado: "5to Grado",
    seccion: "A",
    categoria: "notas_bajas",
    contexto: {
      clasificacion_socioeconomica: "pobre",
      internet_en_casa: true,
      lengua_materna: "Castellano",
      distancia_a_escuela_km: 2.0,
      observacion_docente: "Comprende oralmente, pero falla al resolver textos largos.",
      situacion_laboral_familiar: "Madre independiente",
      costo_estudio_mensual: 42.0,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Dificultad visual sospechada, pendiente de revision",
      es_foraneo: false,
    },
  },
  {
    nombre: "Diego Ramos",
    grado: "4to Grado",
    seccion: "B",
    categoria: "asistencia_baja",
    contexto: {
      clasificacion_socioeconomica: "pobre_extremo",
      internet_en_casa: false,
      lengua_materna: "Quechua",
      distancia_a_escuela_km: 8.3,
      observacion_docente: "Vive temporalmente con un familiar durante la semana.",
      situacion_laboral_familiar: "Ingreso familiar informal",
      costo_estudio_mensual: 29.0,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Bronquitis recurrente reportada",
      es_foraneo: true,
    },
  },
  {
    nombre: "Milagros Ccama",
    grado: "4to Grado",
    seccion: "B",
    categoria: "participacion_baja",
    contexto: {
      clasificacion_socioeconomica: "pobre",
      internet_en_casa: false,
      lengua_materna: "Quechua",
      distancia_a_escuela_km: 2.9,
      observacion_docente: "Responde mejor en grupos pequenos.",
      situacion_laboral_familiar: "Cuidado familiar compartido",
      costo_estudio_mensual: 33.0,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Sin antecedentes relevantes reportados",
      es_foraneo: false,
    },
  },
  {
    nombre: "Bruno Vilca",
    grado: "4to Grado",
    seccion: "B",
    categoria: "sano",
    contexto: {
      clasificacion_socioeconomica: "no_pobre",
      internet_en_casa: true,
      lengua_materna: "Castellano",
      distancia_a_escuela_km: 1.8,
      observacion_docente: "Buen avance en lectura y matematicas.",
      situacion_laboral_familiar: "Negocio familiar",
      costo_estudio_mensual: 49.0,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Sin antecedentes relevantes reportados",
      es_foraneo: false,
    },
  },
  {
    nombre: "Camila Paredes",
    grado: "4to Grado",
    seccion: "A",
    categoria: "sano",
    contexto: {
      clasificacion_socioeconomica: "no_pobre",
      internet_en_casa: true,
      lengua_materna: "Castellano",
      distancia_a_escuela_km: 0.6,
      observacion_docente: "Asistencia constante y apoyo familiar activo.",
      situacion_laboral_familiar: "Empleo formal",
      costo_estudio_mensual: 55.0,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Sin antecedentes relevantes reportados",
      es_foraneo: false,
    },
  },
  {
    nombre: "Renzo Suni",
    grado: "4to Grado",
    seccion: "A",
    categoria: "asistencia_baja",
    contexto: {
      clasificacion_socioeconomica: "pobre",
      internet_en_casa: false,
      lengua_materna: "Quechua",
      distancia_a_escuela_km: 6.1,
      observacion_docente: "Ha faltado los lunes por tareas de apoyo familiar.",
      situacion_laboral_familiar: "Trabajo familiar de campo",
      costo_estudio_mensual: 32.0,
      estudiante_trabaja: true,
      problemas_salud_antecedentes: "Sin antecedentes relevantes reportados",
      es_foraneo: true,
    },
  },
  {
    nombre: "Valentina Cruz",
    grado: "4to Grado",
    seccion: "A",
    categoria: "sano",
    contexto: {
      clasificacion_socioeconomica: "no_pobre",
      internet_en_casa: true,
      lengua_materna: "Castellano",
      distancia_a_escuela_km: 1.0,
      observacion_docente: "Muestra autonomia para organizar sus tareas.",
      situacion_laboral_familiar: "Empleo estable",
      costo_estudio_mensual: 51.0,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Sin antecedentes relevantes reportados",
      es_foraneo: false,
    },
  },
  {
    nombre: "Pedro Huanca",
    grado: "6to Grado",
    seccion: "A",
    categoria: "notas_bajas",
    contexto: {
      clasificacion_socioeconomica: "pobre",
      internet_en_casa: false,
      lengua_materna: "Quechua",
      distancia_a_escuela_km: 3.8,
      observacion_docente: "Necesita refuerzo en comprension inferencial.",
      situacion_laboral_familiar: "Apoyo familiar en comercio",
      costo_estudio_mensual: 37.0,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Sin antecedentes relevantes reportados",
      es_foraneo: false,
    },
  },
  {
    nombre: "Lucía Mayta",
    grado: "6to Grado",
    seccion: "A",
    categoria: "sano",
    contexto: {
      clasificacion_socioeconomica: "no_pobre",
      internet_en_casa: true,
      lengua_materna: "Castellano",
      distancia_a_escuela_km: 1.2,
      observacion_docente: "Participa y entrega trabajos a tiempo.",
      situacion_laboral_familiar: "Empleo formal",
      costo_estudio_mensual: 53.0,
      estudiante_trabaja: false,
      problemas_salud_antecedentes: "Sin antecedentes relevantes reportados",
      es_foraneo: false,
    },
  },
  {
    nombre: "Andrés Callo",
    grado: "6to Grado",
    seccion: "A",
    categoria: "asistencia_baja",
    contexto: {
      clasificacion_socioeconomica: "pobre_extremo",
      internet_en_casa: false,
      lengua_materna: "Aimara",
      distancia_a_escuela_km: 9.2,
      observacion_docente: "Llega cansado cuando camina desde comunidad vecina.",
      situacion_laboral_familiar: "Ingreso eventual por ganaderia",
      costo_estudio_mensual: 28.0,
      estudiante_trabaja: true,
      problemas_salud_antecedentes: "Dolor de rodilla reportado por traslado largo",
      es_foraneo: true,
    },
  },
];

async function seed() {
  await pool.query("TRUNCATE TABLE seguimiento_semanal, estudiantes RESTART IDENTITY CASCADE");

  for (let i = 0; i < ESTUDIANTES.length; i++) {
    const { nombre, grado, seccion, categoria, contexto } = ESTUDIANTES[i];
    const rng = mulberry32(1000 + i * 37);

    const { rows } = await pool.query(
      `INSERT INTO estudiantes (
        nombre_ficticio,
        grado,
        seccion,
        clasificacion_socioeconomica,
        internet_en_casa,
        lengua_materna,
        distancia_a_escuela_km,
        observacion_docente,
        situacion_laboral_familiar,
        costo_estudio_mensual,
        estudiante_trabaja,
        problemas_salud_antecedentes,
        es_foraneo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [
        nombre,
        grado,
        seccion,
        contexto.clasificacion_socioeconomica,
        contexto.internet_en_casa,
        contexto.lengua_materna,
        contexto.distancia_a_escuela_km,
        contexto.observacion_docente,
        contexto.situacion_laboral_familiar,
        contexto.costo_estudio_mensual,
        contexto.estudiante_trabaja,
        contexto.problemas_salud_antecedentes,
        contexto.es_foraneo,
      ]
    );
    const estudianteId = rows[0].id;
    const serie = CATEGORIAS[categoria](rng);

    for (let semana = 1; semana <= 8; semana++) {
      await pool.query(
        `INSERT INTO seguimiento_semanal (
          estudiante_id,
          semana,
          asistencia_pct,
          promedio_notas,
          comprension_lectora,
          participacion_score,
          tareas_entregadas_pct
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          estudianteId,
          semana,
          serie.asistencia[semana - 1],
          serie.notas[semana - 1],
          serie.comprension[semana - 1],
          serie.participacion[semana - 1],
          serie.tareas[semana - 1],
        ]
      );
    }

    console.log(`Sembrado: ${nombre} (${categoria})`);
  }

  console.log(`Listo: ${ESTUDIANTES.length} estudiantes con 8 semanas de historial cada uno.`);
  await pool.end();
}

seed().catch((err) => {
  console.error("Error al sembrar la base de datos:", err);
  process.exit(1);
});
