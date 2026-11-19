export const DECK_TOP = 6.6;
export const WANPING_TOP = 11.4;
export const REC_KEY = 'mp1937_records_v1';

export const MODEL_URLS = {
  enemy:   './models/soldado_japones.glb',
  lion:    './models/leon_piedra.glb',
  rifle:   './models/fusil_chiang.glb',
  pistol:  './models/mauser_c96_ref.glb',
  sword:   './models/dadao_ref.glb',
  chinese: './models/soldado_chino.glb',
  gate:    './models/torre_wanping.glb'
};

export const DIFFS = {
  easy:   { enemyDmg: 0.70, enemyHp: 0.85, supplyCd: 11, label: 'Recluta' },
  normal: { enemyDmg: 1.00, enemyHp: 1.00, supplyCd: 15, label: 'Soldado' },
  hard:   { enemyDmg: 1.35, enemyHp: 1.20, supplyCd: 19, label: 'Veterano 1937' }
};

export const WEAPONS = {
  rifle:  { name:'中正式步枪 · Fusil Automático', short:'Fusil',      clip:30, reserve:120, initReserve:120, ammo:30, dmg:34,  rate:0.165, reload:1.65, spread:0.012, melee:false, auto:true,  adsFov:50, adsThirdFov:58, baseX:0 },
  pistol: { name:'毛瑟 C96 · Mauser C96',        short:'Mauser C96', clip:10, reserve:40,  initReserve:40,  ammo:10, dmg:40,  rate:0.24,  reload:1.25, spread:0.018, melee:false, auto:false, adsFov:60, adsThirdFov:64, baseX:0 },
  sword:  { name:'大刀 · Dadao',                 short:'Dadao',      clip:1,  reserve:0,   initReserve:0,   ammo:1,  dmg:120, rate:0.60,  reload:0,    spread:0,     melee:true,  auto:true,  adsFov:74, adsThirdFov:74, baseX:0 },
  mp18:   { name:'伯格曼 MP-18 · Subfusil',      short:'MP-18',      clip:32, reserve:128, initReserve:128, ammo:32, dmg:24,  rate:0.095, reload:1.5,  spread:0.024, melee:false, auto:true,  adsFov:56, adsThirdFov:62, baseX:0 }
};

export const INVENTORY_MAX_SLOTS = 12;

