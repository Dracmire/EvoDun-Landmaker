# Pendientes del modo 3 (to-do vivo; lo actualiza [R] en cada «guardar»)

Estado al 2026-11-19. Estados: **prueba** (va en el prompt `prompt_pendientes_go.md`), **[U]** (decisión tuya), **[R]** (diseño mío), **espera** (fuera de la línea por ahora), **hecho**.

## 1. Tu feedback de esta etapa, uno por uno

| # | Tu feedback | Qué pasó | Estado |
|---|---|---|---|
| F1 | Escalera de Octopath más plana y corta: mitad de largo, peldaños × m | No cabe con baldosas (A555). Hoy: peldaños normales con contrahuella × m | decidido por [U]: máximo 2 peldaños por baldosa; si hacen falta más, la escalera se alarga · prueba P7 |
| F2 | Cake: descanso (Rest) o todo crece (Scale), o los dos | Los dos construidos; Rest te gustó | hecho; Auto (Scale si el Cake es la única subida) contado, no construido: [R] |
| F3 | Cake Scale se come la terraza; ¿escalones más chicos? | Scale ya no la toca (re-altura las mismas baldosas) | hecho; la lámina actual está sin juzgar: prueba P3 |
| F4 | En la Ascensión las escaleras desaparecieron | Volvieron a peldaños (#114) | hecho |
| F5 | M1: la terraza casi no crece (DQ3 y OT2: 33–40 %) | Medido 26–33 %; lo fija `heroFrac` sin dolly | decidido por [U]: ajustar la cámara (+33–100 %, k0 ≥ 50 % de k8, lectura de [R]) · prueba P8 |
| F6 | Micro-terrazas: buen mecanismo para planicies y dungeons, no para OT2 natural | Anotado (A548) | [R]: entra en las hipótesis de planicie y dungeon |
| F7 | Borde híbrido: cuadrado hacia la cámara, suave hacia el horizonte | Construido; paredes en bandas; en la Ascensión el muro queda encima (A552) | prueba P2 |
| F8 | Prueba de 9 terrazas (tu captura 055111) | El ejemplo pisa tus terrazas: en el modo 3 no se pueden elegir | pruebas P1 y P3 (mismo lugar, 3/5/7/9) |
| F9 | Diorama 31 como interior | T63 | [R]: hipótesis de interior |
| F10 | 70 % de salas de una terraza: salas grandes, semilla, agrupar por tratamiento | Era sobre todo el preset Balanced (veredicto E.1) | prueba P3 (salas Default) |
| F11 | Tratamientos por temática: Down / Mid / Up, o 5 niveles | Construido solo por ejemplo; falta ligarlo a la temática | [R] |
| F12 | Lego: dobles y triples, A+2 en otra sala | A+2 no existe en el dato (A532); lego por representación | A+2 directo no existe en el dato; la escalera larga que cruza franjas angostas (común con 9 terrazas) no está construida · [R] la diseña después de P3 |
| F13 | Lo que falta es el encuadre: calle de terrazas, colina escalonada | T62, sin probar | prueba P4 |
| F14 | Modelo de sala de 16 bits: 2D → 2.5D → HD-2D | T59 | espera (después de alinear) |
| F15 | Sin firmas en PR y commits | Quitadas; el pie lo agrega Claude Code | [U]: ¿CC agrega `attribution` vacío a `.claude/settings.json`? (P0) |
| F16 | Indicador externo: ficha de CC + recibo de [R] | Método escrito (#115) | prueba P0 (primera ficha) |

## 2. Ideas tuyas del comienzo de R2, revisadas

| Idea | Dónde quedó | Sirve ahora para |
|---|---|---|
| Hoja de composición por origen (top-down DQ3 / 2.5D Octopath) | `perfiles_forma.md` §1 | elegir qué hoja usa cada tipo de escenario |
| Linaje 2.5D → HD-2D; componer primero en 2.5D (Cam 7) | A503; Cam 7 con yaw (#107), pero se ve casi en planta | P5: Cam 7 como hoja 2.5D, sin cambiar Cam 6 |
| Perfiles de forma P1–P6 por partes de sala | T2 por partes pedida dos veces y nunca hecha | P6 |
| Mockups M1–M3 contra C0 (T1) | [U]: no hubo prueba real; la comparación válida es el mismo lugar con distintas terrazas | reemplazado por P3 |
| Sub-cámara «deep» y bloqueo suave | A493, en espera | espera |
| Fondo de fachada de Octopath | T58 | espera |
| Avisos de CC en #101 (héroe fuera de cuadro, vacío > 2 %) | Sin respuesta | P6 (re-medir) |

## 3. Diseño pendiente de [R] (después de las pruebas)

- Hipótesis por tipo de escenario, con su referencia de OT2: planicie, bosque, colina o montaña, ciudad o cañón, interior, dungeon.
- Ligar el tratamiento de altura a la temática (F11).
- Dos resoluciones contra escaleras A+2 (veredicto E.5).

## 3b. Congelado

- **LEGO (decisión de [U], 2026-11-20).** Queda como está en main 67c7495: Mid por defecto; Down / Up y Cake Rest / Scale existen, pero no se tocan; el tope `m <= round(T/2)+1` queda mergeado sin juzgar. Medido en Q2: con 7–9 terrazas lo que tapa es la base de la sala (99 % del panel en r21, T7, k4) y el tope lo empeora (base 57 → 65 %, T9, k8). Ningún brief lo vuelve a tocar salvo que una hipótesis de `HIPOTESIS.md` lo pida por su número.

## 4. Tangentes abiertas

T29, T43, T44, T46, T47, T49, T55, T57, T58, T59, T61, T62, T63 (detalle en el Registro).
