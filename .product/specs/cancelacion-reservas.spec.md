# Cancelación de reservas

Un usuario con sesión cancela una reserva de un lanzamiento planificado, la reserva se borra y la plaza vuelve a quedar libre en el detalle.

Hoy se reservan plazas en lanzamientos planificados, pero `reservar-pasaje` dejó fuera cancelar una reserva, así que una plaza ocupada no se puede liberar. Esta entrega borra la reserva y libera la plaza. No guarda motivo, ni estado cancelado, ni historial de la cancelación, y no hace reembolsos.

## Historias de usuario

1. Como usuario con sesión, quiero **cancelar una reserva de un lanzamiento planificado**, para liberar esa plaza.
2. Como usuario con sesión, quiero **que la cancelación se rechace si el lanzamiento no está planificado o la reserva no existe**, para no tocar reservas que no se pueden cambiar.

## Fuera de alcance

- Motivo de la cancelación.
- Estado cancelado en la reserva: la reserva se borra.
- Auditoría o historial: hora y usuario de la cancelación.
- Reembolsos, pagos y cobros.
- Notificaciones o emails al pasajero.
- Editar una reserva.
- Cancelar varias reservas en la misma petición.
- Cancelar reservas en un lanzamiento confirmado, exitoso o cancelado.
- Restringir la cancelación al usuario que hizo la reserva.
- Cancelar un lanzamiento (spec `cancelar-lanzamiento`).
- Mostrar pasajeros en el listado de lanzamientos.
- Cancelar sin sesión.
- Roles distintos del usuario autenticado.

## Plan técnico

### back

Misma carpeta `api/bookings/` (controller, service, repository, types y tests). Sin tablas ni columnas nuevas: se borra la fila de `bookings`. La plaza se libera porque `taken` cuenta las filas que quedan. Sesión con `Authorization: Bearer <token>` → `sessions.user_id`, como en la reserva. Cualquier usuario con sesión puede cancelar cualquier reserva, igual que hoy cualquiera puede reservar.

- `DELETE /api/launches/:launchId/bookings/:bookingId` → 204 sin cuerpo.
- `GET /api/launches/:launchId/bookings` ya no devuelve la reserva borrada, y `free` sube en uno.

Errores: 404 si el lanzamiento no existe, si la reserva no existe o si la reserva no es de ese lanzamiento; 409 si el estado del lanzamiento no es `planned`; 401 sin sesión válida. Tests unitarios de controller, service y repository.

### front

Sin rutas nuevas. En `/launches/:launchId`, si el estado es planificado, cada pasajero de la lista tiene un botón para cancelar su reserva. Tras cancelar, sigue en el detalle, quita el pasajero y actualiza las plazas libres (vuelve a mostrar el formulario de reserva si antes no quedaban plazas). Si el estado no es planificado, no muestra el botón.

El cliente envía `Authorization: Bearer <token>`. Método nuevo en `bookings.repository.ts` y cambio en `ab-launch-detail-page` (`launch-detail-page.component.ts` y `launch-detail.view.ts`). Sin sesión, la ruta sigue llevando a `/login`. Tests unitarios del repository y de la vista de detalle.

### e2e

Ampliación de `tests/launches.api.spec.ts`, `tests/launches.page.spec.ts` y `docs/launches.md`. Cubren la cancelación con sesión en un lanzamiento planificado, la plaza liberada en el detalle, la reserva inexistente (404), el rechazo si el lanzamiento no está planificado (409) y el rechazo sin sesión (API 401 y cliente hacia login).

## Criterios de aceptación (EARS)

- [ ] 1. CUANDO un usuario con sesión cancela una reserva de un lanzamiento planificado, LA API DEBERÁ borrar la reserva y DEBERÁ responder 204.
- [ ] 2. CUANDO se ha borrado una reserva, LA API NO DEBERÁ devolverla al consultar las reservas del lanzamiento y DEBERÁ contar una plaza libre más.
- [ ] 3. SI el lanzamiento no existe, la reserva no existe o la reserva no es de ese lanzamiento, LA API DEBERÁ responder 404.
- [ ] 4. SI el lanzamiento no está planificado, LA API NO DEBERÁ borrar la reserva y DEBERÁ responder 409.
- [ ] 5. SI la petición no trae una sesión válida, LA API NO DEBERÁ borrar la reserva y DEBERÁ responder 401.
- [ ] 6. CUANDO un usuario con sesión abre el detalle de un lanzamiento planificado con pasajeros, EL cliente DEBERÁ mostrar una acción de cancelar en cada pasajero.
- [ ] 7. CUANDO un usuario con sesión cancela una reserva en el detalle, EL cliente DEBERÁ quitar el pasajero y DEBERÁ mostrar las plazas libres actualizadas.
- [ ] 8. SI el lanzamiento no está planificado, EL cliente NO DEBERÁ mostrar la acción de cancelar reservas.
- [ ] 9. SI no hay sesión, LA navegación al detalle DEBERÁ llevar a la pantalla de inicio de sesión.
- [ ] 10. CUANDO se cancela una reserva, LA API NO DEBERÁ guardar motivo, estado cancelado, hora ni usuario de la cancelación.
