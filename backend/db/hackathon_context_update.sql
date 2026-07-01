-- Actualizacion para la demo: contexto socioeconomico y de apoyo.
-- El riesgo NO debe calcularse por pobreza, salud, procedencia o lengua.
-- Esos campos solo adaptan la recomendacion pedagogica.

ALTER TABLE estudiantes
  ADD COLUMN IF NOT EXISTS clasificacion_socioeconomica VARCHAR(20),
  ADD COLUMN IF NOT EXISTS internet_en_casa BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lengua_materna VARCHAR(50),
  ADD COLUMN IF NOT EXISTS distancia_a_escuela_km NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS observacion_docente TEXT,
  ADD COLUMN IF NOT EXISTS situacion_laboral_familiar VARCHAR(120),
  ADD COLUMN IF NOT EXISTS costo_estudio_mensual NUMERIC(7,2),
  ADD COLUMN IF NOT EXISTS estudiante_trabaja BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS problemas_salud_antecedentes TEXT,
  ADD COLUMN IF NOT EXISTS es_foraneo BOOLEAN DEFAULT FALSE;

ALTER TABLE seguimiento_semanal
  ADD COLUMN IF NOT EXISTS comprension_lectora NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS tareas_entregadas_pct NUMERIC(5,2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'estudiantes_clasificacion_socioeconomica_check'
  ) THEN
    ALTER TABLE estudiantes
      ADD CONSTRAINT estudiantes_clasificacion_socioeconomica_check
      CHECK (clasificacion_socioeconomica IN ('no_pobre', 'pobre', 'pobre_extremo'));
  END IF;
END $$;

-- Consulta de reporte para demo: una fila por estudiante con las metricas
-- visibles y el contexto que usara la recomendacion.
SELECT
  e.id,
  e.nombre_ficticio AS nombre,
  e.grado,
  e.seccion,
  ROUND(AVG(CASE WHEN s.semana >= 5 THEN s.asistencia_pct END), 2) AS asistencia_ultimas_4_semanas,
  ROUND(AVG(CASE WHEN s.semana >= 5 THEN s.promedio_notas END), 2) AS promedio_notas,
  ROUND(AVG(CASE WHEN s.semana >= 5 THEN s.comprension_lectora END), 2) AS comprension_lectora,
  ROUND(AVG(CASE WHEN s.semana >= 5 THEN s.participacion_score END), 2) AS participacion,
  ROUND(AVG(CASE WHEN s.semana >= 5 THEN s.tareas_entregadas_pct END), 2) AS tareas_entregadas,
  e.clasificacion_socioeconomica,
  e.internet_en_casa,
  e.lengua_materna,
  e.distancia_a_escuela_km AS distancia_a_escuela,
  e.situacion_laboral_familiar,
  e.costo_estudio_mensual,
  e.estudiante_trabaja,
  e.problemas_salud_antecedentes,
  e.es_foraneo,
  e.observacion_docente
FROM estudiantes e
LEFT JOIN seguimiento_semanal s ON s.estudiante_id = e.id
GROUP BY e.id
ORDER BY e.id;
