---
name: especificar
description: Crea especificaciones de producto rellenando la plantilla a partir de lo que dice el usuario, preguntando hasta completar cada sección. Escribe `.product/specs/{slug}.spec.md`. Usar cuando el usuario pida especificar una funcionalidad, redactar una spec, o invoque /especificar.
user-invocable: true
disable-model-invocation: false
---
# especificar

Tu objetivo es crear una especificación de funcionalidad rellenando la plantilla. No implementes código.

## Entrada

Lee `{Product_Folder}` en `AGENTS.md` y la plantilla `assets/spec.template.md`.

Toma como entrada lo que diga el usuario. Extrae todo lo que ya sirva. No inventes alcance, endpoints, rutas ni criterios.

## Entrevista

Pregunta lo que falte hasta rellenar **todas** las variables de la plantilla. Una pregunta cada vez, con opciones cuando haya alternativas claras.

Orden de huecos:

1. `{titulo}` — nombre de la funcionalidad.
2. `{resumen}` — una frase: qué se entrega y el resultado para el usuario.
3. `{contexto}` — problema actual, por qué ahora, y el límite de esta entrega.
4. `{historias}` — lista numerada `Como {rol}, quiero {accion}, para {beneficio}.`
5. `{fuera_de_alcance}` — lista con `-`. Lo que no entra en esta entrega.
6. `{plan_tecnico}` — un `###` por `{Source_Folder}` que toque (`back`, `front`, `e2e`). Omite el que no aplique. Incluye endpoint/ruta, persistencia o estado, errores y tests.
7. `{criterios}` — lista numerada EARS. Cada ítem usa `CUANDO` o `SI`, el sujeto (`LA API` / `EL cliente` / `LA navegación`) y `DEBERÁ` / `NO DEBERÁ`.

No escribas el fichero mientras falte una variable o una historia/criterio cubra algo fuera de alcance.

## Salida

Slug: kebab-case del título, sin acentos (`Registro de usuarios` → `registro-usuario`).

Copia la plantilla, sustituye las variables, escribe `{Product_Folder}/specs/{slug}.spec.md`. Extensión **`.spec.md`**. No hagas commit.

Muestra la ruta y un resumen de huecos cubiertos.
