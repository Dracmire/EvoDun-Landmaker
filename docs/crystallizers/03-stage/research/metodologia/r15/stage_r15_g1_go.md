# Pedido a CC — R1.5 Pase G1: grupo «masas verticales y planos» en 3 salas DAC (v314)
Árbol congelado e882c5c (`/tmp/m6n/wtC`); nada de `src/`: fija constantes y hooks en la página, como en el Pase 2. CC construye, renderiza y mide; NO juzga composición. Las predicciones ya están congeladas.

## Salas y base
- Salas 1, 3 y 9 de `dac_stage` (las 3 primeras candidatas por id de tu Paso 0 del Pase 2). Posiciones k0, k4, k8 con tu misma fórmula del Pase 2.
- BASE en cada sala = tu estado B del Pase 2: cierre BACK de `planes` a baranda de 1 H, margen de ventana mínimo que incluya entera la vecina, vecina +Δ con Δ = el menor de {0; 0,5; …; 4,0} H con V(k4) ≥ 20 % (tope 4,0 H, informado). Para la sala 1 debe reproducir tus g_k*_B (mismo hash); si no: PARA.

## Trucos (volúmenes del visor, solo en la sala elegida o su borde)
- A3 · Obstructores de primer plano: lado FRONT (el cercano a la cámara con el yaw de `orient`). 2 pilares de 2×2 tiles y 5 H sobre tiles NO transitables pegados al suelo de la sala, uno por tercio lateral del ancho de la sala, el más cercano al centro de su tercio, a ≥ 3 tiles del camino. Si un tercio no tiene tile válido: se omite ese pilar y se informa.
- A4 · Fondo con vano focal: desde k4, el plano más lejano visible sobre el eje de cámara (cierre o vecina). Un volumen claro de 2×1 tiles y 3 H sobre ese plano, centrado en la columna del eje. Informa sobre qué se apoyó y su altura visible.
- C2 · Pares que flanquean el camino: cada 6 tiles del camino de props desde el tile 3, 2 pilares de 1×1 y 4 H a ±2 tiles perpendiculares al camino, solo sobre tiles NO transitables (si es transitable, se omite; nunca bloquees el paso). Informa cuántos se colocaron y cuántos se omitieron.

## Estados por sala
BASE · TODO (BASE + A3 + A4 + C2) · TODO−A3 · TODO−A4 · TODO−C2.

## Renders y medidas
1. PNG limpios 1280×720 por sala, estado y posición (5 × 3 × 3 = 45): `g1_s{sala}_k{0,4,8}_{BASE,TODO,mA3,mA4,mC2}.png`. 2 corridas con el mismo hash.
2. Control por sala: máscara transitable, camino y meta iguales en los 5 estados (sha256). Si difieren: PARA.
3. Por estado y posición: V de la vecina, % del cuadro ocupado por los volúmenes de cada truco, y si alguno tapa al héroe (> 25 % de su silueta).
4. Hojas para [U] aparte: por sala y posición, BASE | TODO con anotaciones.

## Entrega
`r15_g1.zip` (45 PNG, hojas, `r15_g1_medidas.txt` con Δ por sala, colocaciones y omisiones de cada truco, hashes, V y control) + SHA256SUMS.

## Paradas
BASE de la sala 1 no reproduce el Pase 2 · el control falla · hace falta tocar `src/` · un hash difiere entre corridas · una sala no tiene vecina con la regla.
Informe: cada paso HECHO / NO HECHO con evidencia; sin «se parece». Si el entorno añade un pie de atribución o un enlace de sesión, dilo.