export const INVENTORY_ITEMS = [
  {
    id: 'rifle', cat: 'weapon', zh: '中正式步枪', name: 'Fusil Chiang Kai-shek', short: 'Fusil',
    hotkey: '1', icon: 'rifle', color: '#e8c87a', droppable: false,
    desc: 'Fusil automático principal de 7,92 mm con bayoneta calada.',
    lore: 'Copia china del Mauser Standardmodell de 7,92 mm, arma estándar del 219.º Regimiento en Lugouqiao.'
  },
  {
    id: 'pistol', cat: 'weapon', zh: '毛瑟 C96', name: 'Pistola Mauser C96', short: 'Mauser',
    hotkey: '2', icon: 'pistol', color: '#e8c87a', droppable: false,
    desc: 'Arma secundaria semiautomática de alta precisión y recarga veloz.',
    lore: 'Pistola semiautomática de 7,63 mm muy valorada por oficiales y vanguardias del 29.º Ejército.'
  },
  {
    id: 'sword', cat: 'weapon', zh: '大刀', name: 'Espada Dadao', short: 'Dadao',
    hotkey: '3', icon: 'sword', color: '#e8c87a', droppable: false,
    desc: 'Combate cuerpo a cuerpo letal; Clic der. / [Q] ejecuta parry contra bayonetas y katanas.',
    lore: 'Sable pesado del Escuadrón de Dadao (大刀队); clic derecho o [Q] ejecuta parry contra bayonetas y katanas.'
  },
  {
    id: 'mp18', cat: 'weapon', zh: '伯格曼 MP-18', name: 'Subfusil MP-18', short: 'MP-18',
    hotkey: '4', icon: 'mp18', color: '#e8c87a', droppable: false,
    desc: 'Alta cadencia de disparo a corta distancia; mejorable en la Tienda de Supervivencia.',
    lore: 'Subfusil de 9 mm fabricado en arsenales chinos; devastador a corta distancia y mejorable en Supervivencia.'
  },
  {
    id: 'grenade', cat: 'tactical', zh: '二四式手榴弹', name: 'Granada Tipo 24', short: 'Granada',
    hotkey: 'G', maxStack: 4, icon: 'grenade', color: '#ff8a4c', droppable: false,
    desc: 'Explosivo de palo con onda expansiva eficaz contra infantería, sacos y orugas de tanqueta.',
    lore: 'Granada de mango estándar producida en China en 1937.'
  },
  {
    id: 'molotov', cat: 'tactical', zh: '燃烧瓶', name: 'Cóctel Molotov', short: 'Molotov',
    hotkey: 'X', maxStack: 4, icon: 'molotov', color: '#ff6e2a', droppable: false,
    desc: 'Crea una zona incendiaria de 6,5 s que daña continuamente a infantería y vehículos blindados.',
    lore: 'Arma incendiaria improvisada contra posiciones y blindados ligeros.'
  },
  {
    id: 'bandage', cat: 'tactical', zh: '急救绷带', name: 'Vendaje de Campaña', short: 'Vendaje',
    hotkey: 'H', maxStack: 4, icon: 'bandage', color: '#7dffb3', droppable: false,
    desc: 'Aplica primeros auxilios inmediatos (+38 salud).',
    lore: 'Botiquín individual de gasa esterilizada de la 37.ª División.'
  },
  {
    id: 'mortar', cat: 'tactical', zh: '迫击炮支援', name: 'Mortero Aliado', short: 'Mortero',
    hotkey: 'B', maxStack: 3, icon: 'mortar', color: '#6ad8ff', droppable: false,
    desc: 'Solicita una salva de 3 proyectiles desde las baterías de Wanping sobre el punto de mira.',
    lore: 'Fuego de apoyo coordinado por el mando del coronel Ji Xingwen.'
  },
  {
    id: 'ration', cat: 'supply', zh: '行军干粮', name: 'Ración de Campaña', short: 'Ración',
    maxStack: 4, icon: 'ration', color: '#7dffb3', droppable: true,
    desc: 'Restaura +25 salud y +15 blindaje al instante.',
    lore: 'Galletas secas y arroz comprimido de las trincheras de Wanping.'
  },
  {
    id: 'plate', cat: 'supply', zh: '钢盔护板', name: 'Placa de Blindaje', short: 'Blindaje',
    maxStack: 3, icon: 'plate', color: '#56d8ff', droppable: true,
    desc: 'Refuerza +35 puntos de blindaje táctico (máx. 50).',
    lore: 'Acero templado de repuesto para absorber metralla y fuego de fusil.'
  },
  {
    id: 'ammo_pouch', cat: 'supply', zh: '备用弹药袋', name: 'Cartuchera de Munición', short: 'Munición',
    maxStack: 4, icon: 'ammo', color: '#ffd447', droppable: true,
    desc: 'Repone +30 reserva de Fusil, +15 Mauser C96 y +32 MP-18.',
    lore: 'Peines de latón de 7,92 mm y cargadores extra recogidos en el puente.'
  },
  {
    id: 'flare_kit', cat: 'supply', zh: '照明信号弹', name: 'Bengala Táctica', short: 'Bengala',
    maxStack: 3, icon: 'flare', color: '#ffe89e', droppable: true,
    desc: 'Ilumina todo el puente nocturno durante 14 s y otorga +50 pts de reconocimiento.',
    lore: 'Bengala de magnesio usada para delatar infiltraciones nocturnas.'
  },
  {
    id: 'adrenaline', cat: 'supply', zh: '行军热茶', name: 'Tónico del 29.º Ejército', short: 'Tónico',
    maxStack: 3, icon: 'tonic', color: '#95f5a5', droppable: true,
    desc: 'Durante 12 s otorga +20% velocidad de movimiento y +35% velocidad de recarga.',
    lore: 'Infusión estimulante repartida antes de los contraataques nocturnos.'
  },
  {
    id: 'intel_doc', cat: 'supply', zh: '日军情报', name: 'Documento Táctico', short: 'Intelig.',
    maxStack: 3, icon: 'intel', color: '#ff9c5b', droppable: false,
    desc: 'Transmite órdenes interceptadas al mando de Wanping (+250 PTS y despacho por radio).',
    lore: 'Mapas de despliegue y códigos recuperados de oficiales enemigos o vehículos.'
  }
];

