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