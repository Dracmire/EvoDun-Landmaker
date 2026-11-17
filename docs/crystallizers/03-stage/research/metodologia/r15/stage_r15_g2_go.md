# Pedido a CC — R1.5 Pase G2: altura y exageración en 3 salas DAC (v315)
Árbol congelado e882c5c (`/tmp/m6n/wtC`); nada de `src/` (constantes y hooks en la página, como en G1, declarados). CC construye, renderiza y mide; NO juzga composición. Las predicciones ya están congeladas.

## Paso 0 · terreno nuevo y salas
1. `dac_stage` con `terraces` 3 y `subs` 2 (corrección de [U]: máximo 3 terrazas y 1–2 subterrazas). Informa el sha256 del terreno y cuántas salas hay.
2. Repite tu Paso 0 del Pase 2 sobre este terreno: salas con 250–600 tiles transitables (definición estricta), sin 84 ni 65, con vecina a ≤ 10 tiles más allá del borde de fondo en la dirección de `orient`. Toma las 3 primeras por id. Tabla de candidatas en el informe. Si hay menos de 3: PARA.
3. Posiciones k0, k4, k8 con tu fórmula del Pase 2.

## Paso 1 · estados (por sala)
- BASE: regla del vistazo como tu B del Pase 2 (baranda BACK de 1 H, margen mínimo con la vecina entera, vecina +Δ con Δ = el menor de {0; 0,5; …; 4,0} H con V(k4) ≥ 20 % de la VECINA, tope 4,0 informado). `vScale` 1, `exag` 1, `subs` 2. Mantén `noFront` y `volumeOnWalkable` como en G1.
- TODO: BASE con `subs` 1, `exag` 1,3 y `vScale` 1,25.
- TODO−B2 (`subs` 2, exag 1,3, vScale 1,25) · TODO−B4 (`subs` 1, exag 1, vScale 1,25) · TODO−B7 (`subs` 1, exag 1,3, vScale 1).
- Δ se calcula solo en BASE y se usa igual en los 5 estados.
- Si cambiar `subs` cambia la máscara transitable, el camino o la meta, NO pares: decláralo con los hashes.

## Paso 2 · renders y medidas
1. PNG limpios 1280×720 (45 por las 3 salas): `g2_s{sala}_k{0,4,8}_{BASE,TODO,mB2,mB4,mB7}.png`, 2 corridas con el mismo hash.
2. Por estado: hashes de máscara, camino y meta; niveles transitables; escalón máximo entre tiles transitables (H); W p95 (H); V de la vecina en k0/k4/k8.
3. Hojas para [U] aparte: BASE | TODO por sala y posición.

## Entrega
`r15_g2.zip` (45 PNG, hojas, `r15_g2_medidas.txt`) + SHA256SUMS.

## Paradas
Menos de 3 salas candidatas · hace falta tocar `src/` · un hash difiere entre corridas.
Informe: cada paso HECHO / NO HECHO con evidencia; sin «se parece». Si el entorno añade un pie de atribución o un enlace de sesión, dilo.