export const ENEMY_ROLES = {
  rifleman:  { tint:0x8f9478, hp:100, speed:3.3, stopDistBase:15,   fireRate:1.45, scale:1.0,  pts:100, label:'Fusilero japonés' },
  charger:   { tint:0x64704b, hp:85,  speed:4.9, stopDistBase:1.85, fireRate:1.0,  scale:1.0,  pts:120, label:'Asaltante japonés' },
  officer:   { tint:0x7a5642, hp:155, speed:3.7, stopDistBase:2.4,  fireRate:0.95, scale:1.06, pts:200, label:'Oficial con katana' },
  sniper:    { tint:0x4d5648, hp:95,  speed:3.0, stopDistBase:30,   fireRate:2.6,  scale:0.96, pts:160, label:'Francotirador imperial' },
  grenadier: { tint:0x6e684e, hp:110, speed:3.1, stopDistBase:20,   fireRate:4.6,  scale:1.02, pts:150, label:'Granadero Tipo 97' },
  mortar:    { tint:0x585b4f, hp:120, speed:2.5, stopDistBase:34,   fireRate:5.8,  scale:1.04, pts:190, label:'Morterista japonés' }
};

export const SQUAD_ORDERS = {
  cover:   { label:'Fuego de cobertura', zh:'火力压制', fireRate:1.45 },
  advance: { label:'Avanzar al parapeto', zh:'向前推进', fireRate:1.85 },
  hold:    { label:'Mantener posición',   zh:'坚守阵地', fireRate:2.05 },
  focus:   { label:'Concentrar fuego',    zh:'集中火力', fireRate:1.55 }
};

export const SHOP_ITEMS = [
  { id:'armor50',  title:'Casco / Blindaje +50',   desc:'Refuerza el blindaje táctico al máximo',   cost:350, repeatable:true },
  { id:'mp18',     title:'Subfusil MP-18 + Munición', desc:'Desbloquea o mejora el MP-18 [4] (+15% daño)', cost:550, repeatable:true },
  { id:'molotov2', title:'Cócteles Molotov (+2)',  desc:'Fuego continuo contra infantería y orugas', cost:300, repeatable:true },
  { id:'mortar1',  title:'Apoyo de Mortero (+1)',  desc:'Salva aliada [B] sobre coordenadas del puente', cost:650, repeatable:true },
  { id:'pack',     title:'Suministros Completos',  desc:'Salud +50, munición llena, +2 granadas y +2 vendajes', cost:250, repeatable:true }
];

export const MEDALS = [
  { id:'first_blood', title:'守桥哨兵 · Centinela',      desc:'Abate a tu primer atacante' },
  { id:'headshot5',   title:'神射手 · Tiro Preciso',     desc:'Logra 5 tiros a la cabeza' },
  { id:'dadao_parry', title:'大刀壮士 · Escuadrón Dadao',desc:'Desvía o remata un asalto con Dadao' },
  { id:'tank_hunter', title:'摧毁装甲 · Cazatanques',    desc:'Destruye la Tanqueta Tipo 94 Te-Ke' },
  { id:'wanping_hero',title:'卢沟忠魂 · Héroe de Wanping', desc:'Completa la Campaña Histórica' },
  { id:'survivor_w5', title:'百折不挠 · Resistencia',     desc:'Alcanza la Oleada 5 en Supervivencia' }
];

