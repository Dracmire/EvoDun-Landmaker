# PP2 paso 6 · Vessel paso 2: la franja X4–X5–X6 sube y el hoyo se vuelve banda de altura

Base `5912936`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/`. Antes de empezar comprobé los hashes de `guias/E/`, `alturas/` y `vessel_limites/` contra sus `HASHES_*.txt`: coinciden. Script y entorno fuera del repo. Sin veredicto: son lecturas.

## Qué hice

**Base.** `vessel_limites/` perfil P1, versión R. Los datos de `P1_R` no están guardados como máscaras en `vessel_limites.json`; recomputé el paso 5h con mi script y comprobé que `P1_R.png`, `comparacion.png` y `vessel_limites.json` salen con el mismo sha256 que los del repo. Lo que en el 5h salió negro (terreno de celda sin ocupar, 891 celdas) es el **piso decorativo no transitable**.

**Lectura de [R] aplicada tal cual.**
- Nivel 1 = el piso de X4, X5 y X6 (480 celdas, 0 cambiadas) más 35 celdas de muesca de puente que quedan encerradas por ese piso (Y12, Y14, Y15). Todo lo demás, nivel 0.
- **Banda** = celdas de piso decorativo, muro sobrante y la cara del muro mínimo que mira al hoyo (una celda de muro mínimo cuenta si toca decorativo o sobrante), a ≤ D celdas (8 vecinos, por dentro de ese espacio) de los pisos de nivel 1. Nunca piso de sala, puente ni gate (0 celdas pisadas en las seis corridas).
- **Escaleras** = las celdas de puente y de gate de los componentes que unen nivel 1 con nivel 0, a ≤ D celdas del nivel 1 y **a lo largo del eje** del puente (rectángulos, ninguna diagonal, ninguna sobre muro mínimo). Un puente cuyo extremo queda dentro del piso de nivel 1 (la muesca de Y12, Y14, Y15) es nivel 1 plano en la muesca y escalera fuera de ella.
- Profundidad D = 4, 5 y 6 celdas.

**Escaleras (D = 5; el largo crece con D, hasta 6 en Y14 / Y15).**

| Escalera | Une | Eje | Largo × ancho | Celdas (filas, columnas) |
|---|---|---|---|---|
| Y12 | h17+X1 → X5 | vertical | 5 × 4 | 35–39, 11–14 |
| Y13, entrada | h18+X2 → X6 | vertical | 5 × 4 | 38–42, 43–46 |
| X6 ↔ grupo 11, contacto con gates | X6 → grupo 11 | horizontal | 2 × 5 | 43–47, 45–46 |
| X5 ↔ Y10, gates | X5 → Y10 | vertical | 2 × 3 | 47–48, 3–5 |
| Y14 | X5 → h19 | vertical | 5 × 4 | 56–60, 19–22 |
| Y15 | X6 → h20 | vertical | 5 × 4 | 56–60, 35–38 |

Los puentes miden 4 de ancho y sus gates 3; la escalera toma el ancho del puente (4), no el del gate (3).

**V1 · solo el hoyo.** **V2 · el hoyo + la columna central** (lectura mía, cámbiala si [U] quiere otra): se añade a la banda la columna de celdas sin piso entre los bordes interiores de h19 y h20 (muro mínimo central, filas 57–80, 2 celdas de ancho) que toca la banda de la cara sur, y baja con una pendiente larga y suave desde donde termina la banda hacia las islas. Es una cara descendente no transitable; las escaleras no cambian.

**Vista.** Cámara ortográfica de 71°: y × sen 71°, altura × cos 71°; nivel 1 a una altura de 2,9 × D celdas (la cara de D celdas en planta queda perpendicular a la cámara); la banda es una rampa lineal de esa altura a 0 y cada celda se dibuja como escalón con su cara sur; colores planos y contorno. Las caras del norte quedan detrás de la meseta. La altura de 2,9 × D y la de los muros (6 celdas) son hipótesis mías.

## Lecturas (todas por versión y D; el json trae las seis corridas)

| | V1 D 4 | V1 D 5 | V1 D 6 | V2 D 5 |
|---|---|---|---|---|
| Celdas de nivel 1 (pisos + muescas) | 515 | 515 | 515 | 515 |
| Celdas de nivel 0 caminables | 2234 | 2218 | 2202 | 2218 |
| Celdas de banda | 220 | 269 | 295 | 313 (44 en la columna central) |
| Celdas de escalera | 80 | 96 | 112 | 96 |
| Piso decorativo restante (de 891) | 750 | 727 | 724 | 727 |
| Banda que no cupo | ninguna | ninguna | 25 celdas de arista, falta 1 | ninguna |
| Error de espejo de la banda (x = 28,5; los pisos de nivel 1 ya dan 268) | 152 | 174 | 198 | 174 |

**Banda que no cupo (D = 6).** La separación entre la franja y sus vecinas del norte y del sur es de exactamente 5 celdas, así que con 6 se acorta en 1: cara norte de X4, columnas 23–34 en la fila 40 (12 celdas de arista), y cara sur de X5 / X6, fila 55, columnas 12–17, 25–27 y 30–33 (13 celdas). Con 4 y 5 cabe entera en las cuatro caras.

**X4, X5 y X6.** Piso igual al de `P1_R` (0 celdas cambiadas). Perímetro cerrado por muro mínimo, externo, sobrante o banda: X4 **72,7 %**, X5 **69,8 %**, X6 **65,7 %**; lo abierto son sus gates y escaleras (X4 10 celdas de gate, X5 20 de gate y 7 de escalera, X6 11 y 12) y 5 celdas de contacto heredado con otra sala. Ninguno tiene perímetro abierto a piso decorativo. Entre las tres no hay piso abierto más ancho que su gate: X4–X5 y X4–X6 se tocan en 1 celda heredada cada par (más los gates de 3), X5–X6 en 0.

**A\*** (I → 19, J → 25, cofre 2 → 20; guía D 116 / 216 / 142 pasos). Antes (`P1_R`, sin niveles): 114 / 210 / 140. Después (con escaleras): **114 / 210 / 140**, mismas secuencias de salas, G cerrada. **Pero las tres rutas entran a X5 por el contacto heredado de 1 celda X5 (48, 6) ↔ Y10 (49, 6), que ahora es un cambio de nivel directo sin escalera**; la salida (Y14 o la escalera de Y13 / g11) sí cruza una escalera (1 por ruta, 5 u 8 celdas). Si ese contacto se cierra solo para el cálculo, las rutas pasan por la escalera de X5↔Y10 y quedan en **116 / 212 / 142** pasos, con 2 escaleras cada una (7 / 10 / 7 celdas). Ese contacto es una de las uniones heredadas; no se cerró en el mapa.

## Lo que no coincidió con la predicción de [R]

- **Banda de 5 celdas casi entera en el hoyo sur, corta al norte sobre Y12 y Y13:** cabe entera también al norte (ninguna falta con 5). Se acorta solo con 6.
- **Las escaleras más largas caen en Y14 y Y15:** no; con D = 5 todas las de puente miden 5 (Y12, Y13, Y14, Y15); las más cortas son las de contacto (2 celdas).
- **En V2 una de las dos (Y14 / Y15) se reemplaza o se acorta:** no cambia ninguna escalera (las celdas de escalera son idénticas en V1 y V2).
- **X4 es la que más arriesga su framing, con su único lado abierto al sur:** X4 es la más cerrada de las tres (72,7 %); su lado sur es muro mínimo y sus únicas aperturas son los dos gates hacia X5 y X6. La menos cerrada es X6 (65,7 %).
- **V2 deja menos piso decorativo y una cara sur más continua:** el piso decorativo restante es el mismo en V1 y V2 (la columna central era muro mínimo, no decorativo) y la cara sur no cambia; V2 solo añade 44 celdas de banda en la columna.

**Observaciones que salen de las medidas.**
- La escalera de Y13 queda pegada al lado este de X6 en las filas 40–41 (X6 nivel 1 a un lado de un puente de nivel 0 sin banda ni muro); en Y12 el mismo tramo es muesca de nivel 1.
- Con la profundidad de 5 el hoyo se llena de banda en la franja norte y sur; el piso decorativo que queda (727 celdas) está casi todo fuera de la franja, en el norte lejano y entre las islas.
- Para que V2 cambie algo más que 44 celdas haría falta espacio decorativo en la columna central; hoy son 2 celdas de muro mínimo entre dos pisos de sala.

## Archivos

`V1_planta.png`, `V2_planta.png` (cada una con D = 4, 5, 6 en tres paneles y leyenda), `V1_vista.png`, `V2_vista.png` (ídem, vista de 71°), `comparacion.png` (V1 | V2, D = 5, planta arriba y vista abajo, misma escala), `vessel_altura.json` (las seis corridas: celdas, escaleras, salas, bandas cortas, rutas A\*), `HASHES_vessel_altura.txt` (dos corridas idénticas). Estiramiento, escala × 2 y techo doble van en otros pasos.
