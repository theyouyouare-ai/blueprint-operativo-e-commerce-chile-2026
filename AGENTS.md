# Instrucciones para agentes de este repositorio

Antes de generar o modificar código, leer desde la raíz del proyecto:

1. `.codex/rules.md`: convenciones, arquitectura y flujo de verificación.
2. `.codex/error_memory.json`: errores conocidos y reglas preventivas aplicables.

Aplicar las reglas relevantes durante la tarea. Volver a consultar estos archivos si
cambian o si se perdió su contexto. El registro con síntoma `Ejemplo de error` es una
plantilla y no describe un incidente real.

Después de corregir un error comprobado, actualizar la memoria siguiendo el protocolo
de `.codex/rules.md`. Preservar cambios previos del usuario y comunicar las verificaciones
realmente ejecutadas. Las instrucciones explícitas del usuario prevalecen sobre estas
convenciones.

Referencia sobre la carga de AGENTS.md en Codex:
https://developers.openai.com/es-419/docs/agent-configuration/agents-md
