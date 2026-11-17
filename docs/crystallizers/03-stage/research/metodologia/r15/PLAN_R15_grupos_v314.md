# R1.5 · Plan de 3 pases por grupos de trucos — [R], v314, 2026-11-16
Decisión de [U] (21:02): probar los trucos por grupos y resolver en 3 pases. La regla «una variable por pase» se reemplaza por «un grupo por pase, con atribución por quita-uno».

## Diseño común
- Base del pase = el estado ganador anterior. Pase G1 parte de la regla del vistazo (B del Pase 2).
- Salas: las 3 primeras candidatas del Paso 0 del Pase 2 por id (1, 3, 9; todas con vecina), mismas reglas de elección. Posiciones k0, k4, k8 del camino de props.
- Estados: BASE · TODO (base + todos los trucos del grupo) · TODO−X (uno por truco).
- Juez: 3 subagentes ciegos, referencia toma 0137, mismo texto del Pase 2. Comparaciones por sala y posición: TODO vs BASE y TODO vs TODO−X para cada X.
- Lectura: el grupo sirve si TODO gana a BASE en ≥ 6 de 9 (sala × posición). Un truco aporta si TODO gana a TODO−X en ≥ 5 de 9. Los que aportan pasan a la base del pase siguiente; los que no, se marcan «sin efecto aquí» (no descartados).
- Control: máscara transitable, camino y meta iguales en todos los estados (salvo donde el truco cambia el terreno y se declara).

## Grupos
- G1 · Masas verticales y planos: A3 obstructores de primer plano · A4 fondo con vano focal · C2 pares que flanquean el camino.
- G2 · Altura: B2 relieve concentrado (`subs` 1) · B4 exagerar solo arquitectura (`exag` sobre planes y volúmenes) · B6 profundidad comprimida en Z. Cambia terreno: el control se relaja y se declara.
- G3 · Encuadre y cámara: C3 cinta guía sobre el camino · C5 héroe más pequeño en interiores (`heroFrac` 0,10) · C6 cámara más ortográfica (FOV menor con la misma escala del héroe).
- Fuera: A1–A2 (ya probados, en la base), A5–A7 (ya son regla o defecto del visor), A8 y B5 (sin regla implementable hoy), B1 y B3 (dependen del mapa de origen), D (aspecto).
Cada grupo se congela al empezar su pase, con la base que deje el anterior.
