# Pedido a CC · Punto de control: dónde estamos (3 salas, todo lo acumulado) — v325

**Para qué.** R1.5 (trucos) quedó cerrada. Antes de abrir la siguiente rama, [U] quiere ver dónde estamos con TODO lo que acumulamos aplicado a la vez: cámara medida, proporciones, terreno, cierres, estructuras y señales aprobadas, y los micro cambios. La receta está en `METODOLOGIA_GENERACION_DQ3_v325.md` §1 (en esta misma carpeta); léela entera antes de empezar.

**Tu papel.** Construyes, renderizas, mides y armas las hojas. No juzgas: juzga [U] mirando. Sin agentes y sin jueces.

## 0. Entorno
- Árbol del visor congelado en `e882c5c`, en un worktree aparte. **Sin tocar `src/`.**
- Arnés `harness_salat` (y el `harness_t5` de la prueba de distancia, si te sirve). El pitch y los demás parámetros de cámara van por gancho, como en t5/t6.
- Tomas de terceros (0202, 0137, 30:55, la sala de la escalera y el bosque del remake si lo tienes) solo para `out/` y el zip. Nunca al repo.

## 1. Las tres salas
| # | Sala | Qué representa | Referencia para la hoja |
|---|---|---|---|
| 1 | **T3** (tu sala sintética de 0202) | interior de dungeon, todo a mano | 0202 y 0137 |
| 2 | **DAC sala 14** (ejemplo `mockt_z14`: Ascension, eje Z) | sala generada, solo reglas | ninguna (se juzga sola) |
| 3 | **Forest A** (ejemplo `forest_a`: mapa viejo, exterior, meta por POI) | exterior abierto | toma del bosque del remake si la tienes; si no, el pasillo del desierto como referencia de pitch |

Si alguna no carga o no tiene caminata, PARADA para esa sala sola: dilo y sigue con las otras.

## 2. Tres estados por sala
- **BASE:** el ejemplo tal como está hoy en el visor, sin tocar nada.
- **CÁMARA:** solo la cámara y el terreno calibrados de §1.3 y §1.6 de la receta.
  - Cam 6, FOV 30, K 1, `heroFrac` 0,10, `tilesPerH` 1,5, `exag` 1, `vScale` 1.
  - Pitch 25 en T3 y en la sala 14; pitch 38 en Forest A.
  - `heroScreen` (0,473; 0,514) en interiores.
  - `terraces` 3, `subs` 2, peldaño ≤ 0,5 H.
- **TODO:** CÁMARA más todas las reglas de §1 de la receta que se puedan aplicar en esa sala:
  - **4, proporciones:** en T3 se ajusta la profundidad detrás del hotspot a ≈ 17 H; en las otras dos solo se mide.
  - **7, cierres:** `noFront`; BACK como baranda de 1,0–1,4 H más el vistazo si hay vecina; si no, cierre ≥ 3 H más fondo construido.
  - **8, A6:** línea media continua.
  - **8, C2:** un solo par en la transición.
  - **8, A3 en secuencia:** pilares de ≈ 5 H cada ≈ 7,3 H.
  - **9, C3:** calcomanía sutil en el hotspot.
  - **9, A4/A5:** vano focal contrastado al fondo.

  Una regla que no se pueda aplicar en una sala se marca **AUSENTE con el motivo**. No se fuerza.

## 3. Posiciones
- **Tres por sala, a lo largo del camino de props:** inicio, hotspot o mitad, y cerca de la meta.
- **Las mismas posiciones en los tres estados.** Si TODO cambia el camino, se declara y se usa la posición equivalente.
- **T3 lleva además la posición de 0202:** el héroe en la banda 2, sobre la escalera sur.

## 4. Controles y medidas por render
- **Controles:**
  - héroe ± 5 % entre estados;
  - fondo vacío ≤ 2 %;
  - billboards más rojo ≤ 30 %;
  - hashes ×2;
  - máscara, camino y meta iguales entre estados, o el cambio declarado.
- **Medidas:**
  - fila de los pies del héroe;
  - fila del horizonte o del borde del fondo;
  - s del fondo (la regla pide ≈ 0,55);
  - profundidad útil detrás del hotspot, en H.
- **Por regla del estado TODO:** PRESENTE (con una medida que lo muestre en pantalla) o AUSENTE (con el motivo).

## 5. Entrega (hojas para [U])
- **Una hoja por sala:** filas = las posiciones; columnas = BASE | CÁMARA | TODO | referencia (si hay). Debajo de cada celda, en una línea, las medidas de §4.
- **Una hoja resumen:** las tres salas en TODO, en la posición del hotspot, lado a lado.
- **`medidas_control.txt`:** todas las cifras, la lista PRESENTE / AUSENTE por sala, y qué se ajustó a mano.
- **`SHA256SUMS`** y un zip.
- **Ningún juicio.**

## PARADAS
- Algo exige `src/`: lo dices y sigues sin eso.
- El héroe varía más de ± 5 % o el fondo vacío pasa del 2 % en un estado y no se corrige sin cambiar la regla.
- El mismo fallo se repite dos veces.
