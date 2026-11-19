# 卢沟桥 1937 — La Defensa del Puente

> **▶ Jugar ahora en el navegador (GitHub Pages):** <https://traderxael.github.io/MarcoPolo1937/>

FPS de campaña histórica en Three.js ambientado en la **Guerra de Resistencia (1937–1945)**: comienza en el **Incidente del Puente de Marco Polo** (卢沟桥事变, 7 de julio de 1937) y continúa en un **Modo Historia tipo Call of Duty** hasta la expulsión de las fuerzas invasoras y la victoria de 1945.

## Cómo abrirlo

Doble clic en `ABRIR_JUEGO.bat`. Se inicia un servidor local y se abre el juego en el navegador.
Si prefieres hacerlo a mano:

```
cd "C:\Users\USUARIO\Desktop\MarcoPolo1937"
python -m http.server 8124
```

y abre `http://localhost:8124`.

## Controles

| Tecla / Entrada | Acción |
| --- | --- |
| WASD | Moverse |
| Espacio | Saltar (sobre sacos de arena/obstáculos) · En cinemáticas: saltar escena |
| V | Alternar cámara **1.ª persona** / **3.ª persona sobre el hombro** (viendo a tu soldado chino) |
| Ratón | Mirar (Pointer Lock clásico de FPS con filtrado de picos y suavidad; clic en pantalla si hace falta refijar) |
| Mantener clic izquierdo | Disparo automático continuo en fusil / ataque continuo con dadao / ráfaga en ametralladora |
| Clic derecho / Q | Apuntar con precisión (ADS, cierra la mira y acerca la cámara en 1.ª y 3.ª persona); con **Dadao `[3]`**, parry defensivo / ataque pesado que refleja estocadas de oficiales con katana |
| G | Lanzar granada de palo Tipo 24 (eficaz contra grupos y la tanqueta) |
| X | Lanzar Cóctel Molotov (crea una zona incendiaria persistente con daño continuo) |
| H | Aplicar vendaje rápido (`+40` salud) |
| B / 5 | Solicitar ataque de Mortero Aliado sobre el punto de mira |
| T | Rueda radial de órdenes al escuadrón (`1` Cubrirse, `2` Avanzar, `3` Mantener posición, `4` Fuego concentrado) |
| F | Montar / soltar ametralladora fija Tipo 24 (con escudo frontal y barra de calor) |
| R | Recargar |
| C | Agacharse / cubrirse tras los sacos de arena (reduce dispersión) |
| E | Usar caja de suministros, recoger botín de campaña, colocar cargas de sabotaje o izar la bandera en misiones de historia |
| I / Tab | Abrir / cerrar Inventario de Campaña / Mochila táctica (armas, consumibles, suministros saqueados y transmisión de inteligencia) |
| 1 / 2 / 3 / 4 o Rueda | Fusil automático Chiang Kai-shek (30/120) / Mauser C96 / Dadao / Subfusil **MP-18** (en Campaña o desbloqueado/mejorado hasta nivel 3 en la Tienda de Supervivencia) |
| Mayús | Correr |
| M | Silenciar / activar audio |
| Esc | Pausa (sensibilidad fina, calidad gráfica, volumen Música/SFX, contador FPS, controles táctiles y reinicio) |
| Controles táctiles | En móvil/tablet (o activables manualmente desde Pausa): joystick virtual de movimiento y botones de disparo, mira, salto, recarga, granada, molotov, curación, cámara `[V]`, órdenes `[T]` e inventario `MOCH` |
| Mando (Gamepad) | Sticks mover/apuntar, RT disparar, LT apuntar, A saltar/MG, LB cámara 1.ª/3.ª, RB granada, X recargar, Y armas, B agacharse, Select/Back inventario |

## Características principales

