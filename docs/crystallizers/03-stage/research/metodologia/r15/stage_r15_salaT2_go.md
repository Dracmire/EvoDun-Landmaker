# Pedido a CC · R1.5 · Sala T2: proporciones de la toma 0202 sin trucos de cámara (v324)

Decisión de [U] (2026-11-18): antes de seguir con los transformadores, la sala tiene que dar la toma de 0202 SOLO con sus proporciones.
- El héroe está arriba de la escalera, entre los dos pilares, a la altura de pantalla de 0202, no al centro.
- La escalera llega hasta el borde inferior y los pilares salen por arriba.
- Lo que se compara es el ángulo con que convergen los bordes de la sala.

No es una prueba de pilares. Cámara: Cam 6 tal cual (FOV 30, pitch 25), sin zScale ni ganchos de FOV.

TU PAPEL: construyes, renderizas y mides. No juzgas composición.

## 1. Lo que falla hoy (lectura de [R])
En la sala T (s1), la escalera cubre solo y 0,55–0,75 y debajo queda una franja plana del suelo bajo. En 0202 la escalera baja de y ≈ 0,62 a ≥ 0,90 y sigue fuera del cuadro.

Modelo ortográfico aproximado, en alturas de héroe en pantalla: la extensión vertical de una escalera vale 0,906 · R + 0,423 · L, con R = subida y L = recorrido, ambos en H.
- Sala T: R = 1,25 H y L = 2 H dan 1,98 H × 0,108 ≈ 0,21 del cuadro, que coincide con lo observado.
- 0202 pide ≈ 0,43 del cuadro, es decir unos 3,5–4 H de pantalla.

## 2. Sala T2 (cambios sobre la sala T; lo demás igual)
| Pieza | Sala T | Sala T2 |
|---|---|---|
| Subida L0 → L1 | 1,25 H | **2 H** (± 0,25) |
| Escalera | 4 tiles de recorrido, 5 peldaños | **7–8 tiles** (3,5–4 H), 7–8 peldaños, ancho 7 |
| Salón bajo el labio norte | 2,5 H por debajo de L1 | ≥ 2,5 H por debajo de L1 |
| Pilares del par | 5 H, en lo alto de la escalera | 2×2 al PIE de la escalera, a los lados (sobre L0), con la altura que necesiten para salir por arriba desde s1 (≈ 8 H, A155), y la cima ensanchada (3×3, 1 H) |
| Profundidad más allá del héroe | labio norte en z 38 | ajústala: alarga o acorta la sala para que el borde lejano caiga en y 0,10–0,17 |

Usa la cuantización que necesites (`terraces`, `terH`) para que las alturas salgan exactas, y dilo.

## 3. Encuadre (sin trucos)
- Héroe en lo alto de la escalera, en el eje.
- `heroFrac` 0,108 (medido en 0202, A374).
- `heroScreen` [0,50; 0,52] (pies en y ≈ 0,52, como 0202).

## 4. Objetivos en pantalla (0202, Anexo F; vuelve a medirlos con cajas en la toma)
- Escalera de y ≈ 0,60 a ≥ 0,95.
- Pretil y 0,53–0,60.
- Pilares en x 0,35–0,46 y 0,65–0,77, saliendo por arriba.
- Balaustrada lejana en y 0,10–0,17.

Informa cada cifra medida en T2 contra la de la toma.

## 5. El ángulo del borde (lo central)
- **En la toma 0202:** mide el ángulo en pantalla del borde de la sala que se aleja por el lado derecho (el límite suelo / muro hacia el fondo). Dalo desde la horizontal y desde el borde vertical de la pantalla.
- **Referencias de [R] y [U]:** [R] midió en dos recortes de [U] ≈ 44–46° desde la horizontal. [U] estimó a ojo 29–31°. Di cuál definición coincide.
- **En la sala T2:** mide el mismo borde, en la misma zona de la pantalla.
- **Si la diferencia pasa de 5°:** PARADA, con una hoja para [U] (toma | T2, con las dos líneas dibujadas). Eso se convierte en una prueba que juzga [U].

## 6. Desierto (segunda referencia)
- Si tienes la escena del desierto (V2, v301), renderízala con el héroe donde está en la toma del remake: al comienzo del desierto, con la cámara en su límite inferior.
- Mide la convergencia de los bordes del camino en el viewer y en la toma. [U] adjunta la toma; es de terceros y no se commitea.
- Si no tienes la escena, dilo.

## 7. Entrega
- Hojas: «toma 0202 | T2 en s» y «toma desierto | desierto viewer», con las líneas de borde dibujadas.
- `medidas_T2.txt`.
- Los PNG sueltos.
- `SHA256SUMS` y un zip.
- Ningún juicio.

## PARADAS
- Algo exige `src/`.
- El borde difiere más de 5°.
- El mismo fallo se repite dos veces.
