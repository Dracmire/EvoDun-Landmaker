# Metodología de generación 2D-HD en el modo 3 — compilado v325 — [R], 2026-11-18

Sigue a `METODOLOGIA_GENERACION_DQ3_v318.md` (proyecto, `claude/`) y la ACTUALIZA con R1.5 (A358–A456). Donde este texto y el v318 difieren, vale este. No toca el Ancla (v1, sin aprobar). Marcas: VALIDADO = medido o decidido por [U]; HIPÓTESIS = sin probar.

## 0. Cambios contra v318, en una línea cada uno
1. **Cámara medida en DQ3:** perspectiva normal, FOV 30, distancia ≈ 19,5 H (heroFrac ≈ 0,10), pitch 24–28 en interiores y ~37–40 a campo abierto (A425, A450, A454). VALIDADO.
2. **No existe vista telescópica** (el sur crece como en la perspectiva normal, ±0,03 en 11 filas) **ni profundidad comprimida** (B6: K ≈ 0,86–0,96). La Cam 8 (`zScale`) no se usa (A449, A451). VALIDADO.
3. **Una sola escala de héroe.** Ancho ≈ 0,030 del cuadro en todas las tomas medidas; la sospecha de dos cámaras queda cerrada (A440, A450). VALIDADO.
4. **La clave del encuadre son las proporciones de la sala**, no un truco de cámara: T3 reproduce 0202 con la Cam 6 sola (A430). VALIDADO.
5. **El pivote de la Cam 6 está a media altura del héroe** (k 0,89–0,96); la distancia efectiva es D/k (A443). VALIDADO (CC).
6. **Regla de profundidad:** el fondo de la sala cae hacia s ≈ 0,55, unos 17 H de suelo más allá del héroe con heroFrac 0,10 (A452). HIPÓTESIS de diseño, sacada de las medidas.
7. **Alturas corregidas:** la balaustrada de 0202 mide 1,34–1,42 H (no 1,10); los pilares de 0202 y 0137 ≈ 5 H (no 7–11) (A450, A433).
8. **Ritmo medido de un pasillo de pilares** (30:55): pilar ≈ 5 H cada ≈ 7,3 H; pasillo de losas ≈ 4,9 H de ancho (CC, t6).
9. **Veredictos de [U] sobre los trucos:** A6 funciona; C3 aprobado (más sutil, tinte del suelo); C2 buen truco mal aplicado; A4 válido pero necesita luz y contraste reales; A3a suelto falla (necesita una secuencia) (A415 y siguientes).
10. **Taxonomía de trucos:** señales (C3, A4/A5), estructuras de encuadre (A6, C2, A3) y reglas de cámara (A1, A7, A416). En las estructuras el truco es la relación de banda, secuencia y posición, no el objeto. Se evalúa el efecto, no la visibilidad (A414, A415).
11. **Trucos cerrados:** R1.5 queda cerrada (A456). El resto pasa a la lista de nunca probados, para el pulido.
12. **Método:** sin jueces automáticos ni agentes. CC construye y mide; [U] juzga mirando; [R] no hace maquetas. Las mediciones simples contra las tomas fueron lo más rendidor (A398, A456).

## 1. Receta vigente (sustituye la §8 de v318)
1. **Entrada.** Pack de la sala inyectado por el arnés, sin `src/`. Transitable estricto: `!block && !void && region >= 0 && !nowalk`.
2. **Topología.** Zonas transitables, no transitables y pasos. Lo estructural es geometría; lo decorativo es ranura.
3. **Terreno.**
   - `terraces` 3, `subs` 2.
   - Peldaño ≤ 0,5 H.
   - Pasos de ≥ 5 integrantes (≈ 3 H).
   - Escaleras en los pasos, hacia el flujo.
   - Interior tipo 0202: la escalera sur en la banda 1 y el héroe en la banda 2, sobre ella.
4. **Proporciones (nuevo).** Profundidad útil detrás del hotspot ≈ 17 H (s ≈ 0,55 en el fondo, heroFrac 0,10). Si la sala no se puede cambiar, se mide y se informa.
5. **Orientación y hotspot.** `orient` con POI primero. El hotspot es transitable, central y está sobre el eje.
6. **Cámara.**
   - Cam 6, FOV 30, K 1, `exag` 1, `vScale` 1, `heroFrac` 0,10, `tilesPerH` 1,5.
   - Pitch 25 en interiores (dentro de 24–28) y ~38 en exteriores abiertos (A454; por gancho del arnés, sin `src/`).
   - `heroScreen` tipo 0202 (0,473; 0,514) en interiores.
7. **Cierres.**
   - `planes` con `noFront` (A7).
   - BACK como baranda (1,0–1,4 H) más el vistazo, cuando hay vecina (A1 + A2: cierre en dos planos). Sin vecina, cierre ≥ 3 H y fondo construido (A4).
8. **Estructuras de encuadre.**
   - **A6:** línea de nivel continua en la franja media (y 0,42–0,60, ≥ 70 % del ancho), con su encuadre.
   - **C2:** un solo par por sala, flanqueando la transición.
   - **A3 como secuencia:** pilares de ≈ 5 H cada ≈ 7,3 H a los lados del eje, nunca sueltos ni en el centro.
9. **Señales.**
   - **C3:** calcomanía en el hotspot, sutil, con el tinte del suelo.
   - **A4/A5:** vano focal al fondo sobre el eje, con el máximo contraste que permite el visor (sin luz real: queda anotado).
10. **Controles.**
    - Máscara, camino y meta iguales entre estados, o el cambio declarado.
    - Hashes ×2.
    - Billboards más rojo ≤ 30 %.
    - Fondo vacío ≤ 2 %.
    - Héroe ± 5 %.
11. **Caminata y juicio.** Posiciones del camino de props; [U] juzga.

## 2. Nunca probados (para pulido o para más adelante)
- **Trucos:**
  - A3b, masa baja de esquina;
  - A8, paso por detrás (puede pedir `src/`);
  - A416, centro de cámara desplazado hacia la marcha;
  - B1, escalera sobre el eje como truco;
  - B3, altura fingida;
  - B5, cara de caída visible;
  - N1, escalera – estatua – escalera;
  - C5 y C7.
- **Bloqueo suave (A434):** la cámara se detiene ~1 H antes de un obstáculo y el héroe sube por la pantalla. Pasó a nunca probados por decisión de [U].
- **Pitch por tipo de zona como parámetro del visor (T55):** necesita `src/`. En las pruebas se fija por gancho del arnés.
- **Fuera del visor (Unity):** D1–D4 (desenfoque, luz guía, niebla, sprites con luz).

## 3. Abierto
- La prueba de Generación ciega (piso no usado, tomas reservadas) sigue sin ejecutarse.
- La generalidad de la cámara en otro juego 2D-HD (Octopath o Triangle Strategy) sin medir.
- PR #94 (Cam 8): sin justificación (A451); cerrar o no lo decide [U].
- Aprobación del Ancla v1.