export const CHAPTER_ATMOSPHERE = [
  { skyTop:0x060b18, skyHor:0x141d34, fog:0x0d1424, moon:0xc8d6ff, fogDens:0.0046, glow:0x1b2742 },
  { skyTop:0x121528, skyHor:0x3c2c38, fog:0x16192b, moon:0xd8dcff, fogDens:0.0052, glow:0x523224 },
  { skyTop:0x040914, skyHor:0x0e1828, fog:0x080f1c, moon:0x9eb8ec, fogDens:0.0062, glow:0x14223a },
  { skyTop:0x1d1118, skyHor:0x5c2b22, fog:0x26171d, moon:0xffc2a8, fogDens:0.0050, glow:0x7a321c }
];

export const WAVES = [5, 7, 8, 10];
export const CHAPTER_TITLES = [
  '7 JUL 23:40 · El pretexto del soldado perdido',
  '8 JUL 04:50 · El bombardeo de Wanping (Almenas)',
  '9 JUL 01:15 · Contraataque en el Puente Ferroviario',
  '28 JUL 06:10 · Ofensiva final y sacrificio de Nanyuan'
];

export const TACTICAL_BRIEFINGS = [
  {
    title: 'MAPA TÁCTICO · 7 DE JULIO DE 1937 (23:40)',
    caption: 'Maniobras japonesas junto al extremo oeste de Lugouqiao. Puedes defender desde la calzada o subir por la rampa sureste hacia las almenas de Wanping.'
  },
  {
    title: 'MAPA TÁCTICO · 8 DE JULIO DE 1937 (04:50)',
    caption: 'La artillería del coronel Mutaguchi golpea Wanping. Usa las almenas de piedra para ganar ángulo elevado y vigila los anillos rojos de mortero enemigo.'
  },
  {
    title: 'MAPA TÁCTICO · 9 DE JULIO DE 1937 (01:15)',
    caption: 'Tormenta nocturna y bengalas de iluminación. Infiltrados enemigos atacan también por el Puente Ferroviario norte: flanquea o ordena avanzar al escuadrón [T].'
  },
  {
    title: 'MAPA TÁCTICO · 28 DE JULIO DE 1937 (06:10)',
    caption: 'Ofensiva general con apoyo blindado Tipo 94 Te-Ke. Destruye sus orugas para inmovilizarla, ciega su visor naranja o detona su torreta con granadas y Molotov.'
  }
];

export const WAVE_RADIOS = [
  ['CORONEL JI XINGWEN (吉星文)', 'Los japoneses alegan que falta el soldado Shimura y exigen entrar en Wanping. ¡No cedan el puente!'],
  ['MAYOR JIN ZHENZHONG (金振中)', '¡El coronel Mutaguchi bombardea Wanping! ¡Cúbranse tras los sacos [C], suban a las almenas o usen órdenes [T]!'],
  ['CAPITÁN DEL ESCUADRÓN DADAO (大刀队)', '¡Noche del 9 de julio! Enemigos avanzan por el puente ferroviario norte. ¡Alistad el dadao [3], cócteles Molotov [X] y linterna de bengalas!'],
  ['GENERAL QIN DECHUN (秦德纯)', '¡28 de julio! Japón rompió la tregua con divisiones de Manchuria. ¡Sostengan el puente para cubrir el repliegue de Beiping!']
];
export const MID_WAVE_RADIOS = [
  ['INTELIGENCIA · 29.º EJÉRCITO', '¡Informe confirmado! El soldado Shimura ya apareció sano y salvo en su unidad, ¡pero el mando japonés ataca igualmente!'],
  ['PUESTO DE MANDO · WANPING', '¡El mayor Jin Zhenzhong ha sido herido en el parapeto norte, pero sigue dirigiendo el fuego! ¡Resistan!'],
  ['ESCUADRÓN DADAO · VANGUARDIA', '¡Combate en el puente ferroviario paralelo! Coordinad el fuego del escuadrón [T] y cuidado con granaderos Tipo 97.'],
  ['RADIO DE CAMPAÑA · NANYUAN', '¡Los generales Tong Linge (佟麟阁) y Zhao Dengyu (赵登郁) han caído heroicamente en Nanyuan! ¡Último esfuerzo por sus compañeros!']
];
export const WAVE_BANNERS = [
  ['第一幕 · 借口失踪',   'CAPÍTULO 1 · 7 DE JULIO (23:40) · EL PRETEXTO'],
  ['第二幕 · 炮击宛平',   'CAPÍTULO 2 · 8 DE JULIO (04:50) · FUEGO SOBRE WANPING'],
  ['第三幕 · 铁桥夜袭',   'CAPÍTULO 3 · 9 DE JULIO (01:15) · PUENTE FERROVIARIO'],
  ['第四幕 · 南苑血战',   'CAPÍTULO 4 · 28 DE JULIO (06:10) · LA ÚLTIMA LÍNEA']
];

