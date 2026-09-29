# Reservar pasaje

Un usuario con sesión reserva una plaza en un lanzamiento planificado indicando el nombre, el email y el teléfono del pasajero, sin superar las 9 plazas del cohete, y ve los pasajeros y las plazas libres en el detalle.

Hoy se pueden planificar y cancelar lanzamientos en cohetes de 9 plazas, pero no se reservan pasajes. Esta entrega crea una reserva de una plaza en un lanzamiento planificado y la muestra en el detalle. No cobra, ni cancela, ni edita la reserva.

## Historias de usuario

1. Como usuario con sesión, quiero **reservar una plaza en un lanzamiento planificado con el nombre, el email y el teléfono del pasajero**, para asignarle esa plaza.
2. Como usuario con sesión, quiero **que la reserva se rechace cuando el lanzamiento ya tiene 9 plazas**, para que no haya overbooking.
3. Como usuario con sesión, quiero **ver en el detalle los pasajeros y las plazas libres**, para saber si cabe otra reserva.

## Fuera de alcance

- Pagos, cobros, moneda, impuestos y descuentos.
- Cancelar, editar o borrar una reserva.
- Reservar más de un pasajero en la misma petición.
- Reservar en un lanzamiento confirmado, exitoso o cancelado.
- Lista de espera.
- Impedir dos reservas con el mismo email o el mismo teléfono.
- Mostrar los pasajeros en el listado de lanzamientos.
- Mostrar qué usuario de sesión hizo la reserva.
- Reservar sin sesión.
- Roles distintos del usuario autenticado.

## Plan técnico

### back

Carpeta `api/bookings/` (controller, service, repository, types y tests). No importa otras carpetas de `api/`. Lee `launches` y `rockets` en SQL. Tabla SQLite `bookings`: `id`, `launch_id`, `passenger_name`, `passenger_email`, `passenger_phone`, `booked_by_user_id`, `created_at` en ISO 8601. La hora y el usuario salen de la sesión (`Authorization: Bearer <token>` → `sessions.user_id`). El cuerpo no los acepta. Una reserva ocupa una plaza. La capacidad es `rockets.capacity` del cohete de ese lanzamiento, siempre 9.

- `POST /api/launches/:launchId/bookings` con `{ name, email, phone }` → 201 y la reserva (`id`, `launchId`, `name`, `email`, `phone`, `createdAt`).
- `GET /api/launches/:launchId/bookings` → 200 con `capacity`, `taken`, `free` y `bookings` ordenados por `created_at`. Sin reservas, `taken` es 0 y `free` es 9.

Errores: 400 si el nombre, el email o el teléfono quedan vacíos al recortar, si el email no contiene `@`, o si el cuerpo trae identificador, hora, usuario o `launchId`; 404 si el lanzamiento no existe; 409 si el estado no es `planned` o si `taken` ya es igual a la capacidad; 401 sin sesión válida. El recuento y el alta ocurren de forma que no se guarda una reserva de más. Tests unitarios de controller, service y repository.

### front

Sin rutas nuevas. En `/launches/:launchId`, el detalle muestra los pasajeros (nombre, email y teléfono) y las plazas libres. Si el estado es planificado y `free` es mayor que cero, pide nombre, email y teléfono. Tras reservar, sigue en el detalle y actualiza la lista y las plazas. Si no quedan plazas, o el estado no es planificado, no muestra el formulario. El listado no muestra pasajeros.

El cliente envía `Authorization: Bearer <token>`. Repository `bookings.repository.ts` y cambio en `ab-launch-detail-page`. Sin sesión, la ruta sigue llevando a `/login`. Tests unitarios del repository y de la página de detalle.

### e2e

Ampliación de `tests/launches.api.spec.ts`, `tests/launches.page.spec.ts` y `docs/launches.md`. Cubren el alta con sesión en un lanzamiento planificado, el pasajero y las plazas libres en el detalle, el rechazo de la reserva número 10, los datos vacíos, el rechazo si el lanzamiento no está planificado, y el rechazo sin sesión (API 401 y cliente hacia login).

## Criterios de aceptación (EARS)

- [ ] 1. CUANDO un usuario con sesión reserva en un lanzamiento planificado con nombre, email y teléfono no vacíos, y quedan plazas, LA API DEBERÁ crear una reserva de una plaza y devolverla con la hora en ISO 8601.
- [ ] 2. SI el nombre, el email o el teléfono quedan vacíos al recortar, o el email no contiene `@`, LA API NO DEBERÁ crear la reserva y DEBERÁ responder 400.
- [ ] 3. SI el cuerpo incluye el identificador, la hora, el usuario o el id del lanzamiento, LA API NO DEBERÁ crear la reserva y DEBERÁ responder 400.
- [ ] 4. SI el identificador del lanzamiento no existe, LA API DEBERÁ responder 404.
- [ ] 5. SI el lanzamiento no está planificado, LA API NO DEBERÁ crear la reserva y DEBERÁ responder 409.
- [ ] 6. SI el lanzamiento planificado ya tiene tantas reservas como la capacidad del cohete, LA API NO DEBERÁ crear otra y DEBERÁ responder 409.
- [ ] 7. SI la petición no trae una sesión válida, LA API NO DEBERÁ crear ni consultar reservas y DEBERÁ responder 401.
- [ ] 8. CUANDO un usuario con sesión consulta las reservas de un lanzamiento, LA API DEBERÁ devolver cada pasajero con nombre, email y teléfono, ordenados por hora de alta, y las plazas ocupadas y libres sobre la capacidad del cohete.
- [ ] 9. CUANDO un usuario con sesión abre el detalle de un lanzamiento planificado con plazas libres, EL cliente DEBERÁ pedir nombre, email y teléfono y, al reservar, DEBERÁ mostrar el pasajero y las plazas libres.
- [ ] 10. SI el lanzamiento planificado no tiene plazas libres, EL cliente NO DEBERÁ mostrar el formulario y DEBERÁ mostrar los pasajeros y que no quedan plazas.
- [ ] 11. SI el lanzamiento no está planificado, EL cliente NO DEBERÁ mostrar el formulario y DEBERÁ mostrar los pasajeros ya reservados.
- [ ] 12. CUANDO un usuario con sesión abre el listado, EL cliente NO DEBERÁ mostrar los pasajeros.
- [ ] 13. SI no hay sesión, LA navegación al detalle DEBERÁ llevar a la pantalla de inicio de sesión.
- [ ] 14. LA API NO DEBERÁ cobrar una reserva ni cancelarla, editarla o borrarla.
