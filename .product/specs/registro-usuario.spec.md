# Registro de usuarios

Registro de usuarios en Astro-Bookings: alta con email, nombre y contraseña; el usuario queda autenticado con un token en el cliente.

Astro-Bookings reserva plazas en viajes espaciales. Hoy la API y la web no distinguen visitantes: no hay identidad ni forma de asociar una reserva a una persona. Sin un alta, no se puede personalizar la experiencia ni preparar el login. El registro crea esa identidad (email único, nombre visible, contraseña) y deja al usuario autenticado con un token, sin incluir el inicio de sesión en esta entrega.

## Historias de usuario

1. Como visitante, quiero registrarme con email, nombre y contraseña, para tener una identidad en Astro-Bookings.
2. Como visitante recién registrado, quiero quedar autenticado con un token en el cliente, para no tener que iniciar sesión en esta entrega.
3. Como visitante, quiero que un email ya usado se rechace, para que cada cuenta sea única.
4. Como visitante, quiero ver errores si faltan datos o el formato no vale, para corregir el formulario sin perder el contexto.
5. Como visitante, quiero llegar al registro desde la navegación (`/register`), para darme de alta sin adivinar la URL.



## Fuera de alcance

- Login / logout
- Consulta del usuario actual (`GET /api/me`)
- Cookie de sesión
- Recuperar contraseña o verificar email



## Plan técnico



### back

Nueva funcionalidad `register` junto a `health`. `POST /api/register` con email, nombre y contraseña. Persistencia en SQLite; email único; no devolver la contraseña. Respuesta con usuario (id, email, nombre) y token. Errores de validación y email duplicado con `ApiError`. Tests unitarios colocalizados.

### front

Ruta `/register` y enlace en el menú. Formulario (email, nombre, contraseña) vía `http-client`. Guardar el token (p. ej. `localStorage`) y el usuario en un store. Mostrar errores de validación o email duplicado. Tests unitarios del store o repositorio.

### e2e

Spec de registro (API y página). Alta correcta, email duplicado y datos inválidos. En la UI, rellenar el formulario y comprobar el token en el cliente. Doc de aceptación `docs/register.md` con IDs `AC-REG-*`.

## Criterios de aceptación (EARS)

1. CUANDO un visitante envía un email, nombre y contraseña válidos, LA API DEBERÁ crear el usuario y devolver id, email, nombre y un token, y NO DEBERÁ devolver la contraseña.
2. CUANDO el registro es correcto, EL cliente DEBERÁ guardar el token (p. ej. en `localStorage`) para poder enviarlo en peticiones posteriores.
3. SI el email ya está registrado, LA API DEBERÁ rechazar la petición y EL cliente DEBERÁ mostrar un error y NO DEBERÁ guardar un token.
4. SI faltan email, nombre o contraseña, o el formato no es válido, LA API DEBERÁ rechazar la petición y EL cliente DEBERÁ mostrar un error y NO DEBERÁ crear una sesión.
5. CUANDO un visitante abre la aplicación, LA navegación DEBERÁ incluir un enlace a `/register`.
6. CUANDO un visitante va a `/register`, EL cliente DEBERÁ mostrar un formulario con email, nombre y contraseña.

