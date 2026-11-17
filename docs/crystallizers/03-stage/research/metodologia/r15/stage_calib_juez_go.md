# Pedido a CC — export de cuadros para la calibración ciega del juez (P0, v311)
Repo solo lectura (e882c5c). Nada de `src/`. CC exporta y mide; NO juzga composición ni abre las predicciones (claude/PREDICCION_calib_v311.md, ya congeladas con sha256).

## Qué exportar
1. V2 del desierto: el render que [U] puntuó ≈ 9,5/10 el 2026-11-15 12:42 (v302 §1 y §3: referencia del instrumento con R1 0, Z1 0,50, W p95 3,002 H).
2. V1 del desierto: el render que [U] puntuó ≈ 7/10 en el mismo mensaje.
3. DAC 84 por defecto: el render por defecto que [U] puntuó 1/10 (v302 §3: R1 1,12 H, Z1 0,356, W p95 5,00 H). NO la BASE de v305.
4. Toma DQ3 0202 (original del remake).
5. Toma DQ3 0137 (original del remake).
Si para V1, V2 o DAC hay más de un cuadro puntuado, exportar todos.

## Cómo
- Recortar solo la imagen: sin rótulos, cabeceras, cifras ni textos añadidos por herramientas. Lo que trae la propia imagen se deja.
- Mismo tamaño para todos (1280×720, letterbox si hace falta; declarar si se usó).
- Nombres al azar: `c_XXXX.png` con XXXX de 4 hex, semilla aleatoria declarada.
- `MAPA_calib.json` (nombre → ítem, con la ruta de origen y el hash del render original) en archivo APARTE, con su sha256 en `MAPA_calib.sha256`. No incluir el mapa en el zip de cuadros.
- Entregar `calib_cuadros.zip` + `HASHES_calib.sha256` (un hash por cuadro).

## Paradas
- PARA y pregunta si V1, V2 o DAC 84 por defecto no se pueden identificar sin ambigüedad (dos candidatos o ninguno).
- PARA si el render de origen ya no se puede reproducir con hash idéntico y solo queda una copia; declara cuál se usó.

## Informe
Lista de ítems encontrados con ruta y hash de origen, semilla, tamaño, y el sha256 del zip y del mapa. Sin opiniones sobre los cuadros.
