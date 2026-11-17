# Definiciones de T26 (planos y vistazo) — v311, [R] con aprobación de [U] (2026-11-16 04:22)
Congeladas ANTES de cualquier pase de T26. Solo se añaden enmiendas al final; no se reescriben.
Origen: [U] 03:53 (banda, plano, eje de sala, solape; vistazo «se deduce»); [R] v311 (función, medidas). Instrumento previo: bandas B1–B6 de las hojas p4h (DQ3 sala F, escenas 0202 y 0137).

## 1. Banda
- Franja de PROFUNDIDAD en el eje Z de la cámara: un intervalo de filas del mapa según su distancia a la cámara (no un rango de píxeles).
- Número: 5 (B1 … B5). Se reparten en partes iguales de profundidad (en tiles, a lo largo del eje de la cámara) entre la fila del suelo que toca el borde inferior del cuadro y el último tile de la sala actual en la dirección de la cámara.
- B1 = la más cercana (primer plano); B5 = la más lejana (fondo). Con el héroe centrado suele caer en B2–B3.
- En pantalla cada banda es una franja horizontal de alto DESIGUAL (proyección); se dibuja como en p4h.

## 2. Plano
- Plano = banda + su contenido. Lo que define un plano es lo que tiene ALTURA en esa banda y puede tapar lo de bandas más lejanas (planos de fotografía; capas BG del SNES).

## 3. Eje de la sala (propiedad de la SALA; término de [U])
- X: el héroe cruza de izquierda a derecha.
- Z: el héroe avanza hacia el fondo, en línea con la cámara.
- Hub: sala cuadrada, equidistante (sala del trono).

## 4. Función de la banda (propiedad de cada BANDA; término de [R])
- primer plano · guía (contiene el tramo del camino) · meta (contiene el destino) · fondo (cierre de la sala) · vistazo (terreno de otra sala).
- Una banda puede tener más de una función; se declara la dominante.

## 5. Solape
- Hay solape cuando algo con altura en la banda k tapa parte de una banda más lejana (k+1 … 5) o al héroe.
- Medidas: (a) % de cada banda oculto por bandas más cercanas; (b) nº de posiciones de la caminata con el héroe tapado (> 25 % de su silueta). Se reutiliza la oclusión del camino de T42.

## 6. Vistazo (se DEDUCE; decisión de [U])
- Hay vistazo en una posición p del héroe cuando en el cuadro aparece terreno de OTRA sala por encima del cierre de la sala actual (normalmente en B4–B5 o más allá).
- Regla deducida: desde la cámara con el héroe en p, la línea de visión pasa sobre el muro/cierre del fondo y cae en suelo de una sala vecina. Se calcula desde el mapa (alturas de salas, cierre, cámara); no se lee de tomas.
- Medida (validación en el render, T35): V(p) = % del cuadro con terreno de otra sala.
- Mirador = la posición transitable p de la sala con V(p) máximo. Dato de [U] (Torre del Soñador): casi todas las salas tienen uno.
- El umbral de V(p) para decir «hay vistazo» se fija en el brief del primer pase de T26, ANTES de correr.

## 7. Distinciones
- Fondo abierto ≠ vistazo: fondo abierto = píxeles VACÍOS (sin superficie) en B4–B5; vistazo = terreno de otra sala en esas bandas.
- Las reformulaciones de J1–J3 en bandas (A314) son hipótesis y NO forman parte de estas definiciones.
