# Registro de actividad

El API deja cada evento en una línea fija, en consola y en el fichero del día, para diagnosticar peticiones y errores sin abrir el código.

Hoy el logger escribe el origen delante del nivel y sin la columna fija del mensaje, y el registro de peticiones pone el estado antes del método. Por eso fallan 9 tests de `bun test` en `back/`: formato de línea, fichero diario, nivel mínimo y traza de petición. Esta entrega solo corrige ese formato y el mensaje de cada petición para que esos tests pasen. No añade pantallas ni endpoints.

## Historias de usuario

1. Como operador del API, quiero **leer cada evento en una línea con hora, nivel, origen y mensaje alineados**, para diagnosticar sin abrir el código.
2. Como operador del API, quiero **que el origen largo se recorte y los saltos de línea se escapen**, para que cada evento siga ocupando una sola línea.
3. Como operador del API, quiero **acumular los eventos del día en un fichero y omitir los que estén bajo el nivel mínimo**, para conservar el historial sin ruido.
4. Como operador del API, quiero **ver cada petición con método, URL, estado y duración, y el nivel según el estado**, para distinguir éxitos, errores de cliente y errores de servidor.

## Fuera de alcance

- Cliente web y e2e.
- Endpoints nuevos.
- Cambiar los tests para que encajen con el formato actual.
- Cambiar el destino de consola (info en stdout, warn y error en stderr) ni el comportamiento si el fichero no se puede escribir.
- Envío de logs a un servicio externo, rotación o borrado de ficheros antiguos.
- El texto de los logs de auth y de cohetes.

## Plan técnico

### back

`shared/logger.ts`: la línea queda `hora nivel [origen] mensaje`. Hora local `HH:mm:ss.SSS`. Nivel en mayúsculas, rellenado a 5 (`INFO `, `WARN `, `ERROR`, `DEBUG`). Origen recortado, como máximo 10 caracteres, entre corchetes, rellenado para que el mensaje empiece siempre en la misma columna. Mensaje recortado; `\n` y `\r\n` pasan a la secuencia `\n`.

Fichero diario `{yyyy-mm-dd}.log` en el directorio configurado (`LOG_DIR` o la opción `dir`), en append. Niveles `debug < info < warn < error`: no se escribe un evento por debajo del mínimo. Si el fichero no se puede escribir, no se lanza y la consola sigue.

`server/request-logger.ts`: al terminar la respuesta, una línea `MÉTODO "URL" estado duración ms`. `GET` va seguido de dos espacios; la URL es `originalUrl`, comillas incluidas, con query. Estado &lt; 400 → info; 4xx → warn; 5xx → error.

Sin endpoints nuevos. Tests ya existentes: `shared/logger.test.ts` y `server/request-logger.test.ts`.

## Criterios de aceptación (EARS)

- [ ] 1. CUANDO LA API formatea un evento, DEBERÁ escribir una sola línea con hora local `HH:mm:ss.SSS`, nivel en mayúsculas rellenado a 5, origen entre corchetes y mensaje, y el mensaje DEBERÁ empezar siempre en la misma columna.
- [ ] 2. SI el origen o el mensaje traen espacios al inicio o al final, LA API DEBERÁ recortarlos antes de escribir la línea.
- [ ] 3. SI el origen supera 10 caracteres, LA API DEBERÁ truncarlo a 10 y DEBERÁ mantener la columna del mensaje.
- [ ] 4. SI el mensaje contiene saltos de línea, LA API DEBERÁ sustituirlos por la secuencia `\n` y DEBERÁ dejar el evento en una sola línea.
- [ ] 5. CUANDO LA API registra un evento de nivel suficiente, DEBERÁ añadirlo al fichero del día (`yyyy-mm-dd.log`) sin borrar las líneas anteriores.
- [ ] 6. SI el nivel del evento está por debajo del mínimo configurado, LA API NO DEBERÁ escribirlo en el fichero.
- [ ] 7. CUANDO una petición termina con estado menor que 400, LA API DEBERÁ registrarla como info con método, URL entre comillas, estado y duración en milisegundos.
- [ ] 8. SI una petición termina con estado 4xx, LA API DEBERÁ registrarla como warn con método, URL entre comillas, estado y duración.
- [ ] 9. SI una petición termina con estado 5xx, LA API DEBERÁ registrarla como error.
