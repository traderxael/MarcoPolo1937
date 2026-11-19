# 卢沟桥 1937 — La Defensa del Puente

> **▶ Jugar ahora en el navegador (GitHub Pages):** https://traderxael.github.io/MarcoPolo1937/

FPS de campaña en Three.js ambientado en el **Incidente del Puente de Marco Polo** (卢沟桥事变, 7 de julio de 1937), hecho que inició la guerra total entre China y Japón.

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
|---|---|
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
| E | Usar caja de suministros (salud, blindaje, munición y equipo táctico) |
| 1 / 2 / 3 / 4 o Rueda | Fusil automático Chiang Kai-shek (30/120) / Mauser C96 / Dadao / Subfusil **MP-18** (en Campaña o desbloqueado/mejorado hasta nivel 3 en la Tienda de Supervivencia) |
| Mayús | Correr |
| M | Silenciar / activar audio |
| Esc | Pausa (sensibilidad fina, calidad gráfica, volumen Música/SFX, contador FPS, controles táctiles y reinicio) |
| Controles táctiles | En móvil/tablet (o activables manualmente desde Pausa): joystick virtual de movimiento y botones de disparo, mira, salto, recarga, granada, molotov, curación, cámara `[V]` y órdenes `[T]` |
| Mando (Gamepad) | Sticks mover/apuntar, RT disparar, LT apuntar, A saltar/MG, LB cámara 1.ª/3.ª, RB granada, X recargar, Y armas, B agacharse |

## Características principales

- **Post-procesado HDR offline y PBR procedural (`src/postfx.js`, `src/textures.js`):** renderizado con `ACESFilmicToneMapping`, pase de Bloom selectivo (`HalfFloatType`) con umbral, viñeta y grano sutiles sin dependencias externas, texturas PBR procedurales (`map`, `roughnessMap`, `bumpMap`) con charcos/humedad dinámica durante la lluvia y cielo shader + paletas atmosféricas progresivas por capítulo.
- **Verticalidad y destrucción táctica del campo de batalla:** rampa transitable hasta las **almenas superiores de la puerta de Wanping**, **puente ferroviario paralelo norte** con pasarela lateral de enlace, **6 barricadas de sacos destructibles** en dos fases visuales, **4 barriles de munición explosivos** y cráteres persistentes reutilizables.
- **Arsenal ampliado, parry con Dadao y Tienda de Supervivencia:** subfusil **MP-18 (`[4]`)** de alta cadencia, **Cóctel Molotov (`[X]`)** incendiario, **blindaje táctico** (absorbe parte del daño antes de afectar a la salud), **vendaje rápido (`[H]`)**, apoyo de **Mortero Aliado (`[B]` / `[5]`)**, parry defensivo con **Dadao (`Clic derecho` / `[Q]`)** capaz de reflejar estocadas de oficiales con katana, y **Tienda de Supervivencia** entre oleadas para mejorar el MP-18 y reponer blindaje/munición/apoyos.
- **Escuadrón táctico (`[T]`) e IA enemiga especializada:** rueda radial `[T]` para ordenar a tus aliados del 29.º Ejército (*Cubrirse*, *Avanzar*, *Mantener posición* o *Fuego concentrado*). La IA japonesa reacciona al fuego de supresión (agachándose o flanqueando) e incluye **granaderos Tipo 97**, **morteros enemigos** con anillos de aviso en el suelo, **oficiales con katana**, **cascos voladores** en tiros a la cabeza y el jefe **Tanqueta Tipo 94 multiparte** (orugas, visor, torreta y casco dañables por separado con indicadores en el HUD).
- **Audio posicional 3D, Mapa Táctico 1937 y Medallas de Honor:** efectos espaciales 3D con Web Audio (`PannerNode`), corneta de carga (`冲锋号`), silbato de oficiales y estática de radio; **Mapa Táctico de 1937** animado en canvas antes de cada capítulo y en la tienda; y **6 Medallas de Honor** persistentes en `localStorage` (`mp1937_records_v1`).
- **Disparo automático, mira dinámica y números flotantes de daño:** el fusil y el subfusil MP-18 disparan ráfagas continuas al mantener pulsado el clic izquierdo con una retícula dinámica de 4 marcas que se abre al disparar, correr o saltar y se cierra al agacharse o apuntar (ADS), acompañada de números flotantes de daño en el mundo 3D (dorados en tiros a la cabeza y visor crítico).
- **Control FPS clásico y cámara dual `[V]` + salto `[Espacio]` + controles táctiles:** Pointer Lock con `unadjustedMovement` cuando está disponible, filtrado de picos bruscos al fijar el puntero, suavizado sin latencia y refijado directo al hacer clic sobre el lienzo. Pulsa `V` para alternar entre primera persona y tercera persona sobre el hombro (con colisión de cámara contra parapetos) y activa controles táctiles en móviles o desde el menú de Pausa.
- **Modos, selector de capítulos, dificultad y récords:** **Campaña histórica (4 capítulos)** con selector de capítulo inicial o **Supervivencia infinita (无尽抗战)**, tres dificultades (*Recluta*, *Soldado*, *Veterano 1937*), puntuación en vivo, rangos (`D`–`S`), Medallas de Honor y mejores marcas guardadas localmente (`localStorage`).
- **Audio procedural, presets de rendimiento y soporte de mando:** percusión de guerra y motivos pentatónicos Web Audio con volumen independiente de música y efectos, calidad gráfica seleccionable (*Fluido* / *Equilibrado* / *Alto*), contador FPS en pantalla y soporte nativo para mandos (`Gamepad API`).
- **Campaña completa en 4 capítulos (7–28 de julio de 1937) + Epílogo 1937–1945:**
  1. *Capítulo 1 (7 jul, 23:40):* el pretexto del soldado Shimura y los primeros disparos frente a Wanping.
  2. *Capítulo 2 (8 jul, 04:50):* bombardeo de artillería al alba y resistencia del mayor Jin Zhenzhong.
  3. *Capítulo 3 (9 jul, 01:15):* contraataque nocturno del Escuadrón de Dadao (大刀队) en el puente.
  4. *Capítulo 4 (28 jul, 06:10):* ruptura de la tregua, sacrificio de los generales Tong Linge y Zhao Dengyu en Nanyuan y defensa final.
  - **Crónica Histórica (1937–1945):** dossier cronológico accesible desde el menú inicial y el epílogo hasta la rendición japonesa en Beiping el 10 de octubre de 1945.
