# Pedido a CC — R1.5 Pase G3: encuadre en 3 salas DAC (v316)
Árbol congelado e882c5c (`/tmp/m6n/wtC`); nada de `src/` (hooks en la página, declarados). CC construye, renderiza y mide; NO juzga composición. Predicciones ya congeladas.

## Base
Salas 3, 8 y 9 del terreno de G2 (terraces 3, subs 2), mismos tiles k0/k4/k8 de G2. BASE = tu BASE de G2 (vistazo Δ 4 H, baranda BACK 1 H, exag 1, vScale 1, hooks noFront, volumeOnWalkable, noGrid). Debe reproducir `g2_s*_k*_BASE.png` (mismo sha256); si no: PARA.

## Trucos (posición medida en PANTALLA con la cámara de k4; nunca sobre tiles transitables)
- E1 · Obstructor de borde: por lado (izq./der.), el tile NO transitable más cercano a la cámara cuya proyección en k4 caiga en el 15 % exterior del ancho y en la mitad inferior del alto. Pilar 2×2 tiles, 6 H. Comprueba en k4 que ningún píxel del pilar entra en el 70 % central del ancho y si su tope sale por arriba del cuadro. Sin tile válido: omite ese lado e informa.
- E2 · Baranda de franja media: bordes donde un tile transitable linda con uno NO transitable ≥ 1 H más bajo y cuya proyección en k4 cae entre el 35 % y el 65 % del alto. Volumen de 0,6 H sobre el tile no transitable (tope = suelo transitable + 0,6 H). Informa nº de tiles y longitud continua máxima.
- E3 · Cinta guía: tu cinta de T42 (estado B), sobre el camino de props desde k0 hasta la meta, mismo color.

## Estados por sala
BASE · TODO · TODO−E1 (`mE1`) · TODO−E2 (`mE2`) · TODO−E3 (`mE3`).

## Renders y medidas
1. 45 PNG limpios 1280×720: `g3_s{sala}_k{0,4,8}_{BASE,TODO,mE1,mE2,mE3}.png`, 2 corridas con el mismo hash.
2. Control: máscara, camino y meta iguales en los 5 estados; ningún volumen sobre tile transitable.
3. Por estado y posición: % del cuadro de cada truco; si alguno tapa al héroe (> 25 % de su silueta); V de la vecina.
4. Hojas BASE | TODO aparte.

## Entrega
`r15_g3.zip` + SHA256SUMS + `r15_g3_medidas.txt`.

## Paradas
BASE no reproduce G2 · el control falla · hace falta tocar `src/` · un hash difiere entre corridas.
Sin «se parece». Si el entorno añade un pie de atribución o un enlace de sesión, dilo.
