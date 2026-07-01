-- Espejo de backend/db/schema.sql para acceso rapido durante evaluacion.

CREATE TABLE estudiantes (
  id SERIAL PRIMARY KEY,
  nombre_ficticio VARCHAR(100),
  grado VARCHAR(20),
  seccion VARCHAR(10),
  clasificacion_socioeconomica VARCHAR(20) CHECK (
    clasificacion_socioeconomica IN ('no_pobre', 'pobre', 'pobre_extremo')
  ),
  internet_en_casa BOOLEAN DEFAULT FALSE,
  lengua_materna VARCHAR(50),
  distancia_a_escuela_km NUMERIC(5,2),
  observacion_docente TEXT,
  situacion_laboral_familiar VARCHAR(120),
  costo_estudio_mensual NUMERIC(7,2),
  estudiante_trabaja BOOLEAN DEFAULT FALSE,
  problemas_salud_antecedentes TEXT,
  es_foraneo BOOLEAN DEFAULT FALSE
);

CREATE TABLE seguimiento_semanal (
  id SERIAL PRIMARY KEY,
  estudiante_id INTEGER REFERENCES estudiantes(id),
  semana INTEGER,
  asistencia_pct NUMERIC(5,2),
  promedio_notas NUMERIC(4,2),
  comprension_lectora NUMERIC(4,2),
  participacion_score INTEGER,
  tareas_entregadas_pct NUMERIC(5,2)
);
