# Flota de cohetes

Los usuarios con sesión pueden crear, consultar, editar e inhabilitar cohetes con nombre, alcance Tierra, Luna o Marte y capacidad fija de 9 pasajeros.

Hoy no hay catálogo de cohetes y hace falta antes de ofrecer viajes. Esta entrega solo mantiene la flota: crear, consultar, editar e inhabilitar. No incluye viajes ni reservas.

## Historias de usuario

1. Como usuario con sesión, quiero **registrar un cohete con nombre y alcance**, para incorporarlo al catálogo de la flota.
2. Como usuario con sesión, quiero **consultar el listado y el detalle de los cohetes**, para conocer la flota.
3. Como usuario con sesión, quiero **corregir el nombre y el alcance de un cohete**, para mantener el catálogo al día.
4. Como usuario con sesión, quiero **inhabilitar un cohete**, para retirarlo del uso futuro sin borrarlo.

## Fuera de alcance

- Borrar cohetes.
- Rehabilitar un cohete inhabilitado.
- Cambiar la capacidad: siempre es 9.
- Viajes, plazas y reservas.
- Roles distintos del usuario autenticado.
- Gestión de la flota por visitantes sin sesión.

## Plan técnico

### back

Carpeta `api/rockets/` (controller, service, repository, types y tests). Tabla SQLite `rockets`: `id`, `name`, `range` (`earth` | `moon` | `mars`), `capacity` siempre 9, `disabled` (0/1), `created_at` en ISO 8601. El nombre es único sin distinguir mayúsculas, tras recortar espacios.

Sesión existente: cabecera `Authorization: Bearer <token>` contrastada con `sessions`. Sin token o token inválido, 401.

- `POST /api/rockets` con `{ name, range }` → 201 y el cohete (`capacity: 9`, `disabled: false`).
- `GET /api/rockets` → 200, todos los cohetes, inhabilitados incluidos, ordenados por `created_at`.
- `GET /api/rockets/:rocketId` → 200 o 404.
- `PATCH /api/rockets/:rocketId` con `name` y/o `range` (al menos uno) → 200. No cambia capacidad ni `disabled`.
- `POST /api/rockets/:rocketId/disable` → 200 con `disabled: true`. Si ya está inhabilitado, 409. Si no existe, 404.

Errores: 400 si el nombre está vacío, el alcance no es `earth`, `moon` o `mars`, el cuerpo trae una capacidad distinta de 9, o la edición no trae nombre ni alcance; 409 si el nombre ya existe; 401 sin sesión válida; 404 si el id no existe. Tests unitarios de controller, service y repository.

### front

Rutas `/rockets` (listado), `/rockets/new` (alta) y `/rockets/:rocketId` (detalle, edición e inhabilitar). Enlace de menú "Rockets" solo con sesión. Sin sesión, esas rutas llevan a `/login`.

El alta pide nombre y alcance (Earth, Moon, Mars) y muestra la capacidad 9 como fija. El detalle muestra nombre, alcance, capacidad y estado. La edición guarda nombre y alcance. El botón Disable solo aparece si el cohete está habilitado.

El cliente envía `Authorization: Bearer <token>` en `http-client`. Repository `rockets.repository.ts` y páginas `ab-rockets-page`, `ab-rocket-form-page`, `ab-rocket-detail-page`. Tests unitarios del repository y de la redirección sin sesión.

### e2e

`tests/rockets.api.spec.ts`, `tests/rockets.page.spec.ts` y `docs/rockets.md`. Cubren alta, listado, detalle, edición e inhabilitación con sesión, y el rechazo sin sesión (API 401 y cliente hacia login).

## Criterios de aceptación (EARS)

- [ ] 1. CUANDO un usuario con sesión envía un nombre no vacío y un alcance Tierra, Luna o Marte, LA API DEBERÁ crear el cohete con capacidad 9, habilitado, y devolverlo.
- [ ] 2. SI el nombre está vacío o el alcance no es Tierra, Luna o Marte, LA API NO DEBERÁ crear el cohete y DEBERÁ responder 400.
- [ ] 3. SI el cuerpo incluye una capacidad distinta de 9, LA API NO DEBERÁ crear ni actualizar el cohete y DEBERÁ responder 400.
- [ ] 4. SI ya existe un cohete con el mismo nombre, sin distinguir mayúsculas, LA API NO DEBERÁ crear ni renombrar y DEBERÁ responder 409.
- [ ] 5. CUANDO un usuario con sesión consulta la flota, LA API DEBERÁ devolver todos los cohetes, incluidos los inhabilitados.
- [ ] 6. CUANDO un usuario con sesión consulta un cohete existente, LA API DEBERÁ devolver nombre, alcance, capacidad 9 y si está inhabilitado.
- [ ] 7. SI el identificador no existe, LA API DEBERÁ responder 404.
- [ ] 8. CUANDO un usuario con sesión actualiza el nombre o el alcance de un cohete existente, LA API DEBERÁ guardar solo esos datos y DEBERÁ conservar la capacidad 9 y el estado de inhabilitación.
- [ ] 9. SI la edición no incluye nombre ni alcance, LA API NO DEBERÁ modificar el cohete y DEBERÁ responder 400.
- [ ] 10. CUANDO un usuario con sesión inhabilita un cohete habilitado, LA API DEBERÁ marcarlo inhabilitado y DEBERÁ conservarlo en el catálogo.
- [ ] 11. SI el cohete ya está inhabilitado, LA API NO DEBERÁ cambiarlo y DEBERÁ responder 409.
- [ ] 12. SI la petición no trae una sesión válida, LA API NO DEBERÁ crear, consultar, editar ni inhabilitar y DEBERÁ responder 401.
- [ ] 13. CUANDO un usuario con sesión abre la flota, EL cliente DEBERÁ mostrar el listado con nombre, alcance, capacidad 9 y estado.
- [ ] 14. CUANDO un usuario con sesión da de alta un cohete, EL cliente DEBERÁ pedir nombre y alcance, DEBERÁ mostrar la capacidad 9 como fija y DEBERÁ abrir el detalle del cohete creado.
- [ ] 15. CUANDO un usuario con sesión edita un cohete, EL cliente DEBERÁ guardar el nombre y el alcance nuevos y DEBERÁ mostrarlos en el detalle.
- [ ] 16. CUANDO un usuario con sesión inhabilita un cohete habilitado, EL cliente DEBERÁ mostrarlo como inhabilitado y NO DEBERÁ ofrecer inhabilitarlo de nuevo.
- [ ] 17. SI no hay sesión, LA navegación a la flota, al alta o al detalle DEBERÁ llevar a la pantalla de inicio de sesión.
- [ ] 18. LA API NO DEBERÁ exponer borrado ni rehabilitación de cohetes.
