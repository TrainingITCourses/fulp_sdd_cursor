# Cancelar lanzamiento

Un usuario con sesión cancela un lanzamiento que no esté cancelado ni exitoso, indica una causa con tipo y texto, y el detalle muestra ese registro con hora y usuario.

Hoy se pueden planificar y consultar lanzamientos, pero no cancelarlos. Esta entrega cancela de forma definitiva un lanzamiento planificado o confirmado, guarda una sola causa y la muestra en el detalle. No reabre el lanzamiento, no corrige la causa y no cambia fecha, cohete ni precio.

## Historias de usuario

1. Como usuario con sesión, quiero **cancelar un lanzamiento planificado o confirmado indicando el tipo de causa y un texto**, para dejarlo cancelado con el motivo.
2. Como usuario con sesión, quiero **ver en el detalle la causa, la hora y el usuario que canceló**, para saber por qué y quién lo hizo.

## Fuera de alcance

- Reabrir un lanzamiento cancelado.
- Editar la causa, la hora o el usuario después de cancelar.
- Confirmar un lanzamiento o marcarlo como exitoso.
- Editar la fecha, el cohete o el precio.
- Borrar lanzamientos.
- Reservas, plazas, pasajeros y avisos.
- Mostrar la causa, la hora o el usuario en el listado.
- Un historial de varios cambios: solo queda el registro de la cancelación.
- Roles distintos del usuario autenticado.
- Cancelar sin sesión.

## Plan técnico

### back

Misma carpeta `api/launches/`. La tabla `launches` guarda la cancelación en el propio lanzamiento: `cancellation_cause_type` (`economic`, `meteorological` o `technical`), `cancellation_cause_text`, `cancelled_at` en ISO 8601 y `cancelled_by_user_id`. Esas columnas quedan vacías hasta cancelar. El usuario sale de la sesión (`Authorization: Bearer <token>` → `sessions.user_id` → `users`). La hora la pone el servidor. El cuerpo no acepta hora ni usuario.

- `POST /api/launches/:launchId/cancel` con `{ causeType, causeText }` → 200 y el lanzamiento con `status: "cancelled"` y `cancellation` `{ causeType, causeText, cancelledAt, cancelledBy: { id, name } }`.
- `GET /api/launches` y `GET /api/launches/:launchId` devuelven el mismo lanzamiento. Si no está cancelado, `cancellation` es `null`.

Errores: 400 si el tipo no es uno de los tres, el texto está vacío o el cuerpo trae hora o usuario; 404 si el lanzamiento no existe; 409 si el estado es `successful` o `cancelled`; 401 sin sesión válida. Tests unitarios de controller, service y repository.

### front

Sin rutas nuevas. En `/launches/:launchId`, si el estado es planificado o confirmado, el detalle pide el tipo (Económico, Meteorológico, Técnico) y un texto, y envía la cancelación. Tras cancelar, sigue en el detalle y muestra estado cancelado, tipo, texto, hora y nombre del usuario, sin formulario. Si ya está cancelado, muestra ese registro y no el formulario. Si está exitoso, no muestra formulario ni registro de causa. El listado sigue mostrando el estado y no la causa.

El cliente envía `Authorization: Bearer <token>`. Método nuevo en `launches.repository.ts` y cambio en `ab-launch-detail-page`. Sin sesión, la ruta sigue llevando a `/login`. Tests unitarios del repository y de la página de detalle.

### e2e

Ampliación de `tests/launches.api.spec.ts`, `tests/launches.page.spec.ts` y `docs/launches.md`. Cubren la cancelación con sesión de un lanzamiento planificado o confirmado, la causa visible en el detalle, el rechazo si está exitoso o ya cancelado, la causa inválida y el rechazo sin sesión (API 401 y cliente hacia login).

## Criterios de aceptación (EARS)

- [ ] 1. CUANDO un usuario con sesión cancela un lanzamiento planificado o confirmado con un tipo económico, meteorológico o técnico y un texto no vacío, LA API DEBERÁ pasarlo a cancelado y DEBERÁ devolver la causa, la hora en ISO 8601 y el usuario de la sesión.
- [ ] 2. SI el tipo de causa no es económico, meteorológico ni técnico, o el texto está vacío, LA API NO DEBERÁ cancelar el lanzamiento y DEBERÁ responder 400.
- [ ] 3. SI el cuerpo incluye la hora o el usuario, LA API NO DEBERÁ cancelar el lanzamiento y DEBERÁ responder 400.
- [ ] 4. SI el lanzamiento está exitoso o ya cancelado, LA API NO DEBERÁ cambiarlo y DEBERÁ responder 409.
- [ ] 5. SI el identificador del lanzamiento no existe, LA API DEBERÁ responder 404.
- [ ] 6. SI la petición no trae una sesión válida, LA API NO DEBERÁ cancelar el lanzamiento y DEBERÁ responder 401.
- [ ] 7. CUANDO un usuario con sesión consulta un lanzamiento cancelado, LA API DEBERÁ devolver la causa, la hora y el usuario que lo canceló.
- [ ] 8. SI el lanzamiento no está cancelado, LA API DEBERÁ devolver la cancelación vacía.
- [ ] 9. CUANDO un usuario con sesión abre el detalle de un lanzamiento planificado o confirmado, EL cliente DEBERÁ pedir el tipo y el texto y, al cancelar, DEBERÁ mostrar el estado cancelado, la causa, la hora y el nombre del usuario.
- [ ] 10. CUANDO un usuario con sesión abre el detalle de un lanzamiento ya cancelado, EL cliente DEBERÁ mostrar la causa, la hora y el nombre del usuario y NO DEBERÁ mostrar el formulario.
- [ ] 11. SI el lanzamiento está exitoso, EL cliente NO DEBERÁ mostrar el formulario de cancelación.
- [ ] 12. CUANDO un usuario con sesión abre el listado, EL cliente DEBERÁ mostrar el estado cancelado y NO DEBERÁ mostrar la causa, la hora ni el usuario.
- [ ] 13. SI no hay sesión, LA navegación al detalle DEBERÁ llevar a la pantalla de inicio de sesión.
- [ ] 14. LA API NO DEBERÁ reabrir un lanzamiento ni modificar la causa, la hora o el usuario de una cancelación ya hecha.
