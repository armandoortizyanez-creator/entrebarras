-- ─────────────────────────────────────────────────────────────────────────────
-- Eliminar un atleta y volver a crearlo dejaba una ficha paralela
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Secuencia real, con 19 segundos de diferencia:
--
--   12:58:16  el coach elimina la ficha de un atleta (borrado suave)
--   12:58:35  crea otra con los mismos datos, porque la primera desaparecio
--
-- La ficha eliminada seguia siendo la que tenia el vinculo con la CUENTA de la
-- persona. La nueva no. A partir de ahi el coach asignaba rutinas a la ficha
-- nueva y el atleta, que entraba con su cuenta, no veia nada.
--
-- El indice unico de la 018 empeoraba esto: como no excluia las eliminadas,
-- crear de nuevo con el mismo correo quedaba bloqueado para siempre contra un
-- registro que ya no existe para nadie. Se corrige en la 018 misma.
--
-- Aca queda el criterio en la base: al reactivar una ficha eliminada se
-- conserva su id, y con el todo lo que cuelga -asignaciones, sesiones, marcas
-- y el vinculo con la cuenta-. Crear una paralela pierde justamente eso.

-- Ficha restaurada en produccion tras la fusion de la 017, que la habia elegido
-- como destino sin comprobar que estaba eliminada.
UPDATE athletes
SET    deleted_at = NULL, status = 'active', updated_at = now()
WHERE  deleted_at IS NOT NULL
  AND  user_id IS NOT NULL
  AND  EXISTS (SELECT 1 FROM athlete_routines ar WHERE ar.athlete_id = athletes.id);
