# Instrucciones del proyecto

## Entorno

- **Git**: {URL remota | ruta local} — {rama por defecto `main` | `master`}
- **SO** `{Windows | Linux | MacOS}` — **Shell** `{cmd | PowerShell | bash | zsh | git bash}`
- **Tiempo** {usar ISO 8601 para marcas de tiempo DateTime}

## Rutas

- **{Agents_File}** — `AGENTS.md` — este archivo
- **{Agents_Folder}** — `.agents/` — habilidades, reglas y hooks del agente
- **{Product_Folder}** — `.product/` | `docs/` | {elegido} — especificaciones y arquitectura
- **{Source_Folder}** — `src/` — código fuente

## Producto

### Problema

{Lo que resuelve el producto.}

### Solución

{Descripción general de la aplicación y su responsabilidad principal.}

- **Ruta fuente**: `src/`
- **Reglas específicas**: {.cursor/rules/project.rules.mdc}

### Verificación

{Comprobaciones del proyecto y evidencia esperada.}

```bash
# comandos de instalación, compilación y pruebas