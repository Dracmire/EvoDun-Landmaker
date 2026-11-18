# Metodología del modo 3 (Stage, 2D-HD) — carpeta de referencia

Fecha: 2026-11-17 · Estado: investigación (no es contrato ni decisión de diseño del repo) · Origen: Proyecto EvoDun (documento de estado, Registro A001–A360).

Esta carpeta guarda, fuera de los chats, el método y lo aprendido sobre composición 2D-HD tipo DQ3 en el modo 3, para que una sesión nueva pueda retomar el trabajo sin depender de la memoria de una conversación.

## Qué leer y en qué orden

| Archivo | Qué es | Para quién |
|---|---|---|
| `INFORME_metodologia_HD2D_DQ3.md` | Informe integrado (v319): dónde estamos, método de trabajo, vocabulario (verde/azul/rojo, banda, plano, hotspot, vistazo), las pruebas una por una (Bosque, trono, Torre del Soñador, DAC, calibración, R1.5), 72 aprendizajes con estado y fuente, lo que no funcionó, checklist para reproducir el nivel actual, §9 receta de generación para una sala nueva, anexos de cifras, alturas medidas y patrones de las tomas | cualquier sesión nueva: empezar aquí |
| `INFORME_METODO_TRUCOS.md` | Ficha de 11 campos de cada truco de composición (qué es, objetivo en pantalla con números, receta, puerta de presencia…) y el diseño de la pasada única de CC | quien escribe o ejecuta un pase de trucos |
| `PROTOCOLO_PRUEBAS.md` | Secuencia vigente de las pruebas (v322): Metodología → Base → Verificación 1 → Pruebas → Juicios → Verificación 2 → Resultado; criterios C1–C8; elección de sala | quien diseña o ejecuta un pase de trucos: leer ANTES de las fichas |
| `r15/` | Pedidos a CC, predicciones congeladas, resultados y hashes de la rama R1.5 (calibración del juez, P1, P2, G1–G3, plan de grupos, catálogo de trucos v314, plan y medición G4 de cámaras) | auditoría: cada predicción se comprueba con su `HASHES_v3xx.sha256` |

Por qué hay dos informes y no uno: el informe integrado explica y registra; las fichas son instrucciones que CC ejecuta al pie de la letra y cambian con cada pasada. Se mantienen separados para poder actualizar las fichas sin reescribir la historia.

## Reglas de uso
- Nada de esta carpeta es material del remake: no hay capturas ni mapas de terceros (esos viven en `../../refs/dq3/` y en el Proyecto).
- Los archivos de `r15/` son copias exactas de lo congelado; no se editan. Comprobación: `cd r15 && sha256sum -c HASHES_v31x.sha256`.
  - `HASHES_v317.sha256` tiene una línea por versión de `PREDICCION_R15_G4M_v317.md` (original, Enmienda 1, Enmienda 2): las anteriores fallan a propósito; la última es la vigente.
- Las cifras usadas como compuerta de un pase nuevo se re-miden en la sesión nueva (informe integrado, §0.2).
- No se toca `src/` desde esta carpeta; el estado del repo de referencia es `e882c5c`.