- **Cinemáticas 3D en tiempo real:** secuencia de apertura sobre el río Yongding y Wanping, transiciones cinematográficas con bombardeo entre capítulos y epílogo histórico de tres actos (saltables con `Espacio`).
- **Combate táctico:** apuntado de precisión (ADS) con zoom y reducción de dispersión, cobertura agachado tras los sacos de arena, radar táctico del puente en el HUD, despachos históricos por radio a mitad de cada capítulo y caja de suministros reabastecible.
- **Aliados y arquetipos enemigos:** dos defensores chinos del 29.º Ejército cubren el puente abriendo fuego contra los atacantes (uno avanza en el contraataque del Capítulo 3); las fuerzas japonesas incluyen fusileros, asaltantes a la bayoneta y oficiales.
- **Atmósfera y audio:** bombardeo de artillería con destellos y temblor de cámara, sonido ambiente nocturno continuo y efectos de disparo, recarga, impactos y cornetas sintetizados vía Web Audio API.

## Fidelidad histórica

- **Escenario:** puente de Lugouqiao (Marco Polo) sobre el río Yongding y la ciudad amurallada de Wanping, con sus leones de piedra.
- **Bando del jugador:** 219.º Regimiento, 37.ª División, 29.º Ejército del Ejército Nacional Revolucionario, al mando del coronel Ji Xingwen (吉星文).
- **Armamento:** fusil Chiang Kai-shek (中正式, copia del Mauser Standardmodell de 7,92 mm), pistola Mauser C96 y dadao (大刀), arma cuerpo a cuerpo característica de la 29.ª Army.
- **Desenlace:** inalterable. El puente y Wanping cayeron; Beiping (Pekín) se rindió el 29 de julio y Tianjin el 30 de julio de 1937. Comenzaba la Guerra de Resistencia contra la Agresión Japonesa (抗日战争), que duró hasta 1945.
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
- **Arquitectura modular ES nativos sin bundler (`src/`):** el código se organiza en módulos nativos del navegador (`src/main.js`, `src/config.js`, `src/state.js`, `src/textures.js`, `src/postfx.js`, `src/pools.js`, `src/world.js`, `src/audio.js`, `src/squad.js`, `src/weapons.js`, `src/enemies.js`, `src/hud.js` y `src/styles.css`) compatibles 100 % sin pasos de compilación con `ABRIR_JUEGO.bat` y GitHub Pages.
- **Rendimiento en tiempo real y Dynamic Resolution Scaling (DRS):** los 30 leones de piedra del puente utilizan **`THREE.LOD`** (modelo GLB de alta resolución solo a menos de 15 m y malla ligera a distancia), los soldados proyectan sombras mediante cilindros ligeros de respaldo (`SHADOW_PROXY_GEO`), **`InstancedMesh` y pools reutilizables** (`src/pools.js`) gestionan trazadoras, casquillos, chispas, luz de fogonazo y cráteres con mínimas llamadas de dibujo, el agua y la lluvia se animan en GPU (`onBeforeCompile`), y la resolución se escala dinámicamente (**DRS**) en los presets *Fluido* (`low`) y *Equilibrado* (`med`) para sostener ~60 FPS.

La estructura del puente, arcos, muros, río y sacos de arena sigue siendo geometría procedural de Three.js. El juego funciona sin conexión una vez descargados `three.module.js`, `loaders/GLTFLoader.js`, `utils/BufferGeometryUtils.js` y la carpeta `models/`. Si algún GLB falla, se mantiene el modelo procedural de respaldo.
