# Informe de metodología y aprendizajes HD-2D / DQ3 — nivel actual de EvoDun (cristalizador «Stage», modo 3)

Autor: [R] (revisor, Claude) · Fecha: 2026-11-17 · Pedido de [U] del 17 nov 01:35 · Documento aparte: **no se anotó nada en el Registro, ni en Tangentes, ni en el Estado vigente, ni en el Ancla.** Este archivo no emite marcas ► ni ◇.

**Versión integrada (v319, 2026-11-17).** Este archivo une dos informes del 17 nov: el de método y aprendizajes (secciones 0–8 y anexos A–D, sin cambios de contenido) y `METODOLOGIA_GENERACION_DQ3_v318` del otro chat, del que se añaden la §9 (receta de generación para una sala nueva) y los anexos E (alturas medidas) y F (patrones de las tomas). Ese documento queda retirado como archivo aparte. Las fichas ejecutables de cada truco siguen en `INFORME_METODO_TRUCOS.md`, en esta misma carpeta.

Propósito: que otra sesión, leyendo solo este archivo (y abriendo las fuentes que él indica), pueda **reproducir el nivel de trabajo actual**: mismo método, mismos instrumentos, mismo vocabulario, mismas reglas de juicio, y saber qué está probado, qué es hipótesis y qué se descartó.

Etiquetas de origen: **[U]** usuario · **[R]** revisor (Claude) · **CC** Claude Code (construye, renderiza y mide; no juzga composición) · **[Ref]** medido en la referencia · **[Repo]** código del repo. Estados: **VALIDADO** (medido o dictado por [U]) · **HIPÓTESIS** · **DESCARTADO** (con motivo) · **REGLA** (dictada o aprobada por [U]).

---

## 0. Cómo usar este informe y qué se leyó para escribirlo

### 0.1 Orden de lectura para una sesión nueva
1. §1 (dónde estamos) y §2 (método). Con eso se entiende el modo de trabajo.
2. §3 (vocabulario) antes de abrir cualquier nota: banda, plano, hotspot, vistazo, verde/azul/rojo.
3. §4 (las pruebas: Bosque, sala del trono, Torre del Soñador, DAC, calibración, R15) en el orden en que ocurrieron: cada una corrige a la anterior.
4. §5 (lista de aprendizajes) como referencia rápida, §6 (qué no repetir), §7 (cómo reproducir), §8 (abierto).
5. Anexos: cifras clave y mapa de fuentes.

### 0.2 Fuentes y cobertura (honestidad de la lectura)
Leído **por completo** para este informe: el documento de estado (Ancla —el bloque «Ancla (v1)» sigue siendo la plantilla con campos entre corchetes sin llenar; lo que las notas llaman «el Ancla» o «el Norte» vive en `BRUJULA_modo3.md` y en las decisiones de [U]; los borradores sin aplicar están en v177 §6, v258 §4 y v300 §3—, Estado vigente, Reglas y ganancias, Metodología del modo 3, Registro A001–A357, Preguntas abiertas, Tangentes T01–T47, Bitácora; revisión 184, «S6 · 2026-11-17 01:35»); `ANALISIS_pases_M6_metodologia.md`; `INFORME_METODO_TRUCOS_v318.md`; `PLANTILLA_escena_dorada_modo3.md`; nota v226 (trono); `ANALISIS_movimiento_trono_dq3_aliahan.md`; `DEFINICIONES_T26_v311.md`; `RESULTADO_calib_v311.md`; `PREDICCION_R15_P1_v312.md`; `RESULTADO_R15_P2_v313.md`; `PLAN_R15_G4_camaras_v316.md`; `BRUJULA_modo3.md` (incluye el registro de decisiones v160–v298). De las notas del Bosque (v177, v178, v182, `stage_m3_m4c_forest_step0_go`, `stage_m3_m4c_capas_go`) leí los extractos que devuelve la búsqueda del Proyecto y el registro de decisiones de la BRÚJULA, no cada nota entera.

**No releí nota por nota**: v1–v176 (fase del generador, corpus 16-bit, DAC v2, recetas `hd2d_*`), v227–v300 individuales (cubiertas por el análisis consolidado, el Registro y la BRÚJULA), los informes `RESULTADO_R15_P1`, `G1`, `G2`, `G3` (uso las filas A332–A353 del Registro, que los resumen con cifras), `RUBRICA_juicio_v305`, `CALIF_*`, `next_crystallizer_design_pass_v310` y `T42_dac2_medidas` (T42 lo cerré yo en la sesión anterior y sus cifras están en A296–A308), ni los prompts `stage_*_go.md`. Donde una cifra viene de un resumen y no de la nota original, el informe lo dice. Antes de usar una cifra como compuerta de un pase nuevo hay que abrir su nota fuente (índice en el Anexo B).

---

## 1. Dónde estamos (el nivel actual en una página)

### 1.1 Qué se está construyendo
- **Norte** (BRÚJULA, [U] 9 nov 04:06): una **maqueta 2D-HD general** en el visor del repo `Dracmire/EvoDun-Landmaker` (checkout de trabajo en el commit **e882c5c**). Un mapa viejo (16-bit) o un mapa generado se convierte por reglas en una escena 3D simple (cubos, volúmenes, billboards, cintas) que, vista con una cámara fija, **se parece en composición** al remake HD-2D. DQ3 es la primera prueba; Octopath Traveler, Triangle Strategy y Wandering Sword son pruebas posteriores (hoy suspendidas, salvo que [U] las reactive). No se hace ingeniería inversa de DQ3.
- «Parecerse» = **composición** (capas del encuadre, cierre del fondo, ancho de ruta, escala del héroe, planos), **no look** (luz, texturas, desenfoque, color: se juzgan en Unity; `T03`, `T15`). Con cubos apilados basta ([U] 9 nov 01:37).
- Cámara: **Cam 6** (perspectiva, FOV 30°, pitch 25°) **se queda**. Se probó proponer una cámara casi ortográfica (C6) y [U] la descartó porque va contra el Ancla (A347).
- El visor es «la casa»: se generan y miran muchos modelos; 1 de cada ~100 va a Unity.

