---
name: implementar
description: Implementa la funcionalidad de una spec en un proyecto concreto. Usar cuando necesites implementar la funcionalidad de un feature especificado.
user-invocable: true
disable-model-invocation: false
---

Lanza un sub-agente `Programador` para programar la funcionalidad de las tres carpetas back, front y e2e.
Reutiliza el mismo sub-agente para programar la funcionalidad de las tres carpetas.
Codifica la rama back de la spec.
Espera a que termine

Codifica la rama front de la spec usando la skill `codificar`.
Espera a que termine.

/Codifica la rama e2e de la spec
Espera a que termine.

Cuando el sub-agente `Programador` termine, lanza un sub-agente `Tester` para ejecutar las pruebas E2E.
Verifica la funcionalidad de la spec usando [verificar](/.cursor/skills/verificar/SKILL.md)

Haz un merge con la rama default.