-- Consulta de evaluacion para revisar una fila por estudiante con
-- rendimiento reciente y contexto de apoyo usado por la recomendacion.

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
