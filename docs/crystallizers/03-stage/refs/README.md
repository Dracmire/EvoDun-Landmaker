# refs/: material de referencia del modo 3

Imágenes de estudio para el modo 3 (el juez es la toma emparejada contra la referencia). Hoy solo hay material de DQ3: `dq3/` (tabla de nombres, procedencia y qué muestra cada archivo en `dq3/index.md`).
- `dq3/old/` 7 rips 16-bit del remix de Paco; `remake/` 18 capturas de juego del remake HD-2D (tomadas por el usuario);
  `pairs/` 10 imágenes viejo ↔ remake (fotogramas de un video comparativo de terceros y composiciones);
  `other/` 4 capturas de Dragon Quest XI, no DQ3;
  `forest_plains/` espacio de trabajo del par de M3 (`pair.md` y `annotated/`, sin copias de imágenes).

Reglas (sección 3b de `../MVP.md`):
1. Originales intactos; la anotación va aparte, en `annotated/`.
2. Solo lo que el gate usa; recortar lo demás.
3. No reemplazar PNG grandes: si hay que rehacer uno, archivo nuevo con otro nombre (`.git` ya pesa 70 MB).
4. Nada de `refs/` entra en `dist/` ni en el build del viewer.
5. Los tests del carril rápido usan el fixture sintético; solo M3 y M4 leen el par real.
6. Un par nuevo es una carpeta de trabajo hermana de `forest_plains/` que referencia por nombre; no se copian imágenes.
7. Nombres sin espacios ni acentos (los originales «Captura de pantalla …» se renombraron con `git mv`, sin duplicar bytes).
8. Las capturas «pairs» son fotogramas de un video de terceros y las de «old» son rips de Paco: referencia de estudio; la procedencia está en `dq3/index.md`.