export const CINE_SCRIPTS = {
  intro: {
    dur: 13.2,
    shots: [
      { t0:0, t1:4.4, fromPos:[-38,12.5,-16], toPos:[-4,9.8,-7.5], fromLook:[10,7.8,0], toLook:[18,7.8,0],
        tag:'7 DE JULIO DE 1937 · 22:40 · RÍO YONGDING',
        zh:'1937年7月7日 · 卢沟桥畔',
        sub:'Noche de verano sobre el puente de Marco Polo. Tropas japonesas alegan que falta el soldado Shimura y exigen registrar la ciudad amurallada de Wanping.' },
      { t0:4.4, t1:8.8, fromPos:[64,12.2,4.5], toPos:[42,8.8,2.2], fromLook:[32,7.6,-1.5], toLook:[28,7.4,-1],
        tag:'219.º REGIMIENTO · 37.ª DIVISIÓN · 29.º EJÉRCITO',
        zh:'吉星文团长命令：寸土不让！',
        sub:'El coronel Ji Xingwen rechaza el ultimátum. Los defensores chinos aseguran los sacos de arena frente a la puerta de Wanping.' },
      { t0:8.8, t1:13.2, fromPos:[14,9.5,-1.8], toPos:[34,DECK_TOP+1.7,0], fromLook:[-35,DECK_TOP+1.2,0], toLook:[-35,DECK_TOP+1.4,0],
        tag:'23:40 · PRIMEROS DISPAROS · COMIENZA LA BATALLA',
        zh:'抗日战争全面爆发',
        sub:'Suenan los primeros morteros en el extremo oeste del puente. ¡Toma posiciones y contén el asalto!',
        events:[{ at:9.0, fn:(S)=>S.hooks.spawnArtilleryBlast(-46, DECK_TOP, 1.2) }] }
    ]
  },
  wave2: {
    dur: 5.2,
    shots: [
      { t0:0, t1:5.2, fromPos:[6,13.5,-8], toPos:[24,10.2,-3.5], fromLook:[52,10,0], toLook:[48,9.2,0],
        tag:'8 DE JULIO DE 1937 · 04:50 · BOMBARDEO DE WANPING',
        zh:'炮击宛平城 · 金振中营长坚守阵地',
        sub:'El coronel Mutaguchi ordena cañonear Wanping al alba. El mayor Jin Zhenzhong resiste en el puente y sus almenas frente a cargas a la bayoneta.',
        events:[
          { at:0.4, fn:(S)=>{ S.hooks.setChapterAtmosphere(1); S.hooks.spawnArtilleryBlast(14, DECK_TOP, 2.4); } },
          { at:2.0, fn:(S)=>S.hooks.spawnArtilleryBlast(56, DECK_TOP+2, -3.5) }
        ] }
    ]
  },
  wave3: {
    dur: 5.4,
    shots: [
      { t0:0, t1:5.4, fromPos:[42,9.2,-12.0], toPos:[20,8.5,-5.0], fromLook:[-25,7.5,-8], toLook:[-35,7.4,-6],
        tag:'9 DE JULIO DE 1937 · 01:15 · CONTRAATAQUE EN EL PUENTE FERROVIARIO',
        zh:'大刀队夜袭 · 夺回铁桥',
        sub:'Bajo la lluvia nocturna, el Escuadrón de Dadao del 29.º Ejército avanza tanto por Lugouqiao como por el puente ferroviario norte.',
        events:[{ at:0.2, fn:(S)=>{ S.hooks.setChapterAtmosphere(2); S.hooks.spawnArtilleryBlast(-22, DECK_TOP, -11.5); } }] }
    ]
  },
  wave4: {
    dur: 5.6,
    shots: [
      { t0:0, t1:5.6, fromPos:[-8,14.5,-9], toPos:[22,10.5,-4], fromLook:[45,9,0], toLook:[48,9,0],
        tag:'28 DE JULIO DE 1937 · 06:10 · LA RUPTURA DE LA TREGUA Y OFENSIVA GENERAL',
        zh:'佟麟阁、赵登郁将军殉国 · 最终防线',
        sub:'Tras usar las negociaciones para traer divisiones desde Manchuria, Japón lanza el asalto total. ¡Resiste frente a la tanqueta Tipo 94 y cubre Beiping!',
        events:[
          { at:0.2, fn:(S)=>{ S.hooks.setChapterAtmosphere(3); S.hooks.spawnArtilleryBlast(-10, DECK_TOP, 2.2); } },
          { at:2.2, fn:(S)=>S.hooks.spawnArtilleryBlast(22, DECK_TOP, -2.8) }
        ] }
    ]
  },
  outro: {
    dur: 12.6,
    shots: [
      { t0:0, t1:4.2, fromPos:[30,8.5,0], toPos:[18,12.5,-7], fromLook:[48,9.5,0], toLook:[58,10.5,0],
        tag:'29–30 DE JULIO DE 1937 · EL REPLIEGUE DEL 29.º EJÉRCITO',
        zh:'卢沟桥与宛平陷落 · 北平、天津沦陷',
        sub:'Tras semanas de combate desigual, el 29.º Ejército se repliega hacia el sur. El puente de Marco Polo y Wanping caen; Beiping el 29 de julio y Tianjin el 30 de julio.',
        events:[{ at:0.5, fn:(S)=>S.hooks.spawnArtilleryBlast(8, DECK_TOP, 3.0) }] },
      { t0:4.2, t1:8.4, fromPos:[18,12.5,-7], toPos:[4,18,-12], fromLook:[58,10.5,0], toLook:[66,11,0],
        tag:'1937 – 1945 · OCHO AÑOS DE GUERRA TOTAL',
        zh:'全民族抗战 · 百折不挠',
        sub:'Los disparos de Lugouqiao encendieron la Guerra de Resistencia. Durante ocho años —de Shanghái y Tai\'erzhuang a Wuhan y Chongqing— millones sostuvieron la lucha.',
        events:[{ at:4.6, fn:(S)=>S.hooks.spawnArtilleryBlast(44, DECK_TOP+1, -2.5) }] },
      { t0:8.4, t1:12.6, fromPos:[4,18,-12], toPos:[-14,22,-16], fromLook:[30,9,0], toLook:[20,8,0],
        tag:'10 DE OCTUBRE DE 1945 · RENDICIÓN EN BEIPING Y MEMORIA ETERNA',
        zh:'抗战胜利 · 卢沟石狮永存',
        sub:'En 1945 Japón capituló y firmó su rendición en Beiping. Hoy, los leones de piedra de Lugouqiao y las cicatrices de Wanping siguen en pie como testigos.',
        events:[{ at:8.5, fn:(S)=>{ S.scene.background.setHex(0x2b2430); S.scene.fog.color.setHex(0x2b2430); S.moonLight.color.setHex(0xffe0b2); } }] }
    ]
  }
};