### 1.2 Estado de las pruebas (resumen)
| Prueba | Rama | Resultado | Qué prueba y qué no |
|---|---|---|---|
| **Bosque** (Forest / Shrine of the Plains) | R1.1 | Toma dorada 1 aceptada por [U] (9 nov, A028) | Capacidad: se puede reproducir la composición de una escena con cubos y datos a mano. No prueba generación. Billboards ≈ 65 % (excede el tope de 30 %, deuda reconocida). |
| **Sala del trono** (Aliahan, DQ3) | R1.2 | A-OK parcial de [U] (11 nov, A068); #87, #89, #90 mergeados (`e882c5c`) | Capacidad en un interior con mapa hecho a mano; el mundo con geometría vertical sustituye a las tarjetas (billboards 81 % → 8,84 %). Una sola sala. |
| **Torre del Soñador** (Najimi Tower / Dreamer's Tower, M6) | R1.3 | Desarrollo con terreno dado: 8 salas, 5 de 8 en ≥ 9,5 según [U]; **ninguna regla de generación sobrevivió** | Hallazgo negativo firme: el mapa viejo sin anotar no trae el relieve (A229); el juez (Najimi piso 2) no era fiel (A230). Prueba ciega en el piso 3: nunca hecha. |
| **DAC** (salas 84 y 65, generadas) | R2 / R1.3 | T42 cerrado en parcial (A304, A308) | Palancas del visor movieron J2 y J1, no J3 de forma estable; las salas quedaron «quemadas» para la prueba ciega. |
| **Calibración del juez** | R1 | CALIBRA el orden (A320) pero la rúbrica no cumple las propias tomas del remake (A321) | Obligó a abandonar la rúbrica J1–J3 como juez y a pasar a comparación ciega contra la toma real (A325). |
| **R15 · Pase 1 (vistazo en DQ3 sala F)** | R1.5 | **POSITIVO**: B1 gana 3/3 en 0137 y 3/3 en 0202 (A332) | Primera palanca de composición que mueve el juicio ciego hacia la toma. |
| **R15 · Pase 2 (generación en sala DAC no usada)** | R1.5 | **POSITIVO**: B gana 9–0 a K y a A (A336) | Primera respuesta afirmativa a la pregunta de Generación del Ancla **para un truco de composición**. 1 sala, 3 posiciones, 3 jueces del mismo modelo. |
| **R15 · G1, G2, G3** (grupos de trucos) | R1.5 | Los tres **NEGATIVOS por regla**, pero G1–G3 con pedidos defectuosos (A355): sus trucos vuelven a «probado mal» o «nunca probado» | Base vigente = BASE de G2. |
| **R15 · G4-M (cámaras, medición)** | R1.5 | En curso (PARADA 1 entregada con la Enmienda 1, A356) | Hipótesis de [U]: dos cámaras (perspectiva en la sala; fondo más «plano» tras la baranda). |

### 1.3 Lo que NO existe todavía (límites duros)
1. **Prueba de Generación ciega limpia** (mapa nuevo o viejo sin tocar → reglas congeladas → render → comparación con una toma que nadie abrió antes). Nunca se hizo limpia (C12 «no probada»). Es la única prueba del Ancla.
2. **Juez validado**. La rúbrica J1–J3 se retiró como juez; la comparación ciega contra la toma real es el juez vigente pero solo se aplicó en pocas salas y con jueces del mismo modelo.
3. **Ancla v1 aprobada**: no existe. El bloque del documento de estado es la plantilla sin llenar (campos entre corchetes) y hay sugerencias pendientes (el Estado vigente lo dice: «Ancla v1 sin aprobar»); los borradores (v177 §6, v258 §4, v300 §3) no se han aplicado. Cuando este informe dice «el Ancla» se refiere al Norte vigente en la BRÚJULA y a las decisiones de [U], no a un texto aprobado.
4. **Aspecto** 2D-HD (pixel art, tilt-shift, DoF, luz): fuera del visor (T15, T03; grupo D del catálogo).
5. **Exportación de los datos a mano** de las 8 salas de la Torre del Soñador, los scripts y los hashes (T29): viven solo en el entorno de CC.

---

## 2. Metodología

### 2.1 Roles y reparto del trabajo
| Rol | Hace | No hace |
|---|---|---|
| **[U]** | Dicta el Norte, las reglas y las definiciones conceptuales (planos, hotspot, verde/azul/rojo, bordes de isla); aporta tomas, mapas y clips; aprueba o rechaza; decide el Ancla | No es el bucle de desarrollo: «cuando el desarrollo depende de mis lecturas deja de ser constructivo» (A232). Su nota no entra en el juicio de los pases de R15 (A282, Enmienda 2) |
| **[R]** | Escribe predicciones, criterios, pedidos a CC y fichas; verifica de forma independiente; arma las pruebas ciegas; lee y mide con sondas propias; mantiene el registro de errores | No juzga ciego si vio las tomas (A315); no puede ser constructor y juez a la vez |
| **CC** | Construye (solo datos y hooks de página, sin tocar `src/` salvo excepción nombrada), renderiza, mide, entrega hashes, para en las PARADAS | No juzga composición; no interpreta una instrucción incompleta: **PARA y dice qué falta** |
| **Jueces ciegos** | Subagentes sin contexto, ≥ 3, tandas ≤ 9–10 pruebas (A342 dice ≤ 10; los pases usan 9); comparan renders contra la toma real | No ven mapas de etiquetas, rótulos ni la rúbrica |

Reparto por fortaleza (A216, M8 del análisis M6): la **percepción del mapa** pasa a [R] (especificación en tiles + lectura dibujada que [U] confirma de un vistazo); CC solo **codifica y verifica** con una superposición independiente (Δ ≤ 1,5 tiles). Funcionó (F y 0156 subieron a 10 y 9,5), con el límite de que si la especificación de [R] está mal, CC la copia fielmente.

### 2.2 El ciclo de un pase (el protocolo vigente en R1.5)
1. **Pregunta** de una línea y **una sola variable** por pase (o un grupo de trucos con atribución por quita-uno, desde G1, decisión de [U], A339).
2. **Brief a CC** (`stage_*_go.md`): alcance (solo datos / hooks), fuentes, reglas que quedan encendidas, PARADAS, qué NO se prueba, entrega ≤ 1,5 páginas, hashes ×2.
3. **Predicciones y regla de decisión congeladas con sha256 antes de ejecutar** (`PREDICCION_*.md`, `HASHES_*.sha256`). Enmiendas: solo al final, con hora, **no retroactivas**.
4. **Control de entrega** por [R]: hashes ×2 iguales, máscara/camino/meta idénticos entre estados, cuántos tiles cambiaron, cuántas piezas se colocaron, y **hoja de presencia** (desde A357): cada truco, sala y posición → PRESENTE con su medida o AUSENTE con motivo. Lo AUSENTE no va a los jueces.
5. **Juicio ciego**: [R] arma las pruebas con orden al azar y guarda el mapa de etiquetas aparte; lo abre solo después de los votos.
6. **Aplicación de la regla congelada** → POSITIVO / NEGATIVO / NULO. Un resultado negativo con pedido defectuoso **no cierra** el truco.
7. **Registro** (solo cuando [U] dice «guardar» o «commit») y nota `vNNN` con lo que pasó, errores incluidos.

Texto exacto que recibe cada juez (P1, vigente): «La imagen R es una referencia. Las imágenes 1 y 2 son maquetas sin texturas. ¿Cuál de las dos, 1 o 2, se parece más a R en COMPOSICIÓN: qué se ve en cada franja de profundidad, qué tapa a qué, qué tan lejos se ve y dónde queda el personaje? Ignora color, luz, texturas y detalle. Responde 1 o 2 y una línea con la razón.» Gana un estado si lo eligen ≥ 2 de 3. Tandas de ≤ 9 pruebas por juez: con 33 por juez hubo pérdida de contexto (A341–A342).

### 2.3 Instrumentos de medida (lo que CC sabe hacer y [R] verifica)
- **Hashes de render ×2** (dos corridas iguales) antes y después de cada cambio; árbol congelado e882c5c; arnés que corre el visor de trabajo (byte-idéntico al repo) con packs inyectados en tiempo de ejecución, **sin tocar `src/`** (A236).
- **Héroe**: `heroFrac` (zoom; caja de 1 H en el pivote, no la figura visible: error de [R] A150), `heroScreen` [fx, fy] (dónde caen los pies), `heroAt` (posición en el mapa). La figura del marcador = cabeza + cuerpo + punto; medir solo el cuerpo falseó la escala (A153).
- **Cámara**: lienzo 16:9 (1220×686 o 1280×720), `tilesPerH` 1,5, pitch leído por escorzo del hexagrama (≈ 23° ± 5, A255). Cam 5 real (ortográfica, 80° + 9° de arrastre = 89°) como **segunda cámara de control** cenital con superposición del mapa (A192, A208).
- **Alturas**: aparente ≈ dato^exag × vScale (A170, confirmada a la vista A174) → dato = (aparente ÷ vScale)^(1/exag). `exag` sube muros, volúmenes y objetos; `vScale` sube todas las alturas, peldaños incluidos (≈ 2× en la escalera). Cuantización por `terraces` / `subs` / `terH`.
- **Lecturas de composición** (control de fallas, no juez de parecido): `tools/stage_readings.js` (escala del héroe, fondo cerrado, meta en cuadro, ruta, plataformas), `voidShare`, `blockedShare`, luma de P / alfombra / suelo, billboards = píxeles que cambian al quitarlos (panel completo), oclusión del camino por tile con pick buffer, simetría por espejo, caminata (yaw constante; salto ≤ 2,5 × la mediana), render de ids (cada pieza → % del cuadro y caja en pantalla), V(p) = % del cuadro con terreno de otra sala.
- **Cuidado**: `walkableAt` de `stage_readings.js` es más laxo que las reglas (429 vs 283 tiles en DAC 84; A242): medir con la misma definición de transitable que usan `orient` / `planes` / `props`.

### 2.4 Cómo evolucionó el juez (y por qué)
| Etapa | Juez | Por qué se abandonó o se conserva |
|---|---|---|
| 1 | **[U] mirando** más lecturas del visor como control de fallas (regla 6 de la auditoría; v180) | Sigue siendo el criterio de composición final, pero «lo que depende de mis lecturas no es constructivo» (A232) |
| 2 | Lecturas objetivas (M3a, M4, M5, M8…) | Miden fallas, no parecido (A254): «pasa el instrumento» ≠ HD-2D |
| 3 | **Rúbrica J1–J3** de [R] (eje legible, masas verticales a ambos lados ≥ 3 alturas de héroe, suelo plano ≤ 2 niveles) + enmiendas 1–3 | Calibración ciega: ordena bien maquetas limpias (V2 > V1 > DAC) pero **ni 0202 ni 0137 la cumplen a ciegas** (A320–A321): circular y castiga el 2D-HD real |
| 4 | **Comparación ciega contra la toma real**, 3 subagentes, sin rúbrica (A325) | Vigente. Límites: jueces del mismo modelo, pocas salas, tandas ≤ 9–10 |
La nota de [U] no se pide como condición de falsación (error de [R], A282): corregido en la Enmienda 2.

### 2.5 Reglas de higiene (todas costaron un error)
1. **Criterios y predicciones antes de correr**, con hash. Los criterios que salen de las propias tomas (circularidad) no se usan como juez (A321).
2. **Un cambio por pase.** `terraces` 2 no es «una variable»: cambia máscara, camino y orientación (A303). Declarar siempre `vScale`, `exag`, `terH`, `tilesPerH` (A276).
3. **Capa neutra de comparación** (ANTES / DESPUÉS con el héroe emparejado a la toma); la calificación ANTES se **firma antes** de abrir las DESPUÉS (A286).
4. **PARADA** cuando el mecanismo no da algo (geometría que el visor no produce): se dice arriba del informe, no se anota «hueco» (regla 7).
5. **Contrastar con el ORIGINAL**, no con un PNG derivado (A061); abrir el original primero.
6. **Ninguna hipótesis de arreglo va a un pedido sin probarla en una copia** (v226 lección 2; A128, A150, A215).
7. **Declarar contaminación**: si [R] vio mapas, rótulos o tomas, no es juez ciego (A315); si CC recibe las tomas, la prueba ciega se contamina (A106).
8. **Verificación acotada** (regla 8): por PR carril rápido ≤ 10 min; `regress --sample 1/4` solo con código compartido; una pasada de cierre de 20–30 min corrida por [R].
9. **Separar VERIFICADO / NO VERIFICADO** y marcar el origen de cada idea ([U], [R], CC, [Ref], [Repo]).
10. **Registrar errores y retractaciones** (no borrar): evitó propagar cifras malas (M9 del análisis M6). «guardar» cada 20–30 intercambios y antes de cerrar un hito; un estado desfasado miente a la sesión siguiente.
11. **No reutilizar el mecanismo de otra toma como meta** (A6 de las alarmas): el objetivo es el mundo generable, no probar que el mecanismo alcanza.

### 2.6 Errores recurrentes de [R] (para no repetirlos)
| Patrón | Casos |
|---|---|
| Cifra o hipótesis dicha con seguridad sin comprobar en el repo o en una copia | A128, A150, A152, A169, A212, A215, A224; mi predicción C2/D2 de T42 (A307) |
| Métrica propia que [U] no usa | cobertura de masas (A172 → A178), «presente» y «coincide» inflados (A199, A209), M1 circular (A185), J1–J3 (A321) |
| Pedir la nota de [U] como compuerta | A282 |
| Proponer pasadas escena a escena sin criterio de salida | v296 §4 |
| Arrastrar una condición del Ancla sin preguntar si el juego la necesita («sin anotar», T28) | v296 |
| Pedido que dice *dónde* poner algo pero no *qué es* el truco, cómo se ve ni cómo se comprueba | G2 y G3 (A355) → ficha de truco obligatoria (A357) |
| Validar contra el derivado y no contra el original | A061 |
| Extrapolar de una condición a otra (muros de 3 H → 1,5 H) | A290 |
| Dejar sin guardar horas de marcas | A065 (texto perdido al compactar), A245, A347–A350 reconstruidos |

---

## 3. Vocabulario, modelo de escena y reglas del modo 3

Todo lo de esta sección es **dictado por [U]** salvo que se indique otra cosa. Es lo primero que una sesión nueva debe fijar, porque casi todos los malentendidos del proyecto vinieron de usar estas palabras con otro sentido (hotspot, plano, banda, rojo).

### 3.1 Modelo de escena: verde, azul y rojo ([U], 12 nov; A089, A090, A107–A112)
| Término | Definición | Notas |
|---|---|---|
| **Verde** | Suelo transitable y **continuo**, incluido el tránsito entre niveles. Las escaleras son **micro-terrazas** (subidas mínimas). | El cambio de altura real son escaleras de subidas mínimas (A090). |
| **Azul** | Fondo o zona **no transitable**; el héroe no puede entrar. | Murallas, parapetos y bordes de isla son azul sólido: lo que hay más allá «se ve pero no se alcanza» (A203, A217). |
| **Rojo** | **No es un área**: es un *overlay* decorativo y obstructivo, sin sustancia (vigas, pilares cercanos, barandas, parapetos, balcones). Se superpone **después** sobre un mapa ya resuelto; apagado, queda el mapa base completo. | Cada parche rojo tiene **al menos un pie en azul** (o está entero en azul): el héroe nunca lo atraviesa. Algunos son solo decorativos («fake height»: zonas no transitables presentadas como elevación). Puede tapar al héroe un momento (silueta u oclusión: diseño de niveles, T19). |

Condiciones del rojo: primer plano por profundidad (sin flag `always`); base con un pie en azul, **nunca solo en verde**; fuera de la distancia mínima del héroe en X y Z; con tope; **cuenta para el tope de billboards (≤ 30 %)**.

**Orden de trabajo** (12 nov): (1) topología plana —verde, azul, tránsito— que es ≈ 60 % de la solución; (2) leer la escena y definir el rojo; (3) deducir si detrás de cada parche rojo hay azul o verde (casi siempre es obvio); (4) anclar el área del rojo a esos bordes. El **3g falló** (A105) justamente por poner el rojo por reglas de borde, sin esa lectura ni la condición del pie en azul.

**Dónde se hace la lectura** ([U], 12 nov): en el piso de desarrollo (piso 2 de la Torre) se lee con las tomas del remake y de ahí salen las reglas; en el piso ciego (piso 3) las reglas definen el rojo **solo desde el mapa viejo** y las tomas se abren al final para comparar ([U], 12 nov: «eso es correcto»). [U] confirmó el piso 3 para la prueba ciega (A110); que la pieza «arriba a la derecha» del hack sea ese piso sigue por confirmar.

### 3.2 Las cuatro capas del encuadre (Bosque, M4c)
| Capa | Qué es |
|---|---|
| **P** (primer plano) | Masa cercana que corta el cuadro (roca, columna, estatua). Fuera de la distancia mínima del héroe. |
| **G** (guía) | Camino o eje que lleva el ojo. |
| **R** (ruta / meta) | El destino: puerta, trono, escalera. |
| **F** (fondo) | Lo que cierra la vista: torre, muro, copa, vecina. |
Las cuatro capas se pusieron «a mano como dato» en la toma dorada 1 del Bosque (A023): `wH`/`always` en objetos + cinta `ribbon`.

### 3.3 Bandas, plano, hotspot, eje, vistazo (`DEFINICIONES_T26_v311`; A191, A202, A206, A311–A313)
| Término | Definición operativa |
|---|---|
| **Banda B1–B5** | Franja de **profundidad en Z** (5 franjas de igual profundidad): B1 primer plano → B5 fondo (A311, [U]). Es medida, no estilo. |
| **Plano** | Banda + lo que tiene altura y **tapa** lo de atrás ([U] A175: «esa profundidad es lo que nos hace HD-2D y no 3D incompleto»). |
| **Eje de la sala** («rol» de [U]) | X, Z o Hub: dirección del flujo de la sala (A312). Distinto de la **función** de cada banda (primer plano, guía, meta, fondo, vistazo). |
| **Hotspot** | Zona **siempre transitable**, relativamente central salvo que haya POI (que lo contiene), y **sobre la línea de dirección del flujo** (A202, A206). El mal hotspot de [R] fue un error de esa lectura (A202). |
| **Vistazo / mirador** | El suelo de **otra sala** que se ve por encima del cierre del fondo, **deducido del mapa y la cámara** (no leído de la toma; decisión de [U], A313). Medida: **V(p)** = % del cuadro con terreno de otra sala (T35). |
| **Fondo abierto ≠ vistazo** | «Fondo abierto» = B4–B5 vacíos. En el remake el exterior de la sala suele ser un vistazo a otras salas por diferencia de altura (A296–A297). |
| **«Ver por encima»** | Sale de la **perspectiva** (muro más alto que los suelos), no de subir suelos ([U] A215; el «suelo elevado» de 0206/0214 era en realidad un HUECO de 78 y 177 tiles, medido por CC, A222). |

### 3.4 Cámara y escala: lo que está fijado
- **Cam 6**: perspectiva, FOV 30°, pitch 25° (las tomas del remake miden ≈ 23° ± 5° por escorzo del hexagrama, n = 2, A255). **Se queda**: es el Ancla; la propuesta de una cámara casi ortográfica (C6) la descartó [U] (A347).
- **Héroe**: `heroFrac` en las tomas 0,09–0,13 en el Bosque (A004); 0,072 en 0202 y 0,128 en 0137 (A274; no es constante, A349). En el trono de Aliahan ≈ 0,10 (A042).
- **`tilesPerH`**: 1,5 en DQ3 (A159, A047). Interior más picado que Cam 6: el trono está tomado a ≈ 35–40° y la sala roja a ≈ 50–60° (a ojo; T05); a 33° el vacío del estrado baja de 15,7 % a 12,1 % y **no se cierra** con el pitch (T11; el cierre sigue siendo geometría).
- **Alturas**: aparente ≈ dato^exag × vScale (A170, confirmada a la vista A174). La torre de Forest B medía 10,88 H contra ≈ 3,3 H de la fachada del remake (A013 lo escribe «≈ 2,4 veces», pero 10,88 / 3,3 ≈ 3,3×: la fuente no cuadra consigo misma y no se resolvió); B′ la baja a ≈ 3,5 H sobre su plataforma (A013, A017). Como el visor cuantiza con el rango global, bajar la torre de B exige 4 terrazas (A018).
- **Pasillos y escalas** ([U], A182, A194): paso mínimo de ≈ 5 integrantes del grupo (≈ 3,0 H con el sprite de la toma). La escalera del remake mide ≈ 4,5 H donde el mapa viejo tiene un paso de ≈ 1,4 H (≈ 3,2×; A141).

### 3.5 Las 11 reglas del modo 3 (auditoría del 10 nov; «dictada» = de [U])
| # | Regla | Origen |
|---|---|---|
| 1 | **Lo estructural se genera y lo decorativo es ranura**: muros, columnas, masas de primer plano y suelo son geometría (terreno o volúmenes); el billboard es solo para personajes, vegetación suelta y atrezo. | dictada, 10 nov 03:24; receta A010 |
| 2 | **Escena, no toma**: un ejemplo dorado es un mundo (mapa, reglas, datos) que sobrevive a mover al héroe; la toma es solo una cámara sobre él. | dictada, 10 nov 03:32 |
| 3 | El generador produce el escenario 3D desde el mapa; a mano solo se pone lo que una regla podrá producir (cubos, alturas, volúmenes, ranuras). | dictada (BRÚJULA «con cubos apilados basta», 9 nov 01:37) |
| 4 | **Prueba de caminata** antes de un veredicto de composición: mover al héroe 4–8 tiles en 4 direcciones sin vacío, terreno ajeno ni losas a media sala. | propuesta [R]; v191 aceptó un fotograma y la caminata (3 min) lo rechazó |
| 5 | Un ejemplo dorado dice de qué mapa sale y qué reglas tiene encendidas; con `orient`, `planes` y `props` apagados y `volumes: []` no cuenta como evidencia. | propuesta [R] |
| 6 | Las lecturas de un fotograma controlan **fallas**; no son el juez de parecido. | dictada, 9 nov (v180) |
| 7 | Si el caso pide una pieza que el mecanismo no da, **se para y se pregunta**; no se anota «hueco» y se sigue. | propuesta [R] |
| 8 | **Verificación acotada**: por PR ≤ 10 min; `regress --sample 1/4` solo con código compartido; una pasada de cierre de 20–30 min corrida por [R]. | dictada, 10 nov 02:10 y 02:18 |
| 9 | **Billboards ≤ 30 % de la pantalla**, medido como píxeles que cambian al quitarlos (panel completo). | dictada, 10 nov 03:49 |
| 10 | **El suelo es terreno 3D de bloques pintados por rol**; no hay pisos billboard. Las cintas son calcomanías que pintan los bloques y no cuentan como billboard; un billboard de suelo declarado sí cuenta. | dictada, 10 nov 04:04 |
| 11 | **Criterio de múltiples tomas**: un ejemplo dorado se levanta con varias tomas a lo largo de un recorrido; sirve para la **tabla de movimiento** (cuánto se desplaza y cambia de tamaño cada objeto por tile que avanza el héroe, qué lo tapa, cuándo entra el muro de fondo), de la que se deduce ángulo y colocación. | dictada, 10 nov 04:04 |

### 3.6 Degeneración D1 y alarmas (se revisan **antes** de aceptar o proponer una toma)
D1 = la «toma 2» del trono hecha con tarjetas (#84): 28 billboards y 11 cintas sobre un valle plano, con `orient`, `planes` y `props` apagados, `volumes: []` y sin mapa: **billboards 81 %**, terreno 3D visible 0,4 %. Se marcó sin borrar nada (cuarentena en #86).
| # | Alarma | Qué hacer |
|---|---|---|
| A1 | Billboards > 30 % | Medir con 4 renders antes de aceptar |
| A2 | Suelo, muros, pilares o primer plano hechos con billboards | Es geometría; si el mecanismo no la da, parar y preguntar |
| A3 | Flags del generador apagados para igualar una toma | Exigir razón escrita |
| A4 | Escena «sin mapa» | Buscar el mapa en el proyecto antes de decirlo |
| A5 | Veredicto por un solo fotograma o por parecido con la captura | Sin caminata ni tabla de movimiento no hay veredicto |
| A6 | Reutilizar el mecanismo de otra toma como meta, o escribir «NO lo implementes» | El objetivo es el mundo generable |
| A7 | Explicar el síntoma en vez de la decisión | Buscar la decisión con fecha que lo causó |
| A8 | Abandonar un enfoque que funcionaba sin razón registrada | Volver a él |
| A9 | Repetir lo que [U] ya advirtió dos veces | Dos advertencias son regla: buscarla antes de proponer |
**Pre-vuelo**: ¿billboards ≤ 30 %? ¿suelo, muros y pilares son geometría? ¿reglas del generador encendidas? ¿hay mapa de origen? ¿hay recorrido con varias tomas y tabla de movimiento? Si una respuesta es no, se para.

### 3.7 Palancas del visor (resumen; tabla completa en `INFORME_METODO_TRUCOS.md` (v318) §3)
| Palanca | Efecto | Cuidado |
|---|---|---|
| `heroFrac`, `heroScreen` [fx, fy], `heroAt` | zoom, dónde caen los pies, posición en el mapa | `heroScreen` es la palanca de **encuadre** de la baranda (A6) y del encuadre por posición (C7) |
| `tilesPerH` | relación héroe–mundo | 1,5 en DQ3 |
| `terraces`, `subs`, `terH` | cuantización de alturas | cambian máscara, camino, orientación y meta (A258, A303) |
| `vScale` | multiplica **todas** las alturas | un solo punto en `render.js:78` (A016) |
| `exag` | aparente ≈ dato^exag × vScale en muros, volúmenes y objetos | **no usar global**: sube el cierre y tapa el vistazo |
| `planes` (`HYP.wallH`, `HYP.colH`) | cierres y columnas | 3 H por defecto; los de 5 H suben J2 (A300) |
| `volumes` (S4b) | volúmenes **solo sobre tiles bloqueados** | no sirve para salas con el bloqueado a 3–12 tiles del camino (A285, A288) |
| cintas (`ribbon`) | calcomanías sobre bloques | no cuentan como billboard (regla 10) |
| `objects` | billboards (`wH`, `always`) | ≤ 30 % |
| `stageBorder` (quebrada/isla) | caras de caída | **solo visual**; baja el vacío 0,8–9,6 puntos sin llegar a 0 (A259, A289) |
| ventana de salas | margen que decide qué vecinas se dibujan | para el vistazo, incluir la vecina entera |
| Cam 5 | ortográfica cenital (80° + 9° = 89°) | instrumento de control con superposición del mapa, no cámara de juego |

---

## 4. Las pruebas, una por una

Orden cronológico: cada una corrige a la anterior. Para cada una: qué se probó, cómo, qué cifras salieron, qué quedó validado, qué quedó como hipótesis y qué se descartó. Los IDs entre paréntesis son las marcas del Registro (solo lectura).

---

### 4.1 Prueba 1 · El Bosque (Forest / «Shrine of the Plains») — rama R1.1, 7–10 nov (A001–A034)

**Qué se quería probar.** *Capacidad*: que una escena de referencia del remake se puede reproducir **en composición** con cubos apilados y datos puestos a mano (la «toma dorada»), antes de pedir reglas que la generen. No es generación (A008).

**Por qué Forest.** Aurhea (1 foto) era un juez pobre; Forest tiene ≈ 10 tomas útiles del remake y un mapa viejo (`old/forest.png`) emparejable (A002, [U] 9 nov 01:37). La equivalencia con el mapa del remake es **topológica**, no por tile: el remake rediseñó el interior; la toma emparejada se hace por *lugar-tipo* (acceso a la puerta, camino entre árboles) (A005).

**Material medido.**
- 7 capturas (15:57, 16:13, 16:21, 16:29, 17:01, 17:09, 17:17 del video 15:25–17:25), ubicadas por minimapa en 5 lugares (A004; son pantallazos de YouTube con la barra del reproductor en el ≈ 12 % de abajo).
- Héroe **0,09–0,13** del alto (mediana ≈ 0,11 → `heroFrac` 0,11; corrige 0,15 de v177); camino **≈ 1,2–1,7 H** (corrige 1,5–2 H). Estas lecturas son a ojo ±15 %.
- Las **cuatro capas** (P, G, R, F; §3.2) están en todas las tomas.

**Cómo se hizo (el «kit»).**
1. **Variante B** del terreno (legible); la A, casi plana, se descartó ([U] 9 nov 04:06; A009).
2. **Receta de alturas de [U]** (A010, hipótesis a probar en la toma dorada): bloques extruidos de los tiles a altura casi constante por nivel; pilares y paredes como objetos 3D calzados con el pitch y el ángulo; el nivel se ve más alto con una escala vertical (≈ 1:1,15) y una **exageración creciente sobre la altura del héroe**; ventanas y adornos siempre a la vista. Se calibra con **dos sliders** (`vScale`, `exag`), en neutro por defecto; «los números de [U] son ejemplos» (A011).
3. **B′**: la torre de Forest B medía **10,88 H** (dato congelado de la variante B) contra ≈ **3,3 H** de la fachada del remake (17.17, a ojo ±15 %; A013 dice «≈ 2,4 veces», pero 10,88 / 3,3 ≈ 3,3×: inconsistencia de la fuente sin resolver); B′ la baja a ≈ 3,5 H sobre su plataforma (A013, A017). El visor cuantiza con el rango global, así que bajar la torre exige **4 terrazas** (A018); con 4 terrazas la plataforma de la puerta sale en 4,00 H (el 2,88 H era un valor pre-suavizado contra la torre de 10,88 H, A019) y B′ deja el POI A a 2,0 H y la puerta a 6,0 H (+4 H sobre la meta) con tres saltos de 2 H seguidos sin rampa (A020: corrige la lectura de A019). Por eso el santuario de la toma dorada va a mano.
4. **PR #81 (M4a)**: herramienta de la **toma emparejada** (lecturas como control de fallas). **PR #82 (ALTURA)**: B′ + sliders neutros (21 hashes idénticos en neutro; `vScale` con punto único en `render.js:78`; `exag` función pura por sitio de dato) (A016, A021–A022). **PR #83 (CAPAS)**: las cuatro capas a mano como **dato** (`wH`/`always` en objetos + cinta `ribbon` en `src/frame.js`, todo neutro por defecto); puerta y fachada sobre la meta (2 H) con la torre del terreno detrás (A023–A026).
5. **Cierre de la toma 1** (control de fallas de [R] sobre la entrega de CC): el primer render dejó **14,6 % del cuadro vacío** (el mapa mide 52 tiles y el héroe estaba en x 49,5), la roca P fuera de sitio (fx 0,62–0,70 contra 0,81–0,91 del remake), ruta 1,57 H (remake 2,4). Pedido de cierre: `heroScreen`, piezas `always` fuera de la ventana, estilo de placeholder y **`voidShare`** como lectura nueva. Resultado verificado: `voidShare` ≈ 0 (0,12 % = el trazo de las elipses), **P fx 0,809–0,907, ruta 2,48 / 1,47 H, héroe 0,121 contra 0,12**, el ejemplo abre ya encuadrado (A024–A025).

**Resultado.** **Toma 1 (17.17, acceso a la puerta) aceptada por [U]** (9 nov 23:52: «los detalles no importan a este nivel, la composición resulta») (A028). Reservas de [R] (A027): seto de elipses abajo a la derecha (cubre casi un cuarto del cuadro), tres escalones de B′ delante de la puerta, columnas casi negras a la izquierda, cuatro óvalos verdes sobre el camino que no existen en el remake, y el remake muestra cuatro personajes (T04).

| Lo que **sí** quedó probado | Lo que **no** |
|---|---|
| Con cubos, alturas por sliders, capas a mano y cintas, **la composición de una escena exterior se reproduce** (capas P/G/R/F en su sitio, héroe a escala, cierre sin vacío) | Que una **regla** la genere (todo es dato a mano) |
| El terreno 3D **sostiene** la escena: la toma 1 aguanta la caminata (A034) | Que sirva para interiores: el bosque tiene poco contraste primer plano / fondo (A028) |
| Alturas calibrables con dos palancas globales (`vScale`, `exag`) | Que dos palancas globales basten (A162: no hay un `exag` global que sirva a todas las salas) |
| `vScale` y `exag` tienen un único punto de aplicación (A016) | **Billboards 65 %** > 30 %: la toma 1 **excede** el tope (regla 9). Deuda reconocida: modelar el pasillo derecho como terreno en vez de tapar con billboards el 16,1 % de vacío |

**Hallazgos laterales útiles (Aurhea y Forest).** El lago de la foto de Aurhea mide 12,0 ± 0,5 H contra 11,0 H del visor: **K no es una escala uniforme** (A012); 40° es el picado mínimo para M8b; M1 por plataformas falla en Aurhea **por datos** (península de 2 tiles; a ×2 se la come el pre-suavizado). El mapa viejo de Aurhea es una rejilla de 24 × 22 tiles de 16 px; la rejilla se **aprende por repetición de bloques** (semilla de M6). Ni `path.png` ni el mapa viejo dibujan el camino a la puerta de Forest (8,2 H): la cinta sale de `props.path` (A014). El muro de `planes` mide 70 tiles (≈ 32 de ancho) a 5,88 H (A015).

**Errores de [R] a no repetir (Bosque):** A006 («100 % como el remake» como criterio), A007 («lo caro es la composición, no la cámara»), la lectura de A019 sobre las alturas de B′ (corregida por A020), y lecturas «a ojo» presentadas como medida. [U] los corrigió: el «100 %» es la prueba de **capacidad**, no un criterio de terminado (A006 → A008).

---

### 4.2 Prueba 2 · La sala del trono (Aliahan, DQ3) — rama R1.2, 10–11 nov (A029–A068)

**Qué se probó.** Que la composición de un **interior** (≈ 80 % de DQ) se reproduce con **mundo** (mapa de origen + reglas encendidas + volúmenes), no con tarjetas. La prueba nació como «toma 2» y se rehizo entera.

**Dos intentos.**

| | Intento 1 (#84, «toma 2») | Intento 2 (#86–#90) |
|---|---|---|
| Enfoque | Valle plano de Forest B′ + 28 billboards y 11 cintas; `orient`, `planes`, `props` en `false`; `volumes: []`; fuente «Flat»; sin mapa | **MAPA 1** (mapa a mano, simétrico, desde el original SFC) + reglas encendidas + volúmenes S4b + cintas + billboards solo para personas y atrezo |
| Medidas | Billboards **81,4 %**, terreno 3D visible 0,4 %, hecho para igualar **un fotograma** | Billboards **≤ 8,84 %**, fondo vacío **15,7 % → ≤ 0,05 %** en 16 posiciones, caminata de 45 fotogramas sin giros ni saltos (de y = 23 a y = 5), simetría **56 → 0** baldosas asimétricas |
| Veredicto | **RECHAZADO** por [U] (10 nov 03:24, v195: «esto no es aceptable, lo que hiciste aquí es "vestir" el 3D con varios billboards… no prueba nada» y «camino erróneo»; mi síntesis: billboards vistiendo un mundo sin sala, al mover al personaje todo se rompe) y por la caminata de [R]; mi «la toma 2 pasa» de v191 se retiró (A034) | **A-OK parcial de [U]** (11 nov 04:3x): «cerramos la sala del trono» (A068); #87, #89, #90 en `main` (`e882c5c`) |

**Por qué el intento 1 fracasó (diagnóstico, A035–A037).** (1) La prueba cambió de objeto: pasó a medir si un fotograma coincidía con la captura, algo que se logra pintando. (2) Reutilizar el mecanismo de la toma 1 se volvió el fin («NO lo implementes» lo que no cupiera). (3) Se apagó el generador para igualar una foto. (4) Se juzgó un fotograma (v191) y la caminata de 3 min lo rechazó. (5) Las herramientas ocuparon el lugar de M6. (6) El documento no frenó la deriva. El trono ya estaba resuelto en v88 (31 oct) como MAPA 0 a mano desde la captura SFC (18 × 12 tiles, pilares en volumen 3D, tarimas, muro de 3,4 H); #84 lo ignoró.

**Cómo se construyó el intento 2 (secuencia).**
| Paso | Qué | Cifras / decisiones |
|---|---|---|
| Plan como mundo (A040) | MAPA 0 + tarimas como terreno + muros y pilares como volúmenes S4b + suelo y alfombra pintados + billboards solo personas y atrezo | Límite del repo: S4b deja fuera «las columnas de primer plano que cortan el cuadro» (capa P) y exige ≥ 2 tiles de margen a un escalón |
| Clips de movimiento (regla 11; A037, A042) | **Aliahan (DQ3, 0–23 s)**: héroe casi centrado (x ≈ 0,50, y ≈ 0,47–0,59, alto ≈ 0,10); águila fuera del cuadro que asoma por arriba al bajar el trono de y ≈ 0,13 a ≈ 0,33; **paralaje cercano / lejano ≈ 2,2**; estrado de 2 tramos; capiteles cortados por el borde. **Clip de DQ2 (1:30–1:38, ejemplo de [U])**: paralaje por profundidad, sala axial en capas, el muro del fondo entra solo al acercarse | Aliahan: `ANALISIS_movimiento_trono_dq3_aliahan`; DQ2: `ANALISIS_movimiento_trono_dq2` (no releído para este informe). Falta una subida continua al estrado en el clip (la cubre la caminata de #90) |
| Paso 0 / 0b (A043–A046) | El «rip» `castle_scenario` **no** es la sala del par; el emblema sale cortado por el borde; con los pilares del par (a ≈ 2,1–2,2 tiles del muro) la nave ancha pierde 17–64 tiles caminables (peor 100 %) y la franja 0 | El desajuste de escala es de `tilesPerH` (≈ 1,44 contra 2; control 1,5), no de `heroFrac`; `pre` = promedio 3 × 3 del relieve: un muro de 4 H pegado al suelo se vuelve una rampa de 2 tiles |
| Decisiones de [U] (A047; D-e, D-f, D-g, D-i, D-k, D-l) | Nave ancha caminable; mapa a mano (MAPA 1); emblema como fondo sin `z`; una línea de `pre`; ejemplo con **`tilesPerH` 1,5, `subs` 8, `terraces` 2, `pre` 0**; banda norte a 1,05 H | La franja se retiró como recomendación: el remake y el clip permiten caminar por el suelo lateral; solo existía para pasar nuestro criterio del 25 % (A046) |
| **Commit 1 · mundo (#87)** | MAPA 1 + zonas `[ENT, NAVE]` + `orient` / `planes` / `props` encendidos; volúmenes y billboards vacíos; caminata con subida al estrado | La zona de entrada salía `Hub` yaw 180 (la cámara miraba el muro); fundirla en NAVE (solo datos) dio yaw 0 en todo (A049; lo reprodujo [R] en A050, que da los 624 tiles caminables) |
| **Commit 2 · cierre del fondo (#89)** | 6 pilares como volúmenes (5 H) + 3 muros de 8 H; `volumesOn: true`; excepción única de [U] sobre `planes.js` (omitir columnas cuya **sombra cae sobre `path`**) | Fondo vacío **15,7–19,3 % → ≤ 0,05 %** en 16 posiciones; alfombra con 0 baldosas > 25 % perdido en 8 posiciones (peor 24,6 %); 13 de 15 mutantes de `planes.js` mueren (A054, A057) |
| **Commit 3 · vestido (#90)** | Datos del ejemplo: cintas de alfombra + ribete + 2 medallones sobre la máscara `path`; rey, canciller, 2 armaduras, 2 macetas, 4 estandartes; emblema como una tarjeta; prueba de corredor libre | Billboards **≤ 8,84 %**; corredor vacío; 304/304 tiles `path` con cinta; 10 de 12 mutantes de datos mueren (A059) |
| **Delta 2 (`14615c2`)** | Sala recortada a 17 × 12 tiles viejos, simétrica; línea de visión en el eje ≤ 25–35 % | 56 → 0 asimétricas; 0 tiles > 25 % en el eje; a pasos de 0,5 el peor tile sube a **29 %** (contrahuellas del estrado), por eso el umbral subió a 35 % (A063–A064) |

**Lecciones técnicas del trono (todas con medida):**
1. **El cierre del fondo es geometría, no cámara**: subir el pitch a 33–37° baja el vacío del estrado de 15,7 % a 12,1–10,1 % y no lo cierra (T11); los **muros de cierre llevan 8 H y los pilares 5 H**; el muro de `planes` de 4,05 H dejaba 15,4 % vacío (A284: «el repo ya decía que bajar los muros expone el vacío»).
2. **Criterio de oclusión solo sobre el camino**: ninguna baldosa de alfombra con > 25 % perdido a causa de un volumen o columna (pilares: criterio relajado y declarado). Luminati: advertencia de camino oculto ≤ 3 % y los objetivos cuentan cero (A053).
3. **Validar contra el original, no contra el PNG derivado** (A061): la puerta del original estaba centrada (centro 320,0 px frente a 320,5 de la alfombra); MAPA 1 la había descentrado 1 tile por escribirse a resolución de tile viejo. Prueba de **simetría especular** con mutaciones.
4. **No proponer arreglos sin probarlos en una copia** (A062: mi parapeto como volúmenes bajos *empeoraba* la oclusión, se retiró; A064: el arreglo `d: 22` rompía la S4b de los muros, descartado).
5. **El «low poly» no es un fallo de composición** ([U] 11 nov 02:31: se ve bien pero parece low poly): el visor no tiene texturas de pixel art, sprites ni efectos; el Norte dice «composición, no aspecto» (T15 sin decidir).
6. **Sombra como calcomanía y estructura 3D** ([U] 11 nov 14:15): pilares = estructura; el billboard es para lo que no se camina.

**Resultado y límites.** A-OK **parcial**: el trono queda aceptado como composición de un interior con geometría de volúmenes y alturas (A068). Fuera del A-OK (pulido): estrado estrecho con borde de piedra, 3 + 2 peldaños, lámparas en el borde de la alfombra, estandartes con `z`, prisma blanco al final de los muros laterales, vacío en x = 5 / 29. **Es una sola sala, con mapa hecho a mano**: la generación sobre un mapa viejo sin anotar no se probó (M6).

**La PLANTILLA de escena dorada** (`PLANTILLA_escena_dorada_modo3.md`, v1 aprobada por [U] 11 nov): nació de la reflexión v226 para «no partir a ciegas». Contiene: *ficha de arranque* (12 campos), *secuencia* (Paso 0 de solo lectura → 0b → Commit 1 mundo → Commit 2 cierre → Commit 3 vestido → deltas → pasada de cierre → A-OK), *herramientas de verticalidad con su coste de oclusión*, umbrales, alarmas A1–A14, esqueleto de pedido a CC (alcance, PARADAS, qué NO se prueba), decisiones D-a…D-l y callejones sin salida. Abrirla antes de hacer cualquier sala nueva. La reflexión v226 resume: el salto vino de **cambiar el objeto** (tarjetas → mundo), no de pulir un fotograma; «por qué ayuda la altura» sigue siendo **hipótesis** (A070).

---

### 4.3 Prueba 3 · Torre del Soñador (Dreamer's Tower / «Najimi Tower») — rama R1.3, 11–15 nov (A069–A234, v225–v300)

**Nombres.** *Torre del Soñador* = Dreamer's Tower, el dungeon del remake HD-2D. *Najimi Tower* = su versión de 16 bits; la hoja con todos los pisos es el hack «Dragon Quest 3 Remix» (no el SFC; 16 px por tile; piezas de 29 × 34 a 70 × 54 tiles; el segundo piso 43 × 58) (nota v235). Las «8 salas» de desarrollo son las del **piso 2** del hack, que el mapa completo del remake rotula **«4F»** (equivalencia según v236 y v270, verificada por forma, no tile a tile): tomas 0143, 0156, 0137, 0202, 0204, 0206, 0214, 0149, sobre las habitaciones A, B, C, F, H, I, J (mapa completo del remake, 601 × 612 px; 7 habitaciones, 8 renders).

**Qué se quería probar.** M6: el **relieve automático desde un mapa viejo sin anotar** (rasgos 7 y 8 del Norte: ribete → tarima con escalera; agua alrededor del POI → pocket). Es la mitad del Norte que quedó como «deuda reconocida» (v165; [U] 8 nov 04:18: «lo antes posible»). El piso 2 = **piso de desarrollo**; el **piso 3 = piso ciego** (pieza «arriba a la derecha» del hack, remake 2:16–2:59; nunca se corrió).

Análisis completo en `ANALISIS_pases_M6_metodologia.md` (23 prompts `stage_m6_*_go.md`, 22 ejecutados). Resumen en 7 fases:

| Fase | Pasos | Qué se hizo | Resultado clave |
|---|---|---|---|
| **A** (antecedente) | Trono (§4.2) | Cambiar el objeto de la prueba | billboards 81,4 → ≤ 8,84 %; vacío 15,7 → ≤ 0,05 % |
| **B** | Paso 0 → 2 (11 nov) | ¿Se puede deducir el relieve de un mapa viejo? (solo lectura, PARADAS; trono reconstruido desde el original; primer mapa ciego en Najimi piso 2) | **Ninguna regla de `src/` crea niveles desde el trazado** (A073). La *ablación* (trono plano) conserva muros, pilares y verticalidad: casi todo el efecto viene de las **clases** y de las reglas de verticalidad, no de la altura caminable (A074; no reproducida por [R]). Del original solo salen huella, alfombra, entrada, estrado, POI y pilares (±5,54 ≈ ±5,5). El escalón del POI causaba el peor tile (42,6 % → 20,0 %; A083). «Vacío 0 %» medía hueco, no fondo: el remake pinta un fondo de color (A084–A085) |
| **C** | Paso 3a–3g (11–12 nov) | Reglas ciegas sobre Najimi piso 2 | 3a: ninguna escena se reconoce, 5 de 8 miran al revés (`orient.js` cae al signo canónico en sala plana); 3e: «la sombra es suelo» da una ruta plaza→meta de 105 tiles; 3f: rojo como overlay puro, 4–10 % contra 22–35 % del remake; **3g rechazado por [U]**; protocolo ciego **CONTAMINADO** (A105–A106): CC midió parámetros en las tomas |
| **D** | v257–v266 (12 nov) | «Detente y reflexiona»: [U] fija el modelo verde / azul / rojo; diagnóstico: sin par «render ↔ toma» desde las 10:16, lo «derivado» eran candidatas leídas del remake (**ajustar a la respuesta**, A122). Regla nueva: **cada paso termina en un par render \| toma, o no es prueba** (A123) | 4a: «el mejor batch» de [U], ≈ 50 % equivocado y ≈ 25 % muy equivocado (A132). 4b en pausa. Se pasa a **dar el terreno desde el remake** como diagnóstico de **capacidad** (no del Ancla) |
| **E** | 4c → 4e-2 (12–14 nov) | Terreno del remake a mano en 7 salas; cámara; alturas | 4c: aparecen escaleras y pilares; fallo común = el **encuadre** («mug shot»); 4d-2: héroe a −1,2…+0,9 puntos de la toma en 8/8, cámara ≈ **+1** en todas; 4e: regresiones (0206, 0214, 0204); 4e-2: `screenPan` validado (proyección inversa), alturas por fórmula |
| **F** | 4f → 4h (14–15 nov) | Planta y bandas; Cam 5 real (89°); hotspot por escena; auditoría de bordes; cambio de método: la percepción del mapa pasa a [R] | **6,1 → 8,1** en las mismas 7 escenas (4f → 4g); 4h: F, 0156 y 0149/0204 estables, Δ ≤ 1,5 tiles en 24/24 y 18/18 (circular); el 4g tenía un **hueco** (78 y 177 tiles), no un suelo elevado |
| **G** | 5a y corte (15 nov) | Diff de reglas **solo mide** | Huella F@5 0,78 / 0,98, F@9 0,60 / 0,86, I 0,77 / 0,83 (recall / precisión); **parapetos 0 de 4, escaleras 0 de 3, niveles 0 de 2, plinto 0 de 4**; pilares sí (I 5 de 8 + 3 parciales). Najimi piso 2 **no es juez fiel** (B IoU 0,45; C anisotropía 3,92). [U] corta el pulido; principio **A232** |

**Curva de notas de [U]** (una persona, a ojo, sin ciego; medias calculadas por [R]):

| Conjunto | 4c | 4f | 4g | 4h |
|---|---|---|---|---|
| 7 escenas (con 0143) | 38 ÷ 7 = **5,43** | 42,5 ÷ 7 = **6,07** | 57 ÷ 7 = **8,14** | 8,36–8,43 (0143 = 2) |
| 6 escenas (sin 0143 ni 0202) | **6,00** | **6,75** | **9,17** | **9,42–9,50** |
Por escena (4h): 0137 = 10, 0202 = 10, 0149 = 10, 0204 = 10, 0156 = 9,5, 0206 ≈ 8,5, 0214 8,5–9, 0143 = ignorada (PARADA). **5 de 8 escenas ≥ 9,5.**

**Qué mejoró de verdad (tres niveles; ANALISIS §6.1).** *Dato*: 8 salas con terreno a mano. *Herramienta*: cámara 6 calibrada por escena (héroe a ±1 punto), `screenPan` validado, Cam 5 cenital con superposición del mapa, definición operativa de hotspot y bandas, lectura de alturas por fórmula. *Conocimiento*: lista de hechos de composición (§5) y el **hallazgo negativo firme**.

**El hallazgo estructural (A229).** El mapa viejo **no trae en píxeles** las pistas del relieve: los dos niveles comparten clase de color (0,93–0,97), plinto y estatua son clase suelo (0,12–0,14), escaleras laterales 0,16–0,67, parapetos 0,08–0,50 (fracciones tal como las dio la nota 5a; no las reinterpreto). Los rasgos que el remake muestra y el plano no (escaleras de ≈ 4,5 H donde el mapa viejo tiene ≈ 1,4 H, ≈ 3,2×, A141) **los pone un artista** (lectura mía). Además, en el repo el pack del generador de EvoDun **ya trae** `elevation`, zonas, bordes barrera / paso, camino, POI y agua, y el visor deriva de eso niveles, escaleras en las puertas, orientación y planos (lectura del repo en e882c5c, **no corrida**; A233). Es decir: «mapa viejo **sin anotar** → relieve» es el problema más difícil y quizá el que EvoDun **no necesita** (T28; Ancla v2 solo con aprobación de [U]).

**Diez mecanismos que sí funcionaron (M1–M10 del análisis, sin repetir cada uno):**
1. Cambiar el objeto de la prueba cuando el síntoma persiste. 2. Pasos pequeños, **solo datos**, con hash de render antes y después y 2 corridas iguales. 3. Paso 0 de solo lectura con **PARADAS** (encontró dos contradicciones antes de escribir nada; detuvo el 4h en 0143 y el 5a en «faltan 3 productores»). 4. Una variable congelada por pase (cámara primero, datos después). 5. **Medir la causa en lugar de opinar** (cayeron 4 hipótesis mías: «sesgo de calibración», «la ventana cabe», «suelo elevado», «M4 no viable»; y salió la fórmula altura aparente ≈ dato^exag × vScale). 6. Cambiar el criterio de juicio hacia lo que [U] realmente ve (planos, bandas con hotspot, bordes correctos de isla). 7. Un **segundo instrumento independiente** (Cam 5 + superposición del mapa: la opinión se vuelve Δ en tiles; reveló que el dato de F tenía 27 × 40 tiles frente a ≈ 41 × 46,5 del mapa). 8. Repartir por fortaleza (percepción de [R], CC solo codifica y verifica). 9. Registrar cada error y retractación (10 de [R] y 3 de CC). 10. **Medir la brecha sin cambiar nada** antes de escribir reglas (el 5a dio el hallazgo más informativo de la serie en un solo pase).

**Siete fracasos (X1–X7):** reglas ciegas contaminadas; pulir datos a mano **como si fuera** la prueba del Ancla (+2,1 en 4g y +0,25–0,33 en 4h, y ninguna corrección quedó como regla); mis métricas propias; CC percibiendo el mapa («CC no es capaz de obtener información correcta y expresarla», [U]); depender de las lecturas de [U] en cada vuelta; juez no fiel; hipótesis mías dichas con seguridad.

**Atribución (lectura mía, no medida).** Las correcciones conceptuales que constan son de [U]: verde / azul (A089, A107), planos (A175, A191), hotspot (A202, A206), bordes de isla (A203, A217), segunda cámara (A192), «el muro debe ser más alto que los suelos» (A215). El cambio «la percepción pasa a [R]» es decisión de [R] (A216). Las correcciones de método y medida fueron de [R] y CC. **[U] aporta el criterio, [R] y CC la medición, y el prompt carga el estado.** Parte importante de la «mejora de CC» es mejora del prompt (CRITERIOS antes de correr, «PARA Y DILO SI», límites, entrega ≤ 1,5 páginas, «qué NO se probó»).

**Lo que de esta prueba NO se puede afirmar:** que cada instrumento causara su salto de nota (varios cambios por pase y una sola persona puntuando); que las notas del 4c (algunas son «habitación») sean comparables con las de 4f–4h; qué parte del 4h explica la bajada de 0206 y 0214; si CC conserva contexto entre pases; que `stage_readings.js` corra hoy y sus umbrales sirvan en otros packs.

**Riesgo no resuelto (T29):** los `data.json` a mano de las 8 salas, los scripts del pipeline (`/tmp/m6n`, `wtC`) y los hashes **viven solo en el entorno de CC** (ni en el repo ni en el Proyecto); el 5a ya perdió 3 productores. Mientras no se exporten (zip sin material del remake), **esta prueba no es reproducible desde cero**: sí lo son el método y sus resultados.

**Mirador (dato de [U], A296; hipótesis).** En la Torre del Soñador del remake las salas **comparten plano y se ven entre sí** porque las diferencias de altura las vuelven miradores; en el original y en el Remix de 16 bits el borde de la sala era negro. En 3D puro el vistazo no sale solo (el 3D permite pensar «podría saltar allí»; DQ3 no tiene ese trasfondo): DQ3 quiere un mundo 3D con el «romanticismo» del 2D, y eso implica **trucos isométricos nunca aclarados**, de los que el mirador es uno. Fue el origen de R1.5 (§4.6).

---

### 4.4 Prueba 4 · DAC (salas generadas sin assets) — ramas R2 / R1.3, 15–16 nov (A236–A308)

**Pregunta (R2).** ¿Corren las mismas reglas sobre **mapas generados** por el generador de EvoDun (`dac_stage`, salas 84 «Ascension» y 65 «Cake», más 1, 3, 9 en R15)? Es la segunda fuente de la regla 7 de la BRÚJULA y el camino hacia la «Generación» del Ancla.

**Instrumento: el arnés (A236).** El visor de trabajo es **byte-idéntico al repo**; los *packs* se inyectan en tiempo de ejecución **sin tocar `src/`**; reproduce el trono integrado con hash idéntico y da hashes iguales ×2 en V1, V1b, V2 y DAC 84. La receta se puede correr sobre cualquier pack.

**Pase v301 (dos salas con la receta; A236–A248).**
| Sala | Qué se hizo | Medida | Nota de [U] (12:42, a ojo) |
|---|---|---|---|
| DQ3 «desierto» (mapa viejo + toma) | **V1** = solo mapa viejo con reglas por defecto; **V2** = informada por la toma | Cámara, escala y ruta coinciden **por calibración** (M5a 0,0976 contra 0,097; M5b 4,00 contra 3,95 H); aspecto: V1 1,0 de 5 elementos E1–E5, V2 3,0 de 5 (circular en alturas; el mínimo exigido era 4: FALLA) | **V1 ≈ 7/10; V2 ≈ 9,5/10** («composición correcta», único error: la inclinación del camino) |
| DAC 84 (sin toma) | Reglas por defecto | PASAN M5a, M3a, meta en cuadro, 3 de 4 bandas, hashes ×2, D1, caminata; FALLAN S2-D (0,863 frente a 0,90) y S2-E (0,934 frente a 0,95; 0,991 sin billboards); la causa de S2-D está en el **dato de la sala** (124 pares contra tiles de la propia sala), no en una regla (A241) | **1/10** como HD-2D: «buen mundo cúbico 3D», pero «escalones muy grandes» y sin **horizonte local** (A247) |

**Lección central (A246–A248).** *La medida de [R] y la nota de [U] no coinciden*: el criterio medido daba FALLA a V2 (que [U] puntuó ≈ 9,5) y «PASA 4 de 6» a DAC 84 (que [U] puntuó 1/10). «Cuanto más cerca de algo consistente, más obvios son los errores» ([U]). Los criterios S2-A–F no medían altura de escalón, horizonte local ni fracción de vista hacia adelante. En 2D-HD, **horizonte, bandas y profundidad son la norma: 25–40 % de la vista se dedica a ver más adelante**; casi ninguna escalera de DQ3 era alta; la escalera final de V2 era «bastante correcta» (A247).

**Hallazgo de lecturas (A242).** `walkableAt` de `stage_readings.js` ignora `region` y `nowalk`: 429 contra 283 tiles en DAC 84; M5b da 10,95 H (suelto) frente a 8,50 H (estricto). **Medir con la misma definición de transitable que `orient` / `planes` / `props`.**

**Instrumento v302 (A249–A260).** Con controles reales del visor y sin tocar `src/`, DAC 84 pasó de R1 1,12 → **0,49 H** (Measures in H OFF + `terH` 2,2 tiles), de FAR fuera de pantalla a 0,21 del alto (`heroFrac` 0,10) y a Z1 0,47 (pitch +9°): cumple H1–H4 y H6–H9 y falla solo H5 (suelo continuo ≥ 25 % del alto: lo cortan las contrahuellas de la escalera, A252). Caminata de 9 posiciones: M5a 0,099–0,126, meta en cuadro 9/9, M3a cerrado 9/9, hashes ×2 (A253). La sala 84 mide 10,0 × 8,4 H a `tilesPerH` 2,5: menos que un cuadro (A257). **«Más distancia» y «fondo cerrado» chocan** en esa ventana: lo resuelven `tilesPerH` 2 o un margen de ventana de 48 (A251). Descartado: el clasificador DARK no distingue DQ3 de DAC (A261 → A266); HZ_glimpse no discrimina (A271); `stageBorder` quebrada / isla es solo visual (A259).

**Paso a paso hacia T42 (A268–A298).**
- **A268:** la altura del muro **no discrimina**: V2 (9,5/10) tiene W p95 3,0 H y pilares de 3,85 H; DAC FIN da 3,18 H (84) y 3,45 H (65).
- **A269 / A273:** lo que 0202 y V2 comparten y DAC no tiene es **composición**: eje camino → destino legible (J1), volúmenes de encuadre a ambos lados (J2), suelo plano con relieve concentrado (J3). Pero A273 corrigió el juicio: se había hecho sobre una variante equivocada (F1 en vez de FIN) y con el héroe sin emparejar.
- **A274:** `heroScreen` [fx, fy] funciona en `dac_stage` 84 y 65 (pies en 0,510/0,520 y 0,610/0,760); altura del héroe en pantalla 0,0955 (colocación 0202; toma ≈ 0,072) y 0,128 (colocación 0137; toma ≈ 0,128).
- **A275–A281 (paso 1a):** `HYP.wallH` y `HYP.colH` = 3 H sin control en el panel; bajarlas a la mitad baja W p95 en −1,5 H (84: 3,181 → 1,681; 65: 3,452 → 1,952); **J2 baja** de parcial a ausente; muros a la mitad «dejan ver terreno sin terminar» y la sala se lee como diorama flotante (A280). El cenital muestra que el camino cruza una mancha ancha de suelo sin eje legible: el hueco con 0202 y V2 (J1, J2) **no depende de la altura de los muros** (A281).
- **A282:** error de [R]: pedir la nota de [U] como condición de falsación contradice su regla A232 → Enmienda 2 (el juicio es solo rúbrica y medidas de CC).
- **A284–A291 (pasos 1b, 1c):** 1b **PARÓ** por la regla: `volumes` (S4b) solo levanta sobre tiles ya bloqueados y en DAC el bloqueado más cercano al camino está a 3–12 tiles casi siempre de un solo lado (A285–A288); 1c: `stageBorder` quebrada baja el vacío (84 −4,7 a −9,6; 65 −0,8 a −4,4 puntos) sin llegar a 0 (8,1–18,4 %) y sin ganancia real; isla no cambia nada.
- **A292–A295 (Enmienda 3 / revisión):** J2 solo cuenta masa que se eleva sobre el suelo transitable del héroe; **J1–J3 de [R] sustituyeron sin ratificar los criterios de [U] de las 12:42**; tres pases DAC (1a, 1b, 1c) sin ganancia real quedaron «descartados» con motivo.

**T42 · cierre de DAC (A299–A308).** Seis estados por sala (BASE, A muros 5 H, B cinta, C1 `terraces` 2, C2 `subs` 1, D combinado), predicciones y regla congeladas con sha256 `154ce5fc…`. Calificaciones J1–J3 **firmadas antes de abrir** los renders (cuenta final sobre calificaciones firmadas, sha256 `bf1a4029…befa`). Resultados:
| Palanca | Efecto medido | Estado |
|---|---|---|
| **Muros y columnas de `planes` a 5 H** | **J2** sube de parcial 5/9 a presente 8–9/9 en las dos salas; vacío medio 13,8 → 4,6 % (84) y 9,4 → 5,3 % (65); oclusión del camino ≤ 11,6 % | VALIDADO (A300) |
| **Cinta (`ribbon`) sobre el camino** | **J1** sube a presente (84: 3/9 → 8–9/9; 65: 5/9 → 8–9/9); ninguna regla del visor lo movió (C1 parcial 4/9 y 5/9) | VALIDADO con la reserva de que la cinta es una **capa declarada** (A301) |
| **`subs` 1** | J3 de la sala 65 ausente → presente en el umbral (6/9); no en la 84 (3/9); baja niveles transitables (8 → 7) y sube el escalón máximo (0,45 → 0,63 H) | VALIDADO como recuento (mecanismo solo por esos recuentos; A302). La predicción de [R] C2 quedó **falsada** |
| **`terraces` 2** | **No es un cambio de una variable**: cambia máscara y camino (65) y orientación y meta (84: yaw 270 → 180) | VALIDADO (A303) |
| **Combinación** | C1 y C2 se estorban en 65 (C2 da J3, D lo pierde: parcial 3/9 porque C1 devuelve ≥ 3 niveles); no hay combinación probada que dé 6 de 6 | HIPÓTESIS (A305) |

**Veredicto de T42:** PARCIAL (D = 5 de 6 celdas presentes; sin la cinta la cuenta inferida es 3 de 6, negativo; A304). Autocalibración de [R]: 9 de 11 cláusulas cumplidas; fallaron C2 y D2, ambas por subestimar `subs` 1 en J3 de la sala 65 (A307). **Salas 84 y 65 retiradas de la prueba ciega** (se diseñaron mirándolas) y DAC cerrado en parcial (A308). Conclusión de [R] (A306, hipótesis): lo que falta se parece a **planos y trucos de encuadre** (T26), no a más perillas del visor. Cuentas del S5 (A298): 44 marcas (33 validadas, 6 hipótesis, 5 descartadas); se ganó la capa de cámara / escala / encuadre (8 de 9 criterios y caminata 9/9) y tres familias de palancas se descartaron con cota; no se movió J1 ni J3 y las salas quedaron «quemadas». «No fue un desperdicio, pero tampoco avance de composición.»

**Aprendizajes de DAC que valen para cualquier sala generada**
1. `terraces` y `subs` cambian la generación (meta +1 tile con `subs` 2; 283 → 339 tiles con `terraces` 3; 329 con `terraces` 2) y suben el peldaño (R1 hasta 0,87 H): compensar con `terH` (A258).
2. `terraces` 3 aplana la sala (65: 55 → 22 niveles; 84: A_g 10,6 → 8,4 H); `subs` 2 con `terraces` 5 conserva riqueza pero rompe «3 terrazas máx» (A263).
3. Declarar siempre `vScale` y `exag` (estuvieron en 1,0 sin declarar en toda la matriz v304; `exag` actúa justo sobre los muros que baja la prueba; A276).
4. Con las vistas actuales **no se puede juzgar HD-2D de forma fiable** (A294): no hay toma de otro juego, no queda una sala sin usar, el juez no estaba validado y el Ancla v1 sigue sin aprobar.

---

### 4.5 Prueba 5 · Calibración del juez (v305–v311, 15–16 nov; A313–A325)

**Pregunta.** ¿Puede la rúbrica J1–J3 (de [R]) distinguir una maqueta 2D-HD buena de una mala **a ciegas**?
- **Rúbrica v305**: J1 = eje camino → destino **legible**; J2 = **masas verticales a ambos lados** (≥ 3 alturas de héroe); J3 = suelo plano con relieve concentrado (≤ 2 niveles). Tres enmiendas (la 3 sobre qué masa cuenta).
- **Calibración ciega** (`RESULTADO_calib_v311`): 2 jueces sin contexto sobre 5 cuadros 1280×720 sin rótulos (V2, V1, DAC 84, 0202, 0137; V1 y V2 desde webp con pérdida): el **orden coincide** con [U] (V2 3/3 ≥ V1 3 o 2 > DAC 84 1/3; acuerdo 14/15) y por la regla congelada **CALIBRA**; pero los **controles fallan**: la toma real 0202 da 2/3 (J3) y la 0137 **0/3** (A320).
- **Por qué (A321, juicio de [R]):** J1–J3 miden «**maqueta limpia y simétrica**», no 2D-HD: (1) circularidad: salieron de 0202, 0137 y V2 y las tomas no los cumplen a ciegas; (2) J3 castiga varios niveles visibles y relieve repartido, que son el **mirador y el vistazo**; (3) J1 exige eje continuo y 0137 compone con baranda y cambio de nivel que lo cortan; (4) J2 exige marco simétrico y 0137 cierra con masa a un solo lado; (5) muestra mínima (5 cuadros). **No se usan tal cual en otro referente.**
- **Consecuencias:** [R] ya no puede ser juez ciego (vio hojas rotuladas, A315); se definen **banda, plano, eje, función, solape, vistazo deducido, mirador** (`DEFINICIONES_T26_v311`; §3.3); el vistazo se deduce del mapa y la cámara y se valida midiendo V(p) (A313); se adopta **un solo frente (R1.5)** y la **comparación ciega contra la toma real** en lugar de una rúbrica (A325, aceptada por [U] el 16 nov 15:13). Se suspenden Octopath Traveler II y DQ1&2 HD-2D.

**Reflexión A325 (aprender de ella):** «el trabajo reciente fue **instrumento y no Generación**»; J1–J3 convirtieron la hipótesis de [R] en criterio. Un criterio que sale de las mismas tomas que se quiere juzgar es circular.

---

### 4.6 Prueba 6 · R15 «Planos y vistazo» (16–17 nov; A326–A357)

**Objetivo.** Probar **trucos de composición** de uno en uno (o por grupo, con atribución por quita-uno), con juez ciego contra la toma real (0137 y 0202 de la sala F de la Torre del Soñador).

#### 4.6.1 Pase 1 · Vistazo en DQ3 sala F — POSITIVO (A326–A333)
- **Estados (PREDICCION_R15_P1_v312):** **A** = sala F tal como está (dato `fa55de91e696f`; 0137 `heroAt` (23,5; 18,5), 0202 `heroAt` (29,5; 43,5); variante S1; cámaras congeladas); **B1** = A + sala vecina C (la del mapa 4F más allá de la baranda N) con su contorno del mapa viejo, suelo **al mismo nivel** (Δ = 0) y reglas por defecto; **B2** = B1 con C elevada Δ por la **regla del mirador** (el menor Δ de {0; 0,5; …; 4,0 H} con V(hotspot) ≥ 15 %; usa solo mapa y cámara; si Δ = 0, B2 = B1 y no se juzga aparte). Predicciones: Q4 (principal) «B1 gana a A en 0137»; Q7 (control) «A → B1 no cambia nada de F (≤ 0,5 % de píxeles dentro de la silueta de F)»; POSITIVO si Q4 y Q7 se cumplen. Fuente única = el **mapa completo del 4F del remake** (circularidad declarada; el mapa SNES de Najimi queda **reservado para Generación**; A329). En el mapa del 4F: F = sala del medio a la derecha, C = la de arriba a la derecha; la franja que CC propuso como C era la **faja oscura de borde** entre salas (A328). Registro 1:1 (NCC 0,999; error máx. 1,2 tiles; A330). A se reproduce exacto (hashes `21faf449` y `a92b3b48`, 0 px, árbol e882c5c; A327).
- **Medidas de CC (A331):** con Δ = 0 la vecina C da **V = 17,5 % en el hotspot de 0137** (la toma: 31,4 %); en 0202 C casi no entra (**0,77 %**); control de F 0 px (0137) y 0,0016 % de antialiasing (0202).
- **Resultado (A332):** **B1 gana a A 3/3 en 0137 y 3/3 en 0202**; Q1–Q5 y Q7 se cumplen. **Primera palanca de composición que mueve el juicio ciego hacia la toma.** (3 jueces del mismo modelo, una sala.)
- **Límite (A333):** los jueces premian «**masa construida detrás del cierre**» frente a «**cielo vacío**» (en 0202 bastó un 0,77 %); faltaba el control de **cierre alto sin vecina**, y la regla del mirador no actuó (Δ = 0).

#### 4.6.2 Pase 2 · Generación sobre sala DAC no usada — POSITIVO (A334–A337)
- **Diseño (A334):** sala elegida **por regla** (DAC, 250–600 tiles, vecina a ≤ 10 tiles en la dirección de la cámara, id más bajo → **sala 1**: 278 tiles, vecina 7 a 1 tile; 18 de 19 candidatas tienen vecina a 1–3 tiles; A335). Estados: **A** (base), **K** (`planes` a 5 H: *control de cierre alto*) y **B** (regla del vistazo: **baranda de 1 H al fondo + ventana con la vecina + Δ** hasta V ≥ 20 %). Juez ciego contra la toma 0137 en k0, k4, k8.
- **Entrega (A335):** V de B en el hotspot **15,7 % con Δ = 4,0 H** (bajo el 20 %: la regla llegó a su tope); V k0/k4/k8 de B ≈ 11,9 / 15,7 / 32,3 %; la baranda se aplicó en 31 de 58 tiles; la vecina elevada se lee como masa escalonada detrás de la baranda.
- **Resultado (A336):** **B gana a K y a A en k0, k4 y k8, 3/3 votos en cada prueba (9–0)**; K contra A: A en k0 y k4, K en k8. **Primera respuesta afirmativa a la pregunta de Generación del Ancla para un truco de composición** (1 sala, 3 posiciones, 3 jueces del mismo modelo).
- **Lectura (A337, hipótesis):** lo que gana es el **cierre en dos planos** (barrera baja cercana + masa más alta y lejana detrás), no solo tapar el cielo: K también lo tapa y pierde 9–0. No se probó que la masa lejana deba ser la **sala vecina real** y no un fondo construido.

#### 4.6.3 Catálogo de trucos y grupos G1–G3 (A338–A353)
- **Catálogo (`TRUCOS_composicion_v314`; A338):** 25 trucos en 4 grupos (masas y planos, altura, encuadre, cámara/superficie); 2 probados (vistazo y cierre en dos planos).
- **Cambio de método de [U] (A339):** un grupo por pase con **atribución por quita-uno**: G1 masas y planos, G2 altura, G3 encuadre.
- **Corrección de terreno de [U] (A343):** **máximo 3 terrazas y 1–2 subterrazas** (1 si la vista es muy clara), **luego** exageración y cámara. G1 se probó sobre terreno mal hecho.
- **G1 NEGATIVO (A341):** TODO gana a BASE solo en 2 de 9; quitar A3 mejora en 4 de 6; 3 jueces degradados (33 pruebas por juez: pérdida de contexto → tandas ≤ 9–10; A342). Entrega: A3 colocado en sala 9, a medias en 1, ninguno en 3; pilar C2 tapa al héroe en s1 k4; Δ = 4 H sin llegar al 20 % (sala 9: 2,5 %) (A340).
- **Lección G1 (A342):** los jueces prefieren el **centro del cuadro abierto** (eje despejado al fondo) y masas solo en los bordes; las reglas escritas en **coordenadas de mapa** (tercios de sala, ±2 tiles del camino) ponen columnas en el **centro de la pantalla**; un obstructor 2D-HD debe definirse **por su posición en el cuadro** (borde lateral de B1).
- **G2 NEGATIVO (A344–A345):** BASE (`terraces` 3, `subs` 2, vistazo) gana a TODO **8 de 9**; quitar `subs` 1 mejora 8 de 9; quitar `vScale` 1,25 mejora 7 de 9; quitar `exag` 1,3 mejora 6 de 9. `exag` 1,3 subió columnas a 4,17 H y W p95 a 6,06 H; vistazo casi nulo en sala 9 (0,4 %). **Base de G3 = BASE de G2** (3 jueces × 4 tandas de 9, sin pérdida de contexto).
- **Lo que pesa según los jueces (A346, 3 de 3 en G1 y G2; hipótesis):** (1) un **escalón o bordillo continuo que cruza la franja media** (la balaustrada: `subs` 2 lo produce, `subs` 1 lo borra); (2) **ver lejos** (`exag` y `vScale` suben muros y tapan el fondo); (3) **pilar en el borde del cuadro que sale por arriba**, nunca en el centro. Respalda la corrección de terreno de [U].
- **G3 NEGATIVO (A350–A353):** los trucos se definen **por posición en pantalla desde la cámara de k4** (corrige G1). TODO 5/9 contra BASE (K1 falla), E1 3/9, **E2 0/9 sin probar** (la baranda no se colocó en ninguna sala: los 9 pares idénticos), E3 2/9. **Una columna suelta en el borde gana 3–0 dos veces; la misma masa pegada al muro tapa las columnas propias y pierde 3–0 dos veces** (A352; n = 4 pares, hipótesis).
- **Defecto de diseño de los pedidos (A355, objeción de [U] 01:22):** G2 y G3 fallaron por **cómo se pidió**, no por resultado: decían *dónde* poner, no *qué es* el truco, cómo se ejecuta ni qué debe verse; sin puerta de presencia, E2 salió vacía y contó como pérdida. De ahí la **ficha de truco** (A357; §2.5 y Anexo C). T47: revisar si G1 sufrió el mismo defecto (el informe v318 lo confirma: A3, A4 y C2 de G1 quedan «probado mal»).
- **Dos hechos nuevos de las tomas (A348–A349):** hipótesis de [U]: DQ3 usa **dos cámaras** (perspectiva en la sala; el dungeon visto tras la baranda más «plano»), el héroe es de escala constante y las salas con vistazo están más altas (0202/0137). Pero el héroe **no mide lo mismo** en las tomas de la sala F: `heroFrac` 0,08 en 0202, 0,1205 en 0137 (≈ 0,072 medido en v305; A274: 0,128 en 0137): o no es de escala constante, o cambia el zoom o el recorte.

#### 4.6.4 G4-M · cámaras (en curso al cierre de este informe; A347–A356)
- Plan: `PLAN_R15_G4_camaras_v316` — **G4-M** (medición en las tomas, sin construir) y **G4-C** (construcción solo si M1 y M2 se cumplen; A354). M1/M2/M3 son predicciones congeladas (`ce164a11…`, luego `e52a15ce…` con la Enmienda 1).
- **Enmienda 1 (A356):** el **punto de fuga dentro y fuera de la sala** como huella directa de una segunda cámara; **anchos además de altos**; el render con **una sola cámara es el control** del método. Entregada a CC en la PARADA 1.
- **Descartado (A347):** C6 «cámara casi ortográfica» (propuesta de [R]): [U] — va contra el Ancla; la ortográfica aplana la profundidad y solo da lectura isométrica; Cam 6 (FOV 30, perspectiva) se mantiene.
- **Resultado:** pendiente. **No hay resultado de G4-M en este informe.**

#### 4.6.5 Estado del catálogo de trucos (de `INFORME_METODO_TRUCOS.md` (v318); fichas completas allí)
| ID | Truco | Estado | Comentario |
|---|---|---|---|
| A1 | Vistazo (mirador) | **PROBADO BIEN** (P1, P2) | BASE. En G1–G3 estuvo ausente en sala 9 (V 0,4–2,5 %); puerta de presencia: V(k4) ≥ 10 % (umbral propuesto por [R], se congela con la pasada); Δ se busca en [−4; +4] H, con Δ negativo (vecina más baja) para casos como 0137 |
| A2 | Cierre en dos planos | PROBADO BIEN (indirecto, P2) | Variante sin probar: masa lejana construida |
| A3a | Columna suelta de borde (+B4 piezas elegidas) | PROBADO A MEDIAS | G3: 3–0 dos veces cuando está suelta |
| A3b | Masa baja de esquina inferior | NUNCA PROBADO | referencia: dragón 0137, plintos 0202 |
| A4 | Vano focal en el fondo | PROBADO MAL (G1) | se construyó una columna clara en vez de una abertura |
| A6 | Línea de nivel en franja media (baranda) + encuadre | **NUNCA PROBADO** | requiere ajustar `heroScreen` fy ∈ [0,45; 0,80] o k_mir |
| A7 | Corte del lado de cámara (diorama) | REGLA (base) | `planesTest.noFront` |
| A8 | Paso por detrás (arco/dintel) | NUNCA PROBADO | posible bloqueo técnico (`volumeOnWalkable`) |
| B1 | Escalera sobre el eje | NUNCA PROBADO como truco | aparece en terreno a mano |
| B2 | Relieve concentrado | PROBADO MAL (G2) | no es `subs` 1 (eso borró el borde medio) |
| B3 | Altura fingida (plinto) | DATO de [U], NUNCA PROBADO | base de N1 |
| B4 | Exagerar piezas elegidas, no el conjunto | PROBADO MAL (G2, `exag` global) | `exag` = 1 siempre; altura en el dato |
| B5 | Cara de caída visible | VISTO, NUNCA PROBADO | va con A6 |
| B6 | Profundidad comprimida | HIPÓTESIS | espera G4-M |
| B7 | Escala vertical general (`vScale` 1,25) | PROBADO MAL (G2: quitarla mejoró 7 de 9) | no usar como truco: sube peldaños y muros por igual |
| C1 | Eje y hotspot | REGLA | |
| C2 | Par que flanquea una transición | PROBADO MAL (G1) | un solo par por sala, no cada 6 tiles |
| C3 | Calcomanía en el hotspot (pentagrama) | NUNCA PROBADO | el G3 probó la cinta de camino, que es **otro** truco |
| C4 | Pasillo ancho (≥ 5 integrantes) | DATO de [U] | regla de escala |
| C5 | Dos escalas de héroe | HIPÓTESIS | espera G4-M3 |
| C6 | Cámara casi ortográfica | **DESCARTADO** (A347) | contra el Ancla |
| C7 | Encuadre por posición | HIPÓTESIS | va con A6 |
| N1 | Escalera – estatua – escalera | VISTO, NUNCA PROBADO por regla | B1 + B3 + A3b |
| D1–D4 | Desenfoque, luz guía, niebla, sprites con luz | **fuera del Ancla** (Unity) | no se prueban en el visor |
Diseño propuesto de la pasada única de CC (v318 §5): Pase 0 base y puertas (terreno `dac_stage` con `terraces` 3 y `subs` 2; salas candidatas con A1 PRESENTE; BASE = A1 + A2 + A7 + C1 + C4 con Cam 6, `heroFrac` 0,10, `exag` 1, `vScale` 1; posiciones k0, k4, k8 y k_mir); pases 1–8 de un truco por pase (A6, A3a+B4, A3b, C3, A4, C2+B1, B3, N1) y TODO; juicio después, por [R], con jueces ciegos en tandas ≤ 9 contra 0137 (y 0202 en A3b, C2, B1). **Aún no se ejecutó.**

---

## 5. Lista de aprendizajes sobre HD-2D y DQ3 (referencia rápida)

Leyenda de estado: **REGLA** = dictada o aprobada por [U] · **VALIDADO** = medido, reproducido o dicho por [U] como hecho · **HIPÓTESIS** = razón de jueces, lectura de [R], n pequeño o sin medir · **DESCARTADO** = con motivo. La columna *Fuente* da los IDs del Registro o la nota; nada de esta lista se escribió en el Registro.

### 5.1 Objetivo y alcance
| # | Aprendizaje | Estado | Fuente |
|---|---|---|---|
| L01 | «Parecerse al remake» = **composición** (capas, cierre del fondo, ancho de ruta, escala del héroe, planos), **no look**. Luz, DoF, texturas y color se juzgan en Unity. | REGLA | A003, T03, T15 |
| L02 | El objetivo es una **maqueta 2D-HD general**; DQ3 es solo la primera prueba (Octopath, Triangle Strategy y Wandering Sword vienen después). El «100 %» es la prueba de **capacidad**, no un criterio de terminado. | REGLA | A008 (corrige A006) |
| L03 | **Con cubos apilados basta.** Cam 6 (perspectiva, FOV 30°, pitch 25°) se queda como Ancla. | REGLA | BRÚJULA v180; A347 |
| L04 | Un 3D «perfecto» no basta: la profundidad HD-2D = **técnicas de 16 bits** (fondos falsos, obstrucciones parciales, primer plano y fondo construidos, horizonte falso, isometría como encuadre, varios planos por sala) aplicadas sobre un **3D con altura real**. | HIPÓTESIS de [U]; respaldada por P1 y P2 | T26, A296, A322 |
| L05 | DQ3 de 8 bits es «súper plano» (terraza + mini-terrazas + perspectiva): los terrenos se construyen **primero planos** y luego los **overlays de borde** disimulan que la altura es isométrica. | VALIDADO ([U]) | A090, v245 |
| L06 | En 2D-HD **25–40 % de la vista se dedica a ver más adelante** (horizonte local, bandas, profundidad), incluso dentro de la misma sala. | VALIDADO ([U]) | A247 |
| L07 | El remake de DQ3 **conserva zonas relativas pero cambia terrazas y pasillos**: no es fiel al trazado del mapa viejo (un pasillo → dos escaleras). La equivalencia es topológica, no por tile. | HIPÓTESIS (lectura de [U] y [R]; sin medida que la valide) | A005, A117, A230 |

### 5.2 Cámara, escala y encuadre
| # | Aprendizaje | Estado | Fuente |
|---|---|---|---|
| L08 | Las tomas de la sala F miden un pitch de ≈ 23° ± 5° por escorzo del hexagrama (n = 2); Cam 6 a 25° cae en el rango. | HIPÓTESIS (n = 2) | A255 |
| L09 | El héroe mide 0,09–0,13 del alto en el Bosque (`heroFrac` 0,11), ≈ 0,10 en Aliahan, 0,072 en 0202 y 0,128 en 0137: **no es constante** en las tomas de una misma sala. Lo mide G4-M3. | VALIDADO (medido) / causa HIPÓTESIS | A004, A042, A274, A349 |
| L10 | `heroFrac` es la **caja de 1 H en el pivote**, no la figura visible; la figura del marcador = cabeza + cuerpo + punto. Medir solo el cuerpo falseó la escala. | VALIDADO | A150, A153 |
| L11 | Calibrar el héroe **emparejado con la toma** (`heroFrac` + `heroScreen`) antes de juzgar composición: pies a ≤ 0,4 puntos; héroe a −1,2…+0,9 puntos en 8/8. La cámara calibrada da ≈ +1 en la nota. | VALIDADO | A149, A159, A163 |
| L12 | `tilesPerH` = **1,5** en DQ3 (medido ≈ 1,44). La escala del héroe se resuelve por `tilesPerH`, no por `heroFrac`. | VALIDADO | A045, A159 |
| L13 | **Subir el pitch no cierra el vacío**: a 33° el vacío del estrado baja de 15,7 % a 12,1 % (10,1 % a 37°). El cierre es geometría. Las salas de DQ3 están tomadas más picadas que Cam 6 (trono ≈ 35–40°, sala roja ≈ 50–60°; medido a ojo). | VALIDADO (barrido) / ángulos HIPÓTESIS | T05, T11 |
| L14 | Las tomas de [U] son **recortes de YouTube**, no pantalla completa; el render debe cubrir al menos la pantalla completa (lienzo 16:9; cuadro real ≈ 1322 × 744). El minimapa mide ≈ 13–14 % del ancho. | VALIDADO | A146–A148, v273–v274 |
| L15 | **Cámara casi ortográfica = descartada**: aplana la profundidad y solo da lectura isométrica; va contra el Ancla. | DESCARTADO ([U]) | A347 |
| L16 | Hipótesis de [U]: **dos cámaras** (perspectiva en la sala; fondo tras la baranda más «plano»). Se mide primero (G4-M); se construye solo si M1 y M2 se cumplen. | HIPÓTESIS (en curso) | A348, A354, A356 |

### 5.3 Alturas, terreno y geometría
| # | Aprendizaje | Estado | Fuente |
|---|---|---|---|
| L17 | **Altura aparente ≈ dato^exag × vScale**; inversa: dato = (aparente ÷ vScale)^(1/exag). Poner la altura aparente como dato (con exag ≠ 1) la deja ≈ 2×. | VALIDADO | A170, A174, A181 |
| L18 | `vScale` sube **todas** las alturas (peldaños incluidos, ≈ 2× en la escalera); `exag` sube muros, volúmenes y objetos. **Ninguna palanca global sirve a todas las salas** (no hay un `exag` global que sirva). | VALIDADO | A162, A276, A346 |
| L19 | El visor **cuantiza con el rango global**: bajar una pieza sola exige cambiar terrazas, no `vScale` / `exag`. | VALIDADO | A018 |
| L20 | Terreno de base: **máx. 3 terrazas y 1–2 subterrazas** (1 si la vista es muy clara); **después** exageración y cámara. | REGLA ([U]) + respaldo G2 | A343, A345 |
| L21 | `terraces` y `subs` cambian máscara, camino, orientación y meta; hay que compensar con `terH`. | VALIDADO | A258, A303 |
| L22 | **Bajar los muros expone el vacío** y deja el terreno «sin terminar» (diorama flotante). Los muros de cierre del trono llevan 8 H y los pilares 5 H. | VALIDADO | A279, A280, A284 |
| L23 | **Muros y columnas de `planes` a 5 H suben J2** (masa de encuadre) sin tocar terreno ni camino; vacío 13,8 → 4,6 % (84) y 9,4 → 5,3 % (65). La altura del muro por sí sola **no discrimina** entre V2 y DAC. | VALIDADO (2 salas) | A268, A300 |
| L24 | «Ver por encima» sale de la **perspectiva** (muro más alto que los suelos), no de subir suelos. El «suelo elevado» de 0206/0214 era un **hueco** de 78 y 177 tiles. | VALIDADO | A215, A222 |
| L25 | Escalera del remake ≈ 4,5 H donde el mapa viejo tiene un paso de ≈ 1,4 H (≈ 3,2×); la de 0214 se dibujó con 5 peldaños; casi ninguna escalera de DQ3 era alta. | VALIDADO (CC, [U]) | A141, A209, A247 |
| L26 | La tarima del rey es **baja** (≈ un escalón de terraza, ≈ 0,3 **tile**: 1 subnivel = 0,21 H ≈ 0,315 tiles con `tilesPerH` 1,5); el escalón de terreno del POI era la causa del peor tile (42,6 → 20,0 %); [U] (11 nov 21:00): «elevar el POI no funcionó». | VALIDADO | A083, v235, `stage_m6_paso2_go` |
| L27 | `pre` (promedio 3 × 3 del relieve) convierte un muro de 4 H pegado al suelo en una **rampa de 2 tiles**. | VALIDADO (lectura de código) | A046 |
| L28 | `volumes` (S4b) solo levanta volúmenes **sobre tiles ya bloqueados** y necesita ≥ 2 tiles de margen a un escalón; **no sirve** donde el bloqueado está a 3–12 tiles del camino y de un solo lado (DAC). | VALIDADO | A285, A288 |

### 5.4 Modelo de escena, planos y bandas
| # | Aprendizaje | Estado | Fuente |
|---|---|---|---|
| L29 | La escena es **verde (transitable continuo) + azul (fondo no transitable)**; el **rojo es overlay** decorativo con un pie en azul, que cuenta para el 30 % de billboards. Orden de trabajo: topología plana (≈ 60 %) → leer y definir el rojo → deducir lo de detrás → anclar el overlay. | REGLA ([U]) | A089, A107, A112 |
| L30 | Hotspot = siempre transitable, central salvo POI, **sobre el eje de flujo**. Bandas B1–B5 en Z; plano = banda + lo que tapa. | REGLA ([U]) | A191, A202, A206, A311 |
| L31 | Las **islas** valen, pero sus bordes (murallas, parapetos) deben conservar su visibilidad propia (si no, «mugshot»); los bordes fallan sobre todo en **altura**. | VALIDADO ([U]) | A203, A210, A217 |
| L32 | **Pasillos ≥ 5 integrantes** del grupo (≈ 3,0 H). | REGLA ([U]) | A182, A194 |
| L33 | El **fondo del remake es un fondo de color**; «vacío 0 %» medía hueco, no fondo. Lo que cierra la vista en el remake es masa construida, no cielo. | VALIDADO | A084–A085, A333 |

### 5.5 Composición: lo que mueve (o no) el juicio ciego
| # | Aprendizaje | Estado | Fuente |
|---|---|---|---|
| L34 | **Vistazo** (masa de otra sala visible por encima de la baranda): B1 gana a A **3/3 en 0137 y 3/3 en 0202**. | VALIDADO (1 sala, 3 jueces del mismo modelo) | A332 |
| L35 | **Generalización a una sala DAC no usada**: B (baranda 1 H + vecina + Δ ≤ 4 H) gana **9–0** a K (cierre alto sin vecina) y a A. | VALIDADO (1 sala, 3 posiciones) | A336 |
| L36 | Lo que gana es el **cierre en dos planos** (barrera baja cercana + masa alta y lejana detrás), no solo tapar el cielo; en 0202 bastó V = 0,77 %. Falta probar «vecina real» frente a «fondo construido». | HIPÓTESIS | A333, A337 |
| L37 | Los jueces prefieren el **centro del cuadro abierto** (eje despejado hasta el fondo) y masas solo en los **bordes laterales**. | HIPÓTESIS (razones de jueces) | A342, A346 |
| L38 | Una **columna suelta** en el borde del cuadro gana 3–0 (dos veces); la **misma masa pegada al muro** tapa las columnas propias y pierde 3–0 (dos veces). | HIPÓTESIS (n = 4 pares) | A352 |
| L39 | Lo que pesa según los jueces (3/3 en G1 y G2): (1) un **escalón o bordillo continuo** en la franja media (balaustrada; `subs` 2 lo produce, `subs` 1 lo borra); (2) **ver lejos**; (3) **pilar en el borde que sale por arriba**, nunca en el centro. | HIPÓTESIS | A346 |
| L40 | Un obstructor 2D-HD se define por su **posición en el cuadro**, no por coordenadas de mapa (tercios de sala, ±2 tiles del camino ponen columnas en el centro de la pantalla). | HIPÓTESIS (derivada de G1) | A342, A350 |
| L41 | Las tomas **no** tienen una cinta sobre el camino: tienen una **calcomanía en el hotspot** (pentagrama / hexagrama). La cinta de camino subió J1 pero es otra cosa (capa declarada). | HIPÓTESIS (razones de jueces) | A301, v318 |
| L42 | **Billboards ≤ 30 %** (medido como píxeles que cambian al quitarlos); suelo = bloques pintados; cintas = calcomanías. El trono quedó en ≤ 8,84 % y el bosque (toma 1) en 65 % como deuda. | REGLA ([U]) | regla 9–10; A036, A059 |
| L43 | **Criterio de oclusión solo sobre el camino**: ninguna baldosa de alfombra con > 25 % perdido por un volumen o columna (pilares: relajado y declarado); el 30 % fue 1 punto de margen y subió a 35 %. | REGLA (declarada por pase) | A054, A057, A063 |
| L44 | **Cierre del fondo ≤ 0,05 %** del cuadro en 16 posiciones lo da la **geometría** (volúmenes y muros altos), con caminata de 45 fotogramas sin saltos. | VALIDADO (un trono) | A054, v226 |
| L45 | La **simetría** se prueba por espejo con mutaciones (56 → 0 baldosas asimétricas); y se **contrasta con la imagen original**, no con un PNG derivado. | VALIDADO | A061, A064 |
| L46 | Efectos que **no** aportan: `stageBorder` quebrada / isla (solo visual), `terraces` 3 solo, `exag` global, `vScale` global, `subs` 1 como «relieve concentrado», cinta de camino como sustituto de calcomanía. | VALIDADO / DESCARTADO | A259, A289, A345, v318 |

### 5.6 Generación desde un mapa viejo
| # | Aprendizaje | Estado | Fuente |
|---|---|---|---|
| L47 | **Ninguna regla de `src/` deduce niveles caminables desde el trazado** de un mapa viejo; el relieve del trono, Forest y Aurhea es decisión humana. | VALIDADO (lectura de código) | A073 |
| L48 | El mapa viejo **no trae en píxeles** niveles (0,93–0,97 la misma clase), plinto (0,12–0,14), escaleras laterales (0,16–0,67) ni parapetos (0,08–0,50); el pipeline de reglas reproduce parapetos 0 de 4, escaleras 0 de 3, niveles 0 de 2, plinto 0 de 4; pilares sí. | VALIDADO (CC, nota 5a) | A228, A229 |
| L49 | El pack del generador de EvoDun **ya trae** elevación, zonas, bordes barrera / paso, camino, POI y agua; el visor deriva de eso niveles, escaleras en puertas, orientación y planos. | HIPÓTESIS (lectura de repo e882c5c, **no corrida**) | A233, T28 |
| L50 | La **ablación** (trono plano) conserva muros, pilares y verticalidad: casi todo el efecto sale de las **clases** y de las reglas de verticalidad, no de la altura caminable. | HIPÓTESIS (no reproducida por [R]) | A074 |
| L51 | `orient.js` en sala plana sin gates ni POI cae en el signo canónico (cámara mirando al sur, yaw 180): desempate arbitrario; **POI primero** (#91 en borrador) y la zona de entrada fundida en la nave dan yaw 0. | VALIDADO (lectura / copia) | A049, A086, v232 |
| L52 | Un mapa viejo es una rejilla de tiles de 16 px; la rejilla **se aprende por repetición de bloques**; el agua se clasifica por color (semilla de M6). | VALIDADO (Aurhea) | v168–v170 |
| L53 | La **cinta derivada del camino** es candidata a regla de generación, pero hay que saber si un mapa nuevo trae camino. | HIPÓTESIS | T43, A301 |
| L54 | La profundidad de la toma es **más corta que la del mapa** (razón 0,31–0,67 frente a 0,88–1,00 en E-O): la proyección inversa de la toma comprime Z. | HIPÓTESIS | A214, A223, B6 |
| L55 | Najimi piso 2 **no es un juez fiel** (B IoU 0,45; C anisotropía 3,92; F parece fusionar dos salas). | VALIDADO (CC) / F HIPÓTESIS | A230 |

### 5.7 Método y juicio
| # | Aprendizaje | Estado | Fuente |
|---|---|---|---|
| L56 | **Cambiar el objeto de la prueba** cuando el síntoma persiste (tarjetas → mundo; reglas ciegas → pares render \| toma). | VALIDADO | v226, A122–A123 |
| L57 | **Cada paso termina en un par render \| toma** o no es prueba; **verificar con caminata**, no con un fotograma. | REGLA | A123, regla 4 |
| L58 | Pasos pequeños, **solo datos**, hash de render antes y después en 2 corridas iguales. No evita regresiones de composición (0206: 8 → 5 → 9 → 8,5). | VALIDADO | A138…A221 |
| L59 | **Paso 0 de solo lectura con PARADAS**: una PARADA bien dicha vale más que un «hueco» anotado. | VALIDADO | A073, A224, A228 |
| L60 | **Criterios y predicciones congelados con sha256 antes de correr**; enmiendas con hora, no retroactivas; calificación firmada antes de abrir las DESPUÉS. | REGLA | A286, A299, A334 |
| L61 | **Medir la causa en lugar de opinar**: cuatro hipótesis de [R] cayeron por una medida. | VALIDADO | A150→A154, A215→A222, A199→A214 |
| L62 | **Medir la brecha sin cambiar nada** antes de escribir reglas (5a) es la forma barata de saber si una línea vale la pena. | VALIDADO | A228–A230 |
| L63 | **Pulir datos a mano no es la prueba del Ancla**: mejoró la nota, no produjo reglas. | VALIDADO | A226, A232 |
| L64 | **«Cuando el desarrollo depende de las lecturas de [U] deja de ser constructivo»**: la nota de [U] no es compuerta ni condición de falsación. | REGLA ([U]) | A232, A282 |
| L65 | Un **criterio extraído de las mismas tomas** que se quiere juzgar es circular; J1–J3 miden «maqueta limpia y simétrica». | VALIDADO | A320, A321 |
| L66 | El juez vigente: **comparación ciega contra la toma real**, ≥ 3 subagentes sin contexto, tandas ≤ 9–10 (A342; los pases usan 9), texto exacto, gana quien tiene ≥ 2 de 3. | REGLA | A325, A342 |
| L67 | **Ficha de truco con puerta de presencia**: un truco AUSENTE no va a los jueces y no cuenta como pérdida; un pedido negativo con pedido defectuoso no cierra el truco. | REGLA ([U] 01:29) | A355, A357 |
| L68 | **Una variable por pase**, o un grupo con atribución por quita-uno; declarar siempre `vScale`, `exag`, `terH`, `tilesPerH`. | REGLA | A276, A339 |
| L69 | **Repartir por fortaleza**: la percepción del mapa en [R] (especificación en tiles + dibujo que [U] confirma de un vistazo); CC solo codifica y verifica con superposición independiente. | VALIDADO (límite: si la especificación falla, CC la copia) | A216, A221 |
| L70 | **Registrar cada error y retractación**; guardar el estado cada 20–30 intercambios. | VALIDADO | M9; A065, A245, A347–A350 |
| L71 | **Verificación acotada**: por PR ≤ 10 min; `regress --sample 1/4` solo con código compartido; una pasada de cierre de 20–30 min. | REGLA ([U]) | regla 8 |
| L72 | **Medir con la misma definición de transitable** que usan las reglas (`walkableAt` laxo da 429 contra 283 tiles). | VALIDADO | A242 |

---

## 6. Lo que no funcionó (no repetir)

| # | Qué | Por qué | Fuente |
|---|---|---|---|
| X1 | **Toma 2 del trono con billboards sobre un valle plano** (D1) | 81 % billboards, generador apagado, un fotograma como juez, sin mapa | A034–A037 |
| X2 | **Reglas ciegas del Paso 3 (a–g)** | CC recibió las tomas y midió parámetros en ellas; el protocolo ciego quedó contaminado; el rojo por reglas de borde no tenía lectura previa | A105–A106 |
| X3 | **Pulir datos a mano como sustituto de la prueba del Ancla** | +2,1 en 4g y +0,25–0,33 en 4h; ninguna corrección quedó como regla | A226 |
| X4 | **CC percibiendo el mapa** | la entrada «toma» comprime Z (A223: toma/mapa en Z 0,31–0,67, sin verificar); el dato de F de CC medía 27 × 40 tiles interiores contra ≈ 46,5 × 41 del mapa (0,58 en X; cálculo de [R], A214) | A214, A223, v293 |
| X5 | **Depender de la lectura de [U] en cada vuelta** | cuello de botella humano | A232 |
| X6 | **Rúbrica J1–J3 como juez** | circular; castiga el vistazo y el relieve repartido | A320–A321 |
| X7 | **Bajar los muros** (paso 1a) | expone vacío, deja terreno sin terminar, baja J2 | A279–A284 |
| X8 | **`stageBorder` quebrada / isla** como solución del «fondo abierto» | solo visual; no llega a 0 | A259, A289 |
| X9 | **`exag` y `vScale` globales** | suben también el cierre y tapan el vistazo | A345, v318 B4/B7 |
| X10 | **`subs` 1 como «relieve concentrado»** | aplana todo y borra el bordillo de franja media | A345, v318 B2 |
| X11 | **Reglas de obstructor en coordenadas de mapa** | caen en el centro del cuadro | A342 |
| X12 | **La franja de alfombra** del trono | solo existía para pasar nuestro criterio del 25 %; el remake permite caminar por el suelo lateral | A046 |
| X13 | **Variante A de Forest (casi plana)**, **Aurhea como juez único**, **Cam 8 / `stagePitch`** | ver A009, A002, v175 | — |
| X14 | **Cámara casi ortográfica (C6)** | contra el Ancla | A347 |
| X15 | **Clasificador DARK y HZ_glimpse** como discriminadores | no distinguen DQ3 de DAC | A266, A271 |
| X16 | **Elevar el POI** | no funcionó; el escalón era la causa del peor tile | A083, v235 |
| X17 | **Mis métricas propias** (cobertura de masas, «presente» y «coincide» inflados, M1 «0,000») | miden otra cosa que lo que [U] ve; circulares | A172, A199, A209, A185 |
| X18 | **Juzgar con 33 pruebas por juez** | pérdida de contexto | A341–A342 |

---

## 7. Cómo reproducir el nivel actual (checklist para otra sesión)

**7.1 Al abrir.** (1) Leer este informe. (2) Leer, en este orden, `PLANTILLA_escena_dorada_modo3`, `BRUJULA_modo3` (Norte + reglas + registro de decisiones), `DEFINICIONES_T26_v311`, `INFORME_METODO_TRUCOS.md` (v318), `ANALISIS_pases_M6_metodologia`. (3) Fijar las convenciones de §3 (verde/azul/rojo, banda, plano, hotspot, vistazo). (4) Decir en una línea qué es *validado*, qué *hipótesis* y qué *descartado* (§5–§6) antes de proponer nada.

**7.2 Entorno que se debe tener (o saber que falta).**
- Repo `Dracmire/EvoDun-Landmaker` en **e882c5c**, visor del modo 3 (Stage); arnés de trabajo byte-idéntico al repo con *packs* inyectados en tiempo de ejecución (**no se toca `src/`**; `src/planes.js` y `src/frame.js` son PARADA salvo excepción nombrada).
- Herramientas: render de ids, `tools/stage_readings.js`, `m4c_golden.js`, `m4_pair.js`, Cam 5 + `screenPan`, V(p), caminata, `regress --sample 1/4`.
- **Faltan fuera del Proyecto** (solo en el entorno de CC; T29): los `data.json` a mano de las 8 salas, los scripts del pipeline (`/tmp/m6n`, `wtC`) y los hashes. Sin exportarlos, **no se puede reproducir cifra por cifra** la Torre del Soñador; sí se puede reproducir el **método**. Ninguna cifra de este informe depende de que se re-corra (todas vienen de notas y registros), pero **toda cifra que se use como compuerta de un pase nuevo debe re-medirse** en la sesión nueva (§0.2).
- Material del remake (tomas, mapa completo del 4F de 601 × 612 px, minimapas) está en `docs/crystallizers/03-stage/refs/dq3/…` del repo (repo **público**: T02, decidir antes de publicar con Pages).

**7.3 Capacidades que definen «nuestro nivel».**
1. Dado un mapa y una toma, hacer la **lectura de escena** (verde, azul, rojo; zonas; tránsito) y entregarla como **especificación en tiles** + dibujo, para que CC la codifique y verifique con superposición (Δ ≤ 1,5 tiles).
2. Escribir un **pedido a CC** con: alcance (solo datos / hooks; sin `src/`), fuentes, reglas que quedan encendidas, PARADAS, qué NO se prueba, entrega ≤ 1,5 páginas, hashes ×2, y la hoja de presencia.
3. **Congelar predicciones y regla de decisión con sha256 antes de ejecutar**; después, control de entrega (hashes ×2, máscara/camino/meta idénticos, tiles cambiados, presencia por truco, sala y posición).
4. **Armar el juicio ciego**: PNG limpios 1280×720 sin rótulos, orden al azar, mapa de etiquetas aparte (se abre después de los votos), tandas ≤ 9–10 (los pases usan 9), texto exacto, ≥ 3 subagentes sin contexto; contraste contra la toma real; declarar contaminación.
5. Escribir una **ficha de truco de 11 campos** con puerta de presencia numérica y la receta paso a paso (Anexo C).
6. Llevar el **registro de errores y retractaciones**, y distinguir VERIFICADO / NO VERIFICADO en cada afirmación.
7. Usar la **PLANTILLA** para cualquier sala nueva: ficha de arranque (12 campos) → Paso 0 de solo lectura → Commit 1 (mundo) → 2 (cierre) → 3 (vestido) → deltas → pasada de cierre → A-OK.

**7.4 Lo que sigue según el Estado vigente (17 nov).** (1) Informe de método con la ficha de cada truco (**hecho: v318**). (2) Informe de metodología de **generación** tipo DQ3 (**hecho e integrado: §9 y anexos E–F**; las reglas más allá del vistazo siguen sin probar y están marcadas así). (3) Integración de los dos informes (**hecha: v319**). (4) El total va a una carpeta del repo; **CC corre todos los pases en una sola pasada**, uno por uno. En paralelo: G4-M en CC. Pendientes arrastrados: T29, PR #91 y #92, ramas `stage-throne-*`, aprobación del Ancla v1, «commit», T43, T44, T46, T47.

---

## 8. Abierto (lo que este informe no resuelve)

1. **Generación ciega limpia** (mapa nuevo o viejo sin tocar → reglas congeladas → render → toma que nadie abrió). El mapa SNES de Najimi Tower está **reservado** para eso; el piso 3 (remake 2:16–2:59 del video; que la pieza «arriba a la derecha» del hack corresponda a ese piso es lectura de [R], sin confirmar) es el candidato que [U] confirmó (A110); no se abrió.
2. **Juez**: ¿alcanza la comparación ciega contra la toma real con subagentes del mismo modelo? Muestra pequeña (1–3 salas, 3 posiciones). No hay validación contra [U] ni contra una segunda familia de jueces.
3. **Ancla v1 sin aprobar** (7 sugerencias; adenda propuesta: Generación ciega + caminata + billboards ≤ 30 % contando el rojo; Ancla v2 propuesta: juez Forest + interiores y Cam 6 se queda). **Nada de esto se toca sin aprobación de [U].**
4. **Aspecto 2D-HD** (T15, T03): ¿dónde se prueba (visor / Unity URP)? Cambiaría el Ancla.
5. **G4-M** (cámaras): sin resultado; define si C5/C7/B6 son reales o artefactos de recorte.
6. **Ficha / pasada única de CC**: lista, no ejecutada. Quedan fuera B2 (transforma el pack), A8 (posible `src/`), B6, C5 y C7 más allá de A6.
7. **Exportación de los datos de CC** (T29, riesgo ALTO).
8. **Generalidad**: ningún referente que no sea DQ3 (OT2, DQ1&2, Triangle Strategy…) se ha medido; Octopath II y DQ1&2 están **suspendidos** por [U].
9. **Preguntas puntuales de [R] sin responder:** ¿se mantiene el vistazo con una **vecina real** frente a un **fondo construido**? (A337); ¿la masa lejana que gana en 0202 con V = 0,77 % es el cierre o el hecho de que haya algo? (A333); ¿una **columna suelta de borde** gana por separación o por posición? (T46); ¿la baranda en la franja media (A6) con encuadre propio mueve el juicio? (nunca probada).
10. **Pendientes de pulido del trono** (fuera del A-OK): estrado estrecho, peldaños 3 + 2, lámparas, estandartes con `z`, prisma blanco, vacío en x = 5 / 29 (T14 toca `frame.js`, PARADA).


---

## 9. Receta de generación para una sala nueva (integrado de `METODOLOGIA_GENERACION_DQ3_v318`)

Qué es: el orden de ejecución vigente para pasar de un mapa (pack de DAC, mapa viejo leído o mapa nuevo) a una escena 2D-HD en el modo 3. Solo el vistazo (paso 7) está probado por Generación (A336); lo demás es la mejor receta conocida y se prueba en la pasada única de CC con las fichas de `INFORME_METODO_TRUCOS.md`.

| # | Paso | Qué se hace | Estado | Fuente |
|---|---|---|---|---|
| 1 | Entrada | Pack de la sala inyectado por el arnés, sin tocar `src/`. Transitable estricto `!block && !void && region >= 0 && !nowalk`, la misma definición en reglas y medidas | REGLA | A236, A242 |
| 2 | Topología | Zonas verdes, azules y pasos. Si el mapa no trae relieve, se supone por reglas y se juzga por composición | REGLA | A107, A229 |
| 3 | Terreno | `terraces` 3, `subs` 2; peldaño ≤ 0,5 H (`terH`, «Measures in H» OFF); pasos ensanchados a ≥ 5 integrantes; escaleras en los pasos hacia el flujo (regla de plano v0: paso de ≤ 2 × ≤ 4–5 tiles → escalera de 5 peldaños) | REGLA (terreno) / HIPÓTESIS (escaleras por regla) | A343, A250, A194, A126, A133 |
| 4 | Orientación y hotspot | `orient` con POI primero; hotspot transitable, central salvo POI, sobre el eje de flujo | REGLA | A202, A206, A077 |
| 5 | Cámara | Cam 6; `tilesPerH` 1,5; `heroFrac` 0,10; `exag` 1; `vScale` 1 (declarados) | REGLA | A159, A250, A276, A345 |
| 6 | Cierres | `planes` con `noFront` (corte del lado de cámara). Con vecina: BACK como baranda de 1 H. Sin vecina: cierre ≥ 3 H + fondo construido (vano focal, ficha A4) | VALIDADO (con vecina) / HIPÓTESIS (sin vecina) | A336, A337 |
| 7 | Vistazo | Ventana con la vecina entera; Δ por V; **puerta de presencia** V(k4) ≥ 10 %. Si Δ = +4 H no alcanza, probar Δ negativo (la sala actual como mirador alto, caso 0137) | VALIDADO (regla) / puerta y Δ < 0 nuevos | A334–A336; INFORME_METODO_TRUCOS §1 |
| 8 | Rojo y trucos | Por fichas, cada uno con su puerta: A6 (línea media con su encuadre), A3a, A3b, C3, A4, C2/B1, B3, N1 | NUNCA PROBADO con ficha | INFORME_METODO_TRUCOS §4 |
| 9 | Control | Máscara, camino y meta iguales entre estados (o cambio declarado); hashes ×2; billboards + rojo ≤ 30 % | REGLA | reglas 9–10, A111 |
| 10 | Caminata | 9 posiciones del camino de props + k_mir: sin vacío, sin terreno ajeno, sin losas a media sala; meta en cuadro | REGLA | regla 4, A253 |
| 11 | Juicio | Fuera de CC: jueces ciegos contra la toma real (§2.2), solo sobre trucos PRESENTES | REGLA | A325, A357 |

Notas de la receta:
- El vistazo se presenta mal cuando la sala no tiene vecina cerca en la dirección de la cámara: en G1–G3 la sala 9 tuvo V 2,5 % y 0,4 %, es decir, la BASE no tenía su truco. Con la puerta del paso 7 esa sala se reemplaza por la siguiente candidata.
- En DAC el bloqueado más cercano al camino está a 3–12 tiles y de un solo lado (A288): los trucos de borde (A3a, A3b) buscan candidatos también FUERA de la sala, en el frente cortado, como overlay rojo con pie en azul. Que el visor lo permita sin `src/` se comprueba en el Pase 0 de la pasada única.
- Las salas DAC 84 y 65 están quemadas (A308): no se usan.

---

---

## Anexo A · Cifras clave (verificar antes de usar como compuerta)

| Qué | Cifra | Fuente |
|---|---|---|
| Billboards, toma 1 del Bosque / toma 2 del trono (D1) / trono final | 65 % / 81,4 % / ≤ 8,84 % | A036, A059 |
| Terreno 3D visible tras billboards y cintas (toma 1 / toma 2) | 24,3 % / 0,4 % | A036 |
| Vacío del fondo, trono | 15,7–19,3 % → ≤ 0,05 % (16 posiciones) | A054 |
| Vacío vs pitch (estrado): 25° / 33° / 37° | 15,7 / 12,1 / 10,1 % | T11 |
| Simetría, MAPA 1 | 56 → 0 baldosas asimétricas | A064 |
| Caminata del trono | 45 fotogramas, y = 23 → 5, sin saltos | A068 |
| Oclusión de alfombra | 0 baldosas > 25 % perdido en 8 posiciones (peor 24,6 %); a pasos de 0,5, 29 %; umbral 35 % | A057, A063 |
| Héroe: Bosque, Aliahan, 0202, 0137 | 0,09–0,13; ≈ 0,10; ≈ 0,072; ≈ 0,128 | A004, A042, A274 |
| Torre del Bosque B / B′ / fachada remake | 10,88 H / ≈ 3,5 H / ≈ 3,3 H (A013 escribe «≈ 2,4 veces»; la división da ≈ 3,3×: inconsistencia sin resolver) | A013, A017 |
| Escalera mapa viejo / remake | ≈ 1,4 H / ≈ 4,5 H (≈ 3,2×) | A141 |
| Notas de [U], 7 escenas (4c → 4f → 4g) | 5,43 → 6,07 → 8,14 | ANALISIS §3 |
| Notas de [U], 6 escenas (4c → 4h) | 6,00 → 6,75 → 9,17 → 9,42–9,50 | ANALISIS §3 |
| Recall / precisión de huella (5a) | F@5 0,78 / 0,98; F@9 0,60 / 0,86; I 0,77 / 0,83 | A228 |
| V(p) vecina, Pase 1, hotspot 0137 / 0202 | 17,5 % (toma 31,4 %) / 0,77 % | A331 |
| Pase 2, V de B (k0 / k4 / k8) y Δ | ≈ 11,9 / 15,7 / 32,3 %; Δ = 4,0 H | A335 |
| Votos | P1 3/3 + 3/3; P2 9–0 (B > K, B > A) | A332, A336 |
| G1 / G2 / G3 | TODO > BASE 2/9; BASE > TODO 8/9; TODO 5/9 (E1 3/9, E2 0/9, E3 2/9) | A341, A345, A351 |
| Calibración | V2 3/3 ≥ V1 3 o 2 > DAC 84 1/3; control 0202 2/3, 0137 0/3 | A320 |
| T42 | D: 5 de 6 celdas; J2 5/9 → 8–9/9 con muros 5 H; J1 3/9 → 8–9/9 con cinta | A300, A301, A304 |
| Hashes de congelación (ejemplos) | T42 `154ce5fc…`; G4-M `ce164a11…` → `e52a15ce…`; G2 `a3682659…`, `74593858…`; P2 `f4cfd000…`; `DEFINICIONES_T26_v311` `3eafd0ee…`; predicción de la calibración `6811794a…` | A299, A354, A343, A334, A316, `HASHES_v311` |

## Anexo B · Índice de fuentes (en el Proyecto EvoDun, carpeta `claude/`)
- **Estado y marcas:** documento de estado (Ancla, Estado vigente, Reglas y ganancias, Metodología, Registro A001–A357, Tangentes T01–T47, Bitácora).
- **Brújula y plantilla:** `BRUJULA_modo3.md`, `PLANTILLA_escena_dorada_modo3.md`, `MVP_viewer_2dhd.md`.
- **Bosque:** v177–v189, `stage_m3_m4c_forest_step0_go.md`, `stage_m3_m4c_capas_go.md`.
- **Trono:** v189–v227; `next_crystallizer_design_pass_v226.md`; `ANALISIS_movimiento_trono_dq3_aliahan.md`, `ANALISIS_movimiento_trono_dq2.md`; `stage_m3_trono_*`.
- **Torre del Soñador / M6:** v228–v300, `stage_m6_*_go.md`, `ANALISIS_pases_M6_metodologia.md`, `next_crystallizer_design_pass_v298.md`.
- **DAC y T42:** v301–v310 (`next_crystallizer_design_pass_v310.md`), `T42_dac2_medidas.md`, `CALIF_*`, `RUBRICA_juicio_v305.md`, `stage_dac_*`.
- **Calibración:** `DEFINICIONES_T26_v311.md`, `PREDICCION_calib_v311.md`, `RESULTADO_calib_v311.md`.
- **R15:** `PREDICCION_R15_P1_v312.md`, `RESULTADO_R15_P1_v312.md`, `PREDICCION_R15_P2_v313.md`, `RESULTADO_R15_P2_v313.md`, `TRUCOS_composicion_v314.md`, `PLAN_R15_grupos_v314.md`, `PREDICCION_/RESULTADO_R15_G1_v314`, `G2_v315`, `G3_v316`, `PLAN_R15_G4_camaras_v316.md`, `stage_r15_g4m_*`, `INFORME_METODO_TRUCOS_v318.md`, `HASHES_v31x.sha256`.

## Anexo C · Ficha de truco (11 campos, A357)
1 **Identidad** (ID, nombre, grupo, origen) · 2 **Qué es** (una frase sin jerga + recorte de la toma de referencia; sin recorte → HIPÓTESIS, no se prueba) · 3 **Por qué funciona** (mecanismo y parte del Ancla que sirve) · 4 **Objetivo en pantalla con números** (franja en % del alto y ancho, % del cuadro, forma, posiciones k0/k4/k8; también lo prohibido) · 5 **Precondiciones de escena** (geometría necesaria y cómo buscarla en el mapa) · 6 **Receta de construcción** (pasos en orden, parámetros con rango, encuadre si lo exige, orden respecto de otros trucos) · 7 **Puerta de presencia** (medida que CC calcula en cada render; ajusta dentro del rango declarado; si no llega: AUSENTE) · 8 **Si el mapa no lo permite** (omitir sala, cambiar sala; nunca forzar sobre suelo transitable ni inventar geometría) · 9 **Prueba y lectura** (TODO contra TODO sin el truco, umbral, palabras esperadas en las razones de un juez que lo percibió; si ninguna lo nombra: «no percibido», no «no aporta») · 10 **Interacciones** · 11 **Estado** (VISTO · HIPÓTESIS · PROBADO BIEN · PROBADO MAL (pedido defectuoso) · NUNCA PROBADO).
Reglas del pase: hoja de presencia antes de los jueces; pares idénticos por hash = AUSENTE aparte; un pase negativo con trucos AUSENTES o con pedido defectuoso no cierra el truco; la ficha la escribe [R]; CC la ejecuta sin interpretar y **PARA** si no alcanza.
**Aviso de nomenclatura:** «A1–A9» (alarmas de D1, §3.6), «A1–A14» (alarmas de la PLANTILLA), «A1–A8, B1–B7, C1–C7, N1» (IDs de trucos) y «A001–A357» (marcas del Registro) son **cuatro numeraciones distintas**.
**Convenciones de posición:** k0, k4, k8 = `camino[floor(i·(N−1)/8 + 0,5)]` de los *props*; k_mir = posición transitable sobre el eje con V(p) máximo a ≤ 4 tiles del borde de fondo.

## Anexo D · Texto del juez y esqueleto de pedido a CC
**Juez (P1, vigente):** «La imagen R es una referencia. Las imágenes 1 y 2 son maquetas sin texturas. ¿Cuál de las dos, 1 o 2, se parece más a R en COMPOSICIÓN: qué se ve en cada franja de profundidad, qué tapa a qué, qué tan lejos se ve y dónde queda el personaje? Ignora color, luz, texturas y detalle. Responde 1 o 2 y una línea con la razón.»
**Pedido a CC (esqueleto):** (1) Pregunta de una línea y una variable. (2) Alcance: solo datos y hooks de página; `src/` intacto; archivos prohibidos; PARADAS enumeradas (lo que el mecanismo no da: se para y se dice). (3) Fuentes y reglas encendidas (`orient`, `planes`, `props`, `volumes`) y valores declarados de `vScale`, `exag`, `terH`, `tilesPerH`, `terraces`, `subs`. (4) Criterios y predicciones congelados con hash. (5) Medidas a entregar y su definición operativa (misma definición de transitable que las reglas). (6) Hashes ×2 antes y después. (7) Qué NO se prueba. (8) Entrega ≤ 1,5 páginas + zip de PNG limpios + hoja de presencia; nada de hojas con juicio de composición. (9) Si algo no se entiende, **PARAR y decir qué falta**.

## Anexo E · Alturas medidas en tomas (en H)

| Pieza | Altura | Fuente |
|---|---|---|
| Baranda 0202 | 1,10 | A210 |
| Postes de baranda 0137 | 1,56 | A210 |
| Balaustrada 0149 | 0,70 | A210 |
| Muro 0149 | 1,30 | A210 |
| Pared del fondo 0206 | 1,20 | A210 |
| Pilares de escalera 0206 / 0214 | 3,7 / 5,0 | A152, A155 |
| Pilares cercanos 0202 | ≈ 7–10 (± 30 %), salen del cuadro | A155 |
| Estatua del dragón (toma 0202) | 3,9 | A212 |
| Muros de cierre del trono / pilares | 8 / 5 | A284 |

Uso: barandas y parapetos entre 0,7 y 1,6 H; los bordes de isla fallan sobre todo en altura (A210). Las alturas van por pieza en el dato, con `exag` 1 (dato = aparente ÷ vScale).

## Anexo F · Patrones de composición de las tomas 0137 y 0202

Lectura de [R] a ojo sobre los cuadros 1280×720 (± 0,02; CC debe re-medirlos con cajas antes de usarlos como compuerta). Coordenadas en fracción del cuadro (x izquierda → derecha, y arriba → abajo).

**0137** (héroe cerca del borde norte): héroe x ≈ 0,61–0,65, pies y ≈ 0,74, alto ≈ 0,128 · balaustrada continua x 0,30–1,00, y 0,42–0,57, postes cada ≈ 0,25 del ancho · estatua del dragón en primer plano x 0,00–0,20, y 0,40–0,95 · dos columnas con farol x 0,00–0,20 que salen por arriba hasta y ≈ 0,45 · ventana luminosa x 0,48–0,62, y 0,05–0,21 · pentagrama junto al héroe x 0,75–1,00, y 0,62–0,78 · escalera que baja x 0,30–0,52, y 0,53–0,78 · masa oscura en la esquina inferior derecha · centro (x 0,30–0,75, y 0,20–0,60) abierto hasta el fondo.

**0202** (héroe más allá del pretil): héroe x ≈ 0,50, y ≈ 0,42–0,52, alto ≈ 0,072 · par de columnas-búho x 0,35–0,46 y 0,65–0,77 que salen por arriba, hueco ≈ 0,19 del ancho (≈ 5 integrantes) · escalera sobre el eje x 0,45–0,66, y 0,62–0,90 · pretil y ≈ 0,53–0,60 de lado a lado · plintos de esquina x 0,19–0,34 y 0,80–0,96, y 0,55–1,00 · pentagrama bajo el héroe · balaustrada lejana y ≈ 0,10–0,17 · dragón sobre tarima arriba a la izquierda.

**Patrones comunes:** (1) línea de nivel horizontal continua entre y 0,42 y 0,60, de ≥ 70 % del ancho; (2) masas altas en los bordes laterales o en un par simétrico que enmarca al héroe sin taparlo; (3) masas bajas que cortan las esquinas inferiores; (4) centro abierto hasta un fondo lejano con algo luminoso o escalonado arriba; (5) la calcomanía marca dónde está el héroe, no el camino.

Contexto externo: el remake conserva la disposición de los edificios y cambia la escala y las distancias del mapa ([PlayStation Blog, 2024](https://blog.playstation.com/2024/11/08/dragon-quest-iii-hd-2d-remake-interview-how-the-classic-rpg-was-revamped-for-its-ps5-debut/)); el DoF y el tilt-shift son parte del estilo pero quedan fuera del Ancla ([Wikipedia, HD-2D](https://en.wikipedia.org/wiki/HD-2D)).
