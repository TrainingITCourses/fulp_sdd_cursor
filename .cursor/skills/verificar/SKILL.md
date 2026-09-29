---
name: verificar
description: Verifica la funcionalidad de una spec en un proyecto concreto. Usar cuando necesites verificar la funcionalidad de un feature especificado.
user-invocable: true
disable-model-invocation: false
---

Ejecuta las pruebas e2e .
```bash	
cd e2e
bun test:e2e
```

Guarda un reporte de la ejecución en `.product/specs/{spec-slug}.report.md`

Con esta template:
```markdown
---
name: {spec-slug}
date: {date}
status: {status GREEN o RED}
--- 
# Reporte de pruebas e2e

## Resultados

## Errores
```

Si las pruebas pasan, informa GREEN y termina escribiendo una línea en el journal con el status `INFO` y el resumen `Pruebas e2e {spec-slug} pasan`.
Si las pruebas fallan, informa RED y termina escribiendo una línea en el journal con el status `ERROR` y el resumen `Pruebas e2e {spec-slug} fallan`.


