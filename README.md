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
| Ratón | Mirar (requiere clic en "COMIENZA LA DEFENSA" para fijar el puntero) |
| Clic izquierdo | Disparar / atacar con dadao / ráfaga en ametralladora |
| Clic derecho / Q | Apuntar con precisión (ADS) |
| G | Lanzar granada de palo Tipo 24 (eficaz contra grupos y la tanqueta) |
| F | Montar / soltar ametralladora fija Tipo 24 (con escudo frontal y barra de calor) |
| R | Recargar |
| C | Agacharse / cubrirse tras los sacos de arena |
| E | Usar caja de suministros (salud, munición y granadas) |
| 1 / 2 / 3 o Rueda | Fusil Chiang Kai-shek / Mauser C96 / dadao |
| Mayús | Correr |
| M | Silenciar / activar audio |
| Espacio / Enter | Saltar cinemática 3D |
| Esc | Pausa (sensibilidad, calidad gráfica, volumen Música/SFX, contador FPS y reinicio) |
| Mando (Gamepad) | Sticks mover/apuntar, RT disparar, LT apuntar, RB granada, X recargar, Y armas, B agacharse |

## Características principales

- **Armamento y combate táctico ampliado:** granadas de palo chinas Tipo 24 (`[G]`), ametralladora fija Tipo 24 montada junto al parapeto (`[F]`, cobertura frontal y gestión de calor), casquillos eyectados en 3D, indicador direccional de impacto y faroles colgantes destructibles sobre el puente.
- **Clima dinámico, bengalas y enemigos especiales:** tormenta de lluvia GPU (`THREE.Points`, 1 draw call) con relámpagos en el Capítulo 3, bengalas de iluminación descendentes con una luz reutilizable, francotiradores imperiales con destello previo de mira y jefe **Tanqueta Tipo 94 Te-Ke** en el Capítulo 4 (y cada 4 oleadas en Supervivencia), vulnerable en su visor naranja y a granadas.
- **Modos, selector de capítulos, dificultad y récords:** **Campaña histórica (4 capítulos)** con selector de capítulo inicial o **Supervivencia infinita (无尽抗战)**, tres dificultades (*Recluta*, *Soldado*, *Veterano 1937*), puntuación en vivo, rangos (`D`–`S`) y mejores marcas guardadas localmente (`localStorage`).
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
- **Rendimiento en tiempo real:** los 30 leones de piedra del puente utilizan **`THREE.LOD`** (modelo GLB de alta resolución solo a menos de 15 m y malla ligera a distancia), los soldados proyectan sombras mediante cilindros ligeros de respaldo (`SHADOW_PROXY_GEO`), el agua del río Yongding se anima íntegramente en GPU (`waterMat.onBeforeCompile`) y los materiales estáticos se reutilizan mediante caché.

La estructura del puente, arcos, muros, río y sacos de arena sigue siendo geometría procedural de Three.js. El juego funciona sin conexión una vez descargados `three.module.js`, `loaders/GLTFLoader.js`, `utils/BufferGeometryUtils.js` y la carpeta `models/`. Si algún GLB falla, se mantiene el modelo procedural de respaldo.
