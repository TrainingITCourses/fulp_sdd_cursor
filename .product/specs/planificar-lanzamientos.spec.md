# Planificar lanzamientos

Los usuarios con sesión pueden planificar un lanzamiento futuro de un cohete no inhabilitado, con un precio por pasajero, y el lanzamiento queda en estado planificado.

Hoy la flota existe, pero no hay lanzamientos. Esta entrega solo crea y consulta lanzamientos futuros. El estado nace planificado y no cambia. No incluye confirmar, marcar exitoso, cancelar, editar, borrar ni reservar plazas.

## Historias de usuario

1. Como usuario con sesión, quiero **planificar un lanzamiento futuro de un cohete no inhabilitado con un precio por pasajero**, para dejarlo preparado en estado planificado.
2. Como usuario con sesión, quiero **consultar el listado y el detalle de los lanzamientos**, para ver lo ya planificado.

## Fuera de alcance

- Confirmar, marcar como exitoso o cancelar un lanzamiento.
- Editar la fecha, el cohete o el precio.
- Borrar lanzamientos.
- Reservas, plazas y pasajeros.
- Planificar un cohete inhabilitado o una fecha que no sea futura.
- Moneda, impuestos y descuentos.
- Roles distintos del usuario autenticado.
- Gestión de lanzamientos por visitantes sin sesión.

## Plan técnico

### back

Carpeta `api/launches/` (controller, service, repository, types y tests). Tabla SQLite `launches`: `id`, `rocket_id`, `scheduled_at` en ISO 8601, `price_per_passenger` (número mayor que cero), `status` siempre `planned` en esta entrega, `created_at` en ISO 8601. Los valores de estado posibles son `planned`, `confirmed`, `successful` y `cancelled`; esta entrega solo escribe `planned`.

Sesión existente: cabecera `Authorization: Bearer <token>` contrastada con `sessions`. Sin token o token inválido, 401.

- `POST /api/launches` con `{ rocketId, scheduledAt, pricePerPassenger }` → 201 y el lanzamiento (`status: "planned"`). El cuerpo no lleva estado.
- `GET /api/launches` → 200, todos los lanzamientos, ordenados por `scheduled_at`.
- `GET /api/launches/:launchId` → 200 o 404.

Errores: 400 si falta el cohete, la fecha no es ISO 8601 o no es futura, el precio no es un número mayor que cero, o el cuerpo trae un estado; 404 si el cohete no existe o el id del lanzamiento no existe; 409 si el cohete está inhabilitado; 401 sin sesión válida. Tests unitarios de controller, service y repository.

### front

Rutas `/launches` (listado), `/launches/new` (alta) y `/launches/:launchId` (detalle de solo lectura). Enlace de menú "Launches" solo con sesión. Sin sesión, esas rutas llevan a `/login`.

El alta pide un cohete no inhabilitado, una fecha futura y el precio por pasajero. El selector de cohetes no muestra inhabilitados. Tras crear, abre el detalle. El detalle muestra cohete, fecha, precio por pasajero y estado planificado, sin acciones de cambio.

El cliente envía `Authorization: Bearer <token>` en `http-client`. Repository `launches.repository.ts` y páginas `ab-launches-page`, `ab-launch-form-page`, `ab-launch-detail-page`. Tests unitarios del repository y de la redirección sin sesión.

### e2e

`tests/launches.api.spec.ts`, `tests/launches.page.spec.ts` y `docs/launches.md`. Cubren el alta y la consulta con sesión, el rechazo de cohete inhabilitado o fecha no futura, y el rechazo sin sesión (API 401 y cliente hacia login).

## Criterios de aceptación (EARS)

- [ ] 1. CUANDO un usuario con sesión envía un cohete no inhabilitado, una fecha futura en ISO 8601 y un precio por pasajero mayor que cero, LA API DEBERÁ crear el lanzamiento en estado planificado y devolverlo.
- [ ] 2. SI el cohete no existe, LA API NO DEBERÁ crear el lanzamiento y DEBERÁ responder 404.
- [ ] 3. SI el cohete está inhabilitado, LA API NO DEBERÁ crear el lanzamiento y DEBERÁ responder 409.
- [ ] 4. SI la fecha no es ISO 8601 o no es futura, LA API NO DEBERÁ crear el lanzamiento y DEBERÁ responder 400.
- [ ] 5. SI el precio por pasajero no es un número mayor que cero, LA API NO DEBERÁ crear el lanzamiento y DEBERÁ responder 400.
- [ ] 6. SI el cuerpo incluye un estado, LA API NO DEBERÁ crear el lanzamiento y DEBERÁ responder 400.
- [ ] 7. SI la petición no trae una sesión válida, LA API NO DEBERÁ crear ni consultar lanzamientos y DEBERÁ responder 401.
- [ ] 8. CUANDO un usuario con sesión consulta los lanzamientos, LA API DEBERÁ devolverlos con cohete, fecha, precio por pasajero y estado, ordenados por fecha.
- [ ] 9. CUANDO un usuario con sesión consulta un lanzamiento existente, LA API DEBERÁ devolver el cohete, la fecha, el precio por pasajero y el estado planificado.
- [ ] 10. SI el identificador del lanzamiento no existe, LA API DEBERÁ responder 404.
- [ ] 11. CUANDO un usuario con sesión da de alta un lanzamiento, EL cliente DEBERÁ pedir un cohete no inhabilitado, una fecha futura y el precio por pasajero, y DEBERÁ abrir el detalle en estado planificado.
- [ ] 12. CUANDO un usuario con sesión abre el listado, EL cliente DEBERÁ mostrar fecha, cohete, precio por pasajero y estado.
- [ ] 13. SI no hay sesión, LA navegación al listado, al alta o al detalle DEBERÁ llevar a la pantalla de inicio de sesión.
- [ ] 14. LA API NO DEBERÁ exponer confirmación, éxito, cancelación, edición ni borrado de lanzamientos.