- **Post-procesado HDR offline y PBR procedural (`src/postfx.js`, `src/textures.js`):** renderizado con `ACESFilmicToneMapping`, pase de Bloom selectivo (`HalfFloatType`) con umbral, viñeta y grano sutiles sin dependencias externas, texturas PBR procedurales (`map`, `roughnessMap`, `bumpMap`) con charcos/humedad dinámica durante la lluvia y cielo shader + paletas atmosféricas progresivas por capítulo.
- **Verticalidad y destrucción táctica del campo de batalla:** rampa transitable hasta las **almenas superiores de la puerta de Wanping**, **puente ferroviario paralelo norte** con pasarela lateral de enlace, **6 barricadas de sacos destructibles** en dos fases visuales, **4 barriles de munición explosivos** y cráteres persistentes reutilizables.
- **Arsenal ampliado, parry con Dadao y Tienda de Supervivencia:** subfusil **MP-18 (`[4]`)** de alta cadencia, **Cóctel Molotov (`[X]`)** incendiario, **blindaje táctico** (absorbe parte del daño antes de afectar a la salud), **vendaje rápido (`[H]`)**, apoyo de **Mortero Aliado (`[B]` / `[5]`)**, parry defensivo con **Dadao (`Clic derecho` / `[Q]`)** capaz de reflejar estocadas de oficiales con katana, y **Tienda de Supervivencia** entre oleadas para mejorar el MP-18 y reponer blindaje/munición/apoyos.
- **Inventario de Campaña (`[I]` / `[Tab]`) y botín 3D en el puente (`src/inventory.js`):** gestión unificada de armamento, equipo táctico y mochila de `12` unidades con `6` suministros de campo recolectables de enemigos, tanqueta y caja de suministros (`Ración de Campaña`, `Placa de Blindaje`, `Cartuchera de Munición`, `Bengala Táctica`, `Tónico del 29.º Ejército` y `Documento Táctico` transmisible por `+250 PTS`), opción de soltar objetos en el puente y diálogo `<dialog>` accesible compatible con teclado, ratón, mando y táctil.
- **Escuadrón táctico (`[T]`) e IA enemiga especializada:** rueda radial `[T]` para ordenar a tus aliados del 29.º Ejército (*Cubrirse*, *Avanzar*, *Mantener posición* o *Fuego concentrado*). La IA japonesa reacciona al fuego de supresión (agachándose o flanqueando) e incluye **granaderos Tipo 97**, **morteros enemigos** con anillos de aviso en el suelo, **oficiales con katana**, **cascos voladores** en tiros a la cabeza y el jefe **Tanqueta Tipo 94 multiparte** (orugas, visor, torreta y casco dañables por separado con indicadores en el HUD).
- **Modo Historia 1937–1945 tipo Call of Duty en 8 capítulos y 5 escenarios 3D (`src/story.js`, `src/world.js`):** campaña completa desde el Incidente del Puente de Marco Polo (Capítulos 1–4 en Lugouqiao) hasta la batalla del **Almacén Sihang en Shanghái 1937**, la defensa de **Tai'erzhuang 1938**, las trincheras lluviosas de **Changsha 1941–42** y la ofensiva final en **Hunan Occidental / Victoria 1945**. Incluye dossier de sala de guerra con **Mapa de China 1937–1945** y efecto máquina de escribir, subtítulos narrativos en vivo, marcador de objetivo 3D (`◆`), barra nativa `<progress>` de misión y fases encadenadas (destrucción de nido de ametralladora enemigo, sabotaje con `[E]` y aturdimiento *shellshock*, resistencia cronometrada, avance del escuadrón aliado, derrota de la Tanqueta Tipo 94 e izado de la bandera de la victoria con `[E]`).
- **Audio posicional 3D, Mapa Táctico y 8 Medallas de Honor:** efectos espaciales 3D con Web Audio (`PannerNode`), corneta de carga (`冲锋号`), silbato de oficiales, tictac/detonación de cargas y fanfarria de victoria; **Mapa Táctico** animado en canvas antes de cada capítulo y en la tienda; y **8 Medallas de Honor** persistentes en `localStorage` (`mp1937_records_v1`, incluyendo *Defensor de Sihang* y *China Liberada 1937–1945*).
- **Disparo automático, mira dinámica y números flotantes de daño:** el fusil y el subfusil MP-18 disparan ráfagas continuas al mantener pulsado el clic izquierdo con una retícula dinámica de 4 marcas que se abre al disparar, correr o saltar y se cierra al agacharse o apuntar (ADS), acompañada de números flotantes de daño en el mundo 3D (dorados en tiros a la cabeza y visor crítico).
- **Control FPS clásico y cámara dual `[V]` + salto `[Espacio]` + controles táctiles:** Pointer Lock con `unadjustedMovement` cuando está disponible, filtrado de picos bruscos al fijar el puntero, suavizado sin latencia y refijado directo al hacer clic sobre el lienzo. Pulsa `V` para alternar entre primera persona y tercera persona sobre el hombro (con colisión de cámara contra parapetos) y activa controles táctiles en móviles o desde el menú de Pausa.
- **Modos, selector de capítulos, dificultad y récords:** **Campaña histórica (8 capítulos / 5 frentes)** con selector de capítulo inicial o **Supervivencia infinita (无尽抗战)**, tres dificultades (*Recluta*, *Soldado*, *Veterano 1937*), puntuación en vivo, rangos (`D`–`S`), Medallas de Honor y mejores marcas guardadas localmente (`localStorage`).
- **Audio procedural, presets de rendimiento y soporte de mando:** percusión de guerra y motivos pentatónicos Web Audio con volumen independiente de música y efectos, calidad gráfica seleccionable (*Fluido* / *Equilibrado* / *Alto*), contador FPS en pantalla y soporte nativo para mandos (`Gamepad API`).
- **Campaña completa 1937–1945 en 8 capítulos + Epílogo:**
  1. *Capítulo 1 (7 jul 1937, 23:40 — Lugouqiao):* el pretexto del soldado Shimura y los primeros disparos frente a Wanping.
  2. *Capítulo 2 (8 jul 1937, 04:50 — Lugouqiao):* bombardeo de artillería al alba y resistencia del mayor Jin Zhenzhong.
  3. *Capítulo 3 (9 jul 1937, 01:15 — Lugouqiao):* contraataque nocturno del Escuadrón de Dadao (大刀队) en el puente.
  4. *Capítulo 4 (28 jul 1937, 06:10 — Lugouqiao):* ruptura de la tregua, sacrificio de los generales Tong Linge y Zhao Dengyu y defensa final del paso.
  5. *Capítulo 5 (27 oct 1937 — Shanghái, Almacén Sihang):* destrucción del nido de ametralladora en las calles en ruinas, sabotaje de munición imperial `[E]` y defensa de los «Cuatrocientos Héroes».
  6. *Capítulo 6 (24 mar 1938 — Tai'erzhuang):* limpieza de la muralla en ruinas, sabotaje de piezas de artillería y contraataque casa por casa por la primera gran victoria china.
  7. *Capítulo 7 (sep 1941 – ene 1942 — Changsha):* defensa de las trincheras bajo lluvia nocturna y ruptura del cerco con el 9.º Teatro de Operaciones.
  8. *Capítulo 8 (1945 — Hunan Occidental y Victoria Final):* neutralización del último depósito y Tanqueta Tipo 94, e izado de la bandera nacional (`[E]`) celebrando el triunfo final y la expulsión del invasor.
  - **Crónica Histórica (1937–1945):** dossier cronológico accesible desde el menú inicial y el epílogo hasta la rendición japonesa en Beiping el 10 de octubre de 1945.
- **Cinemáticas 3D en tiempo real:** secuencia de apertura sobre el río Yongding y Wanping, transiciones cinematográficas con bombardeo entre capítulos y epílogo histórico de tres actos (saltables con `Espacio`).
- **Combate táctico:** apuntado de precisión (ADS) con zoom y reducción de dispersión, cobertura agachado tras los sacos de arena, radar táctico del puente en el HUD, despachos históricos por radio a mitad de cada capítulo y caja de suministros reabastecible.
- **Aliados y arquetipos enemigos:** dos defensores chinos del 29.º Ejército cubren el puente abriendo fuego contra los atacantes (uno avanza en el contraataque del Capítulo 3); las fuerzas japonesas incluyen fusileros, asaltantes a la bayoneta y oficiales.
- **Atmósfera y audio:** bombardeo de artillería con destellos y temblor de cámara, sonido ambiente nocturno continuo y efectos de disparo, recarga, impactos y cornetas sintetizados vía Web Audio API.

## Fidelidad histórica

- **Escenario:** puente de Lugouqiao (Marco Polo) sobre el río Yongding y la ciudad amurallada de Wanping, con sus leones de piedra.
- **Bando del jugador:** 219.º Regimiento, 37.ª División, 29.º Ejército del Ejército Nacional Revolucionario, al mando del coronel Ji Xingwen (吉星文).
- **Armamento:** fusil Chiang Kai-shek (中正式, copia del Mauser Standardmodell de 7,92 mm), pistola Mauser C96 y dadao (大刀), arma cuerpo a cuerpo característica de la 29.ª Army.
- **Desenlace:** fiel a la historia documentada. El puente y Wanping cayeron en julio de 1937 (Beiping el 29 de julio y Tianjin el 30 de julio), pero la resistencia nacional continuó en Shanghái, Tai'erzhuang y Changsha durante ocho años de guerra hasta la victoria china y la expulsión definitiva de las fuerzas invasoras en 1945.
- La narración sigue la historiografía china del conflicto sin alterar los hechos documentados.

## Animación ("vida") de los personajes

Los modelos GLB son mallas únicas sin esqueleto, así que se animan por **deformación procedural continua en la GPU** (`makeLiving` + `onBeforeCompile`): mediante transiciones suaves (`smoothstep` y pesos laterales continuos en el vertex shader), las piernas se balancean al caminar, el torso respira, se inclina al apuntar y se estremece al recibir impactos sin cortes ni rotura de triángulos.

- Enemigos: orientación corregida hacia el frente, caminata con balanceo, pausa breve de disparo con fogonazo en la boca del fusil (`d < 72 m`), postura de apuntado, estremecimiento al ser heridos y caída gradual al morir.
- Defensores chinos: respiración continua, giro suave hacia el enemigo más cercano y fuego de cobertura; el caído permanece tumbado.

## Modelos 3D

Todos son **GLB generados con Hyper3D Rodin** (tier Gen-2.5-Low, 0,5 créditos cada uno), en `models/`:

- `soldado_japones.glb` — infantería japonesa (enemigos).
- `soldado_chino.glb` — soldado del 29.º Ejército junto a la posición del jugador.
- `leon_piedra.glb` — león guardián del puente de Lugouqiao.
- `torre_wanping.glb` — torre de la puerta de Wanping.
- `mauser_c96_ref.glb` — pistola Mauser C96, generada con **image-to-3D a partir de una foto real** de Wikimedia Commons (`referencias/mauser_c96_ref.jpg`).
- `dadao_ref.glb` — dadao, generado con **image-to-3D a partir de un dibujo histórico** (`referencias/dadao_ref.jpg`).
- `fusil_chiang.glb` — fusil Chiang Kai-shek (viewmodel). Se probaron dos versiones con foto real, pero salían peor visualmente, así que se conservó esta.

## Optimización

Los GLB se optimizaron con **glTF Transform** (`optimize --compress meshopt --simplify-ratio 0.1 --texture-size 512`): geometría simplificada, compresión Meshopt y texturas reducidas a 512 px. El juego carga `libs/meshopt_decoder.module.js` y llama a `loader.setMeshoptDecoder(...)` para decodificarlos.

- Modelos activos: **15,3 MB** (antes 130,6 MB → **-88 %**).
- Los originales sin optimizar se conservan en `models/_originales/` (169 MB) por si se quiere revertir.
- **Arquitectura modular ES nativos sin bundler (`src/`):** el código se organiza en módulos nativos del navegador (`src/main.js`, `src/config.js`, `src/state.js`, `src/textures.js`, `src/postfx.js`, `src/pools.js`, `src/world.js`, `src/story.js`, `src/audio.js`, `src/squad.js`, `src/weapons.js`, `src/enemies.js`, `src/hud.js`, `src/inventory.js` y `src/styles.css`) compatibles 100 % sin pasos de compilación con `ABRIR_JUEGO.bat` y GitHub Pages.
- **Rendimiento en tiempo real y Dynamic Resolution Scaling (DRS):** los 30 leones de piedra del puente utilizan **`THREE.LOD`** (modelo GLB de alta resolución solo a menos de 15 m y malla ligera a distancia), los soldados proyectan sombras mediante cilindros ligeros de respaldo (`SHADOW_PROXY_GEO`), **`InstancedMesh` y pools reutilizables** (`src/pools.js`) gestionan trazadoras, casquillos, chispas, luz de fogonazo y cráteres con mínimas llamadas de dibujo, el agua y la lluvia se animan en GPU (`onBeforeCompile`), y la resolución se escala dinámicamente (**DRS**) en los presets *Fluido* (`low`) y *Equilibrado* (`med`) para sostener ~60 FPS.

La estructura del puente, arcos, muros, río y sacos de arena sigue siendo geometría procedural de Three.js. El juego funciona sin conexión una vez descargados `three.module.js`, `loaders/GLTFLoader.js`, `utils/BufferGeometryUtils.js` y la carpeta `models/`. Si algún GLB falla, se mantiene el modelo procedural de respaldo.
