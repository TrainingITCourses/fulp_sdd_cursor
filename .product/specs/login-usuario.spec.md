# Login de usuario

El usuario inicia sesión con email y contraseña; el menú muestra su nombre y puede abrir una página con su ficha.

Hoy el registro crea la cuenta y deja un token, pero no hay forma de volver a entrar. Esta entrega cubre el login, el nombre en el menú y una página de solo lectura con la ficha. No incluye logout, editar la ficha ni recuperar contraseña.

## Historias de usuario

1. Como usuario registrado, quiero **iniciar sesión con email y contraseña**, para volver a entrar en Astro-Bookings.
2. Como usuario autenticado, quiero **ver mi nombre en el menú**, para saber que la sesión es mía.
3. Como usuario autenticado, quiero **abrir una página con mi ficha**, para consultar mis datos.

## Fuera de alcance

- Logout
- Editar la ficha
- Recuperar contraseña o verificar email

## Plan técnico

### back

Nueva funcionalidad `login` junto a `register` y `health`. `POST /api/login` con email y contraseña. Comprueba el usuario en SQLite; no devolver la contraseña. Respuesta con usuario (id, email, nombre) y token. `GET /api/me` con el token para devolver la ficha (id, email, nombre). Errores de validación, credenciales incorrectas y token ausente o inválido con `ApiError`. Tests unitarios colocalizados.

### front

Ruta `/login` y enlace en el menú si no hay sesión. Formulario (email, contraseña) vía `http-client`. Guardar el token y el usuario en el store de sesión (`localStorage`). El menú muestra el nombre del usuario autenticado y un enlace a `/me`. Página `/me` de solo lectura: pide `GET /api/me` y muestra id, email y nombre. Mostrar errores de validación, credenciales incorrectas o sesión inválida. Tests unitarios del store o repositorio.

### e2e

Spec de login (API y página). Login correcto, credenciales incorrectas y datos inválidos. En la UI, rellenar el formulario, comprobar el token en el cliente, el nombre en el menú y la ficha en `/me`. Doc de aceptación `docs/login.md` con IDs `AC-LOGIN-*`.

## Criterios de aceptación (EARS)

1. CUANDO un usuario registrado envía un email y una contraseña válidos, LA API DEBERÁ devolver id, email, nombre y un token, y NO DEBERÁ devolver la contraseña.
2. CUANDO el login es correcto, EL cliente DEBERÁ guardar el token (p. ej. en `localStorage`) para poder enviarlo en peticiones posteriores.
3. SI el email o la contraseña no coinciden con un usuario, LA API DEBERÁ rechazar la petición y EL cliente DEBERÁ mostrar un error y NO DEBERÁ guardar un token.
4. SI faltan email o contraseña, o el formato no es válido, LA API DEBERÁ rechazar la petición y EL cliente DEBERÁ mostrar un error y NO DEBERÁ crear una sesión.
5. CUANDO un visitante abre la aplicación sin sesión, LA navegación DEBERÁ incluir un enlace a `/login`.
6. CUANDO un visitante va a `/login`, EL cliente DEBERÁ mostrar un formulario con email y contraseña.
7. CUANDO hay una sesión autenticada, LA navegación DEBERÁ mostrar el nombre del usuario y un enlace a `/me`.
8. CUANDO un usuario autenticado va a `/me`, EL cliente DEBERÁ pedir `GET /api/me` y mostrar id, email y nombre, y NO DEBERÁ permitir editarlos.
9. SI no hay token o el token no es válido, LA API DEBERÁ rechazar `GET /api/me` y EL cliente DEBERÁ mostrar un error y NO DEBERÁ mostrar una ficha de otro usuario.
