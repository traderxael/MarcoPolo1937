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
  { id:'first_blood',   title:'守桥哨兵 · Centinela',      desc:'Abate a tu primer atacante' },
  { id:'headshot5',     title:'神射手 · Tiro Preciso',     desc:'Logra 5 tiros a la cabeza' },
  { id:'dadao_parry',   title:'大刀壮士 · Escuadrón Dadao',desc:'Desvía o remata un asalto con Dadao' },
  { id:'tank_hunter',   title:'摧毁装甲 · Cazatanques',    desc:'Destruye la Tanqueta Tipo 94 Te-Ke' },
  { id:'wanping_hero',  title:'卢沟忠魂 · Héroe de Wanping', desc:'Defiende Lugouqiao hasta el repliegue de julio de 1937' },
  { id:'sihang_hero',   title:'四行壮士 · 800 Héroes',     desc:'Resiste y completa la Batalla de Shanghái (Almacén Sihang)' },
  { id:'china_liberated',title:'抗战胜利 · Liberación 1945', desc:'Completa toda la Campaña Histórica 1937–1945 hasta la victoria' },
  { id:'survivor_w5',   title:'百折不挠 · Resistencia',     desc:'Alcanza la Oleada 5 en Supervivencia' }
];

export const CHAPTER_ATMOSPHERE = [
  { skyTop:0x060b18, skyHor:0x141d34, fog:0x0d1424, moon:0xc8d6ff, fogDens:0.0046, glow:0x1b2742, wet:false },
  { skyTop:0x121528, skyHor:0x3c2c38, fog:0x16192b, moon:0xd8dcff, fogDens:0.0052, glow:0x523224, wet:false },
  { skyTop:0x040914, skyHor:0x0e1828, fog:0x080f1c, moon:0x9eb8ec, fogDens:0.0062, glow:0x14223a, wet:true },
  { skyTop:0x1d1118, skyHor:0x5c2b22, fog:0x26171d, moon:0xffc2a8, fogDens:0.0050, glow:0x7a321c, wet:false },
  { skyTop:0x0c0910, skyHor:0x6b2218, fog:0x241212, moon:0xffb080, fogDens:0.0052, glow:0x9e3418, wet:false },
  { skyTop:0x2c3b4c, skyHor:0x9c7b52, fog:0x4a3d30, moon:0xffe3b0, fogDens:0.0040, glow:0xc98c44, wet:false },
  { skyTop:0x0b161c, skyHor:0x263b3e, fog:0x162428, moon:0xb8d4dc, fogDens:0.0064, glow:0x2a4d4c, wet:true },
  { skyTop:0x182644, skyHor:0xd48546, fog:0x3c2c26, moon:0xffe6b8, fogDens:0.0038, glow:0xf09a44, wet:false }
];

export const WAVES = [5, 7, 8, 10];
export const CHAPTER_TITLES = [
  '7 JUL 1937 · Lugouqiao: El pretexto del soldado perdido',
  '8 JUL 1937 · Bombardeo de Wanping (Almenas)',
  '9 JUL 1937 · Contraataque en el Puente Ferroviario',
  '28 JUL 1937 · Ruptura de la tregua y Nanyuan',
  'OCT 1937 · Shanghái: Calles en ruinas y Almacén Sihang',
  'ABR 1938 · Tai\'erzhuang: Primera Gran Victoria',
  '1941–1942 · Changsha: La Trampa de Fuego (Tianlu)',
  '1945 · Hunan Occidental: Contraofensiva y Victoria Final'
];

export const TACTICAL_BRIEFINGS = [
  {
    opCode: 'OPERACIÓN LUGOUQIAO · ACTO I',
    date: '7 DE JULIO DE 1937 · 23:40',
    location: 'PUENTE DE MARCO POLO, BEIPING',
    unit: '219.º REGIMIENTO · 29.º EJÉRCITO',
    theater: 'bridge',
    title: 'EXPEDIENTE · 7 DE JULIO DE 1937 (LUGOUQIAO)',
    caption: 'Maniobras japonesas junto al extremo oeste de Lugouqiao. El coronel Ji Xingwen ordena sostener el puente e impedir el registro armado de Wanping.',
    objectives: ['Contener el primer asalto sobre la calzada', 'Aprovechar sacos de arena [C] y almenas de Wanping']
  },
  {
    opCode: 'OPERACIÓN WANPING · ACTO II',
    date: '8 DE JULIO DE 1937 · 04:50',
    location: 'PUERTA DE WANPING, LUGOUQIAO',
    unit: 'BATALLÓN DEL MAYOR JIN ZHENZHONG',
    theater: 'bridge',
    title: 'EXPEDIENTE · 8 DE JULIO DE 1937 (BOMBARDEO)',
    caption: 'La artillería del coronel Mutaguchi golpea Wanping al alba. Sube por la rampa sureste hacia las almenas de piedra para batir las cargas y vigila los morteros.',
    objectives: ['Resistir el bombardeo y abatan cargas niponas', 'Coordinar al escuadrón del 29.º Ejército con [T]']
  },
  {
    opCode: 'OPERACIÓN DADAO · ACTO III',
    date: '9 DE JULIO DE 1937 · 01:15',
    location: 'PUENTE FERROVIARIO NORTE, YONGDING',
    unit: 'ESCUADRÓN DE DADAO (大刀队)',
    theater: 'bridge',
    title: 'EXPEDIENTE · 9 DE JULIO DE 1937 (TIEMPO LLUVIOSO)',
    caption: 'Tormenta nocturna y bengalas. Destacamentos imperiales se infiltran por el puente ferroviario paralelo norte: contraataca con el Dadao [3] y Molotov [X].',
    objectives: ['Rechazar la infiltración en el puente ferroviario', 'Desviar estocadas cuerpo a cuerpo con parry Dadao']
  },
  {
    opCode: 'OPERACIÓN NANYUAN · ACTO IV',
    date: '28 DE JULIO DE 1937 · 06:10',
    location: 'EXTREMO OESTE Y MURALLA DE WANPING',
    unit: 'RETAGUARDIA DE BEIPING · 29.º EJÉRCITO',
    theater: 'bridge',
    title: 'EXPEDIENTE · 28 DE JULIO DE 1937 (RUPTURA TOTAL)',
    caption: 'Japón trae divisiones desde Manchuria con apoyo blindado Tipo 94 Te-Ke. Sostén la última línea para cubrir el repliegue hacia el sur.',
    objectives: ['Inutilizar orugas, visor y torreta de la tanqueta', 'Cubrir la retirada antes de la campaña del sur']
  },
  {
    opCode: 'OPERACIÓN SIHANG · ACTO V',
    date: '27–30 DE OCTUBRE DE 1937',
    location: 'ORILLA DEL RÍO SUZHOU, SHANGHÁI',
    unit: '88.ª DIVISIÓN · 524.º REGIMIENTO ("800 HÉROES")',
    theater: 'shanghai',
    title: 'EXPEDIENTE · SHANGHÁI 1937 (ALMACÉN SIHANG)',
    caption: 'Tras la caída del norte, Japón abre el frente de Shanghái. El teniente coronel Xie Jinyuan atrinchera a "los 800 Héroes" frente al bulevar en llamas para cubrir la retirada china.',
    objectives: ['Despejar el bulevar inicial frente al almacén', 'Destruir el nido de ametralladora nipón', 'Sabotear el cañón de asedio de 75 mm [E]', 'Rechazar el último asalto acorazado']
  },
  {
    opCode: 'OPERACIÓN GRAN CANAL · ACTO VI',
    date: 'MARZO–ABRIL DE 1938',
    location: 'CIUDAD AMURALLADA DE TAI\'ERZHUANG',
    unit: '5.ª ZONA DE GUERRA · GRAL. LI ZONGREN',
    theater: 'taierzhuang',
    title: 'EXPEDIENTE · TAI\'ERZHUANG 1938 (PRIMERA VICTORIA)',
    caption: 'Los ejércitos chinos rodean a las divisiones de élite japonesas en las callejuelas de Tai\'erzhuang. Destruye sus depósitos y asegura el Gran Canal.',
    objectives: ['Romper el cerco japonés en las calles', 'Sabotear ambos depósitos de munición [E]', 'Sostener la plaza del Gran Canal hasta la victoria']
  },
  {
    opCode: 'OPERACIÓN TIANLU · ACTO VII',
    date: '1941–1942',
    location: 'TRINCHERAS DEL RÍO MILUO, CHANGSHA',
    unit: '9.ª ZONA DE GUERRA · GRAL. XUE YUE',
    theater: 'changsha',
    title: 'EXPEDIENTE · CHANGSHA (TRAMPA DE FUEGO)',
    caption: 'El general Xue Yue atrae al enemigo al "Círculo de la Muerte" bajo lluvia monzónica para aniquilar su avance hacia Chongqing.',
    objectives: ['Eliminar la vanguardia imperial en las trincheras', 'Sabotear la batería de morteros enemigos [E]', 'Cerrar la trampa de Changsha manteniendo la línea']
  },
  {
    opCode: 'OPERACIÓN VICTORIA · ACTO VIII',
    date: 'ABRIL–AGOSTO DE 1945',
    location: 'PASO DE HUNAN OCCIDENTAL · PLAZA FINAL',
    unit: 'CONTRAOFENSIVA NACIONAL · LIBERACIÓN DE CHINA',
    theater: 'victory1945',
    title: 'EXPEDIENTE · HUNAN 1945 (EXPULSIÓN Y VICTORIA)',
    caption: 'Tras ocho años de resistencia inquebrantable, el Ejército Chino lanza la gran contraofensiva final. Rompe la última línea japonesa e iza la bandera de la victoria.',
    objectives: ['Asaltar la última línea fortificada japonesa', 'Demoler el búnker de mando imperial [E]', 'Destruir el último blindado Tipo 94', 'Izar la bandera de la Victoria de 1945 [E]']
  }
];

export const CAMPAIGN_MISSIONS = [
  {
    id: 0, theater: 'bridge', mapNodeIdx: 0, spawnStart: [34, 0],
    storyStart: ['CRÓNICA · 7 JUL 1937', 'Estalla el Incidente de Lugouqiao. Mientras Japón exige registrar Wanping con el pretexto del soldado Shimura, el 29.º Ejército bloquea el puente.'],
    storyMid:   ['CRÓNICA · MEDIANOCHE', 'Shimura ya ha aparecido sano y salvo en su cuartel, pero el mando imperial utiliza el incidente para iniciar la invasión a gran escala.']
  },
  {
    id: 1, theater: 'bridge', mapNodeIdx: 0, spawnStart: [36, 1.5],
    storyStart: ['CRÓNICA · 8 JUL 1937', 'Al amanecer los obuses golpean la muralla de Wanping. El mayor Jin Zhenzhong encabeza herido la defensa desde los parapetos superiores.'],
    storyMid:   ['CRÓNICA · ALMENAS DE WANPING', 'Pese a la superioridad artillera japonesa, los defensores conservan cada metro del puente e infligen duras bajas al alba.']
  },
  {
    id: 2, theater: 'bridge', mapNodeIdx: 0, spawnStart: [34, -2.0],
    storyStart: ['CRÓNICA · 9 JUL 1937', 'Bajo una tormenta nocturna, el legendario Escuadrón de Dadao (大刀队) lanza un contraataque relámpago sobre las vías del puente ferroviario.'],
    storyMid:   ['CRÓNICA · PUENTE FERROVIARIO', 'Armados con fusiles, granadas de palo y pesados sables dadao, recuperan temporalmente el extremo occidental bajo el aguacero.']
  },
  {
    id: 3, theater: 'bridge', mapNodeIdx: 0, spawnStart: [34, 0],
    storyStart: ['CRÓNICA · 28 JUL 1937', 'Rotas las falsas treguas, divisiones japonesas y blindados ligeros asaltan Beiping. Cubre el repliegue antes de que la guerra se extienda por toda China.'],
    storyMid:   ['CRÓNICA · REPLIEGUE DEL NORTE', 'Beiping y Tianjin caen a finales de julio, pero la resistencia china no se rinde: el frente se traslada al corazón industrial en Shanghái.']
  },
  {
    id: 4, theater: 'shanghai', mapNodeIdx: 1, spawnStart: [46, 0],
    storyStart: ['CRÓNICA · OCT 1937 · SHANGHÁI', 'El ejército japonés desembarca en Shanghái creyendo conquistar China en tres meses. Desde el Almacén Sihang, los 800 Héroes resisten ante los ojos del mundo.'],
    storyMid:   ['CRÓNICA · ALMACÉN SIHANG', 'Cuatro días de defensa heroica dieron tiempo vital para evacuar fábricas, escuelas y ejércitos hacia el interior de China.'],
    phases: [
      { id: 'sh_p1', type: 'clear_sector', label: 'Despejar el bulevar inicial de avanzadillas', spawn: { count: 6, roles: ['rifleman','charger','rifleman','sniper','rifleman','grenadier'] }, squad: [[40, 4], [36, -4]],
        intro: ['TENIENTE CORONEL XIE JINYUAN', '¡Aseguren el bulevar frente al Almacén Sihang! Eliminen a la vanguardia japonesa antes de su bombardeo.'] },
      { id: 'sh_p2', type: 'destroy_nest', label: 'Destruir el nido de ametralladora nipón', spawn: { count: 4, roles: ['rifleman','charger','grenadier','officer'] },
        target: { id: 'sh_mg', type: 'mg_nest', x: -4, y: DECK_TOP, z: -3, hp: 160, label: 'NIDO MG' }, squad: [[28, 3.5], [24, -3.5]],
        intro: ['OBSERVADOR · SIHANG', '¡Una ametralladora pesada bloquea el cruce! Acribíllala con fusil, granadas o cócteles Molotov [X].'] },
      { id: 'sh_p3', type: 'sabotage', label: 'Plantar explosivos [E] en el cañón de 75 mm', spawn: { count: 4, roles: ['rifleman','charger','sniper','officer'] },
        target: { id: 'sh_cannon', type: 'sabotage', x: -24, y: DECK_TOP, z: 4.5, hp: 100, label: 'CAÑÓN 75mm' }, squad: [[10, 4], [8, -4]],
        intro: ['ESCUADRÓN DE DEMOLICIÓN', '¡Silencien ese cañón de asedio! Acércate a la pieza marcada ◆ y pulsa [E] para plantar las cargas.'] },
      { id: 'sh_p4', type: 'hold_boss', label: 'Repeler el asalto final y destruir la tanqueta', spawn: { count: 5, roles: ['rifleman','charger','grenadier','officer','rifleman'], tankette: true }, squad: [[22, 4], [18, -4]],
        intro: ['MANDO DEL 524.º REGIMIENTO', '¡Cargas colocadas! La división nipona lanza su blindado contra Sihang. ¡Aguanten la línea!'] }
    ]
  },
  {
    id: 5, theater: 'taierzhuang', mapNodeIdx: 2, spawnStart: [46, 0],
    storyStart: ['CRÓNICA · ABR 1938 · TAI\'ERZHUANG', 'En el Gran Canal, el general Li Zongren logra encerrar por primera vez a las fuerzas de élite japonesas en combates casa por casa.'],
    storyMid:   ['CRÓNICA · PRIMERA GRAN VICTORIA', 'El mundo descubre que el ejército imperial puede ser derrotado: más de diez mil bajas niponas rompen el mito de su invencibilidad.'],
    phases: [
      { id: 'tz_p1', type: 'clear_sector', label: 'Romper el cerco en las callejuelas de Tai\'erzhuang', spawn: { count: 6, roles: ['rifleman','charger','officer','rifleman','charger','grenadier'] }, squad: [[38, 4.5], [34, -4.5]],
        intro: ['GENERAL LI ZONGREN (李宗仁)', '¡No daremos un paso atrás en el Gran Canal! Abran paso a través de los muros en ruinas.'] },
      { id: 'tz_p2', type: 'sabotage_dual', label: 'Sabotear ambos depósitos de artillería [E]', spawn: { count: 5, roles: ['rifleman','sniper','charger','mortar','officer'] },
        targets: [
          { id: 'tz_a', type: 'sabotage', x: -14, y: DECK_TOP, z: -7.5, label: 'DEPÓSITO NORTE' },
          { id: 'tz_b', type: 'sabotage', x: -28, y: DECK_TOP, z:  7.5, label: 'DEPÓSITO SUR' }
        ],
        squad: [[14, 5], [12, -5]],
        intro: ['CAPITÁN CHI FENGCHENG', '¡Vuelen sus dos polvorines [E] en los callejones norte y sur para cortar toda munición enemiga!'] },
      { id: 'tz_p3', type: 'hold_timer', label: 'Asegurar la plaza del Gran Canal (18 s)', dur: 18, spawn: { count: 4, roles: ['rifleman','charger','grenadier','officer'] }, squad: [[20, 4], [20, -4]],
        intro: ['VOZ DE LA VICTORIA · 1938', '¡Nuestros flancos cierran la pinza sobre Tai\'erzhuang! Sostengan la plaza durante la ofensiva final.'] }
    ]
  },
  {
    id: 6, theater: 'changsha', mapNodeIdx: 3, spawnStart: [44, 0],
    storyStart: ['CRÓNICA · 1941–1942 · CHANGSHA', 'Tres veces intenta Japón tomar Changsha. La táctica Tianlu del general Xue Yue convierte el barro y la lluvia en una trampa mortal.'],
    storyMid:   ['CRÓNICA · EL CÍRCULO DE LA MUERTE', 'Aislados sin suministros entre trincheras inundadas, los invasores sufren su mayor desastre estratégico hasta la fecha.'],
    phases: [
      { id: 'cs_p1', type: 'clear_sector', label: 'Abatir la vanguardia en las trincheras de Miluo', spawn: { count: 7, roles: ['rifleman','charger','sniper','rifleman','grenadier','charger','officer'] }, squad: [[36, 4.5], [32, -4.5]],
        intro: ['GENERAL XUE YUE (薛岳)', '¡Atraigan sus columnas hacia el río Miluo y golpeen sin tregua desde las trincheras!'] },
      { id: 'cs_p2', type: 'sabotage', label: 'Inutilizar la batería de morteros enemigos [E]', spawn: { count: 5, roles: ['mortar','rifleman','charger','sniper','officer'] },
        target: { id: 'cs_mortar', type: 'sabotage', x: -24, y: DECK_TOP, z: -4.5, label: 'BATERÍA MORTEROS' }, squad: [[12, 4.5], [10, -4.5]],
        intro: ['OBSERVADOR · 9.ª ZONA DE GUERRA', '¡Localizada la batería de morteros japonesa! Filtra por la trinchera norte y plántale cargas [E].'] },
      { id: 'cs_p3', type: 'hold_timer', label: 'Cerrar la Trampa de Fuego bajo la lluvia (20 s)', dur: 20, spawn: { count: 5, roles: ['rifleman','charger','grenadier','officer','sniper'] }, squad: [[18, 4.5], [16, -4.5]],
        intro: ['MANDO DE CHANGSHA', '¡El cerco Tianlu se ha cerrado! Sostengan las barricadas mientras las divisiones aliadas destruyen la retirada nipona.'] }
    ]
  },
  {
    id: 7, theater: 'victory1945', mapNodeIdx: 4, spawnStart: [46, 0],
    storyStart: ['CRÓNICA · 1945 · HUNAN OCCIDENTAL', 'Tras ocho años de resistencia total, las tornas han cambiado. El Ejército Chino lanza la gran contraofensiva para expulsar definitivamente al invasor.'],
    storyMid:   ['CRÓNICA · LA EXPULSIÓN FINAL', 'Búnker tras búnker caen las últimas posiciones japonesas; las tropas invasoras emprenden la retirada en todo el territorio chino.'],
    phases: [
      { id: 'vc_p1', type: 'clear_sector', label: 'Asaltar la última línea fortificada japonesa', spawn: { count: 7, roles: ['rifleman','charger','sniper','grenadier','mortar','charger','officer'] }, squad: [[34, 4.5], [32, -4.5]],
        intro: ['ALTO MANDO · CONTRAOFENSIVA 1945', '¡Por cada caído desde el 7 de julio de 1937! ¡Avancen por el paso y rompan sus últimas defensas!'] },
      { id: 'vc_p2', type: 'sabotage', label: 'Demoler el búnker de mando imperial [E]', spawn: { count: 5, roles: ['rifleman','officer','grenadier','sniper','charger'] },
        target: { id: 'vic_bunk', type: 'sabotage', x: -16, y: DECK_TOP, z: 5.0, label: 'BÚNKER MANDO' }, squad: [[8, 4.5], [6, -4.5]],
        intro: ['VANGUARDIA DEL EJÉRCITO CHINO', '¡Ese búnker dirige la última guarnición del paso! Ábrete paso y vuela el puesto de mando [E].'] },
      { id: 'vc_p3', type: 'hold_boss', label: 'Destruir el último blindado enemigo en la plaza', spawn: { count: 5, roles: ['rifleman','charger','grenadier','officer','sniper'], tankette: true }, squad: [[2, 4.5], [-2, -4.5]],
        intro: ['ESCUADRÓN DE LIBERACIÓN', '¡Su último blindado intenta cubrir la huida! ¡Destruye la tanqueta y limpia la plaza!'] },
      { id: 'vc_p4', type: 'raise_flag', label: 'Izar la Bandera de la Victoria de 1945 [E]', spawn: { count: 0, roles: [] },
        target: { id: 'vic_flag', type: 'flag', x: -38, y: DECK_TOP, z: 0, label: 'BANDERA 1945' }, squad: [[-26, 4], [-26, -4]],
        intro: ['VICTORIA DE 1945 · 抗战胜利', '¡El invasor ha sido derrotado y expulsado de China! Acércate al mástil de la plaza y pulsa [E] para izar la bandera.'] }
    ]
  }
];

export const WAVE_RADIOS = [
  ['CORONEL JI XINGWEN (吉星文)', 'Los japoneses alegan que falta el soldado Shimura y exigen entrar en Wanping. ¡No cedan el puente!'],
  ['MAYOR JIN ZHENZHONG (金振中)', '¡El coronel Mutaguchi bombardea Wanping! ¡Cúbranse tras los sacos [C], suban a las almenas o usen órdenes [T]!'],
  ['CAPITÁN DEL ESCUADRÓN DADAO (大刀队)', '¡Noche del 9 de julio! Enemigos avanzan por el puente ferroviario norte. ¡Alistad el dadao [3], cócteles Molotov [X] y linterna de bengalas!'],
  ['GENERAL QIN DECHUN (秦德纯)', '¡28 de julio! Japón rompió la tregua con divisiones de Manchuria. ¡Sostengan el puente para cubrir el repliegue de Beiping!'],
  ['TTE. CORONEL XIE JINYUAN (谢晋元)', '¡Los 800 Héroes defienden el Almacén Sihang ante Shanghái! Destruyan el nido de ametralladora y el cañón de asedio.'],
  ['GENERAL LI ZONGREN (李宗仁)', '¡Batalla de Tai\'erzhuang! Cierren el cerco sobre las callejuelas y vuelen sus depósitos de munición [E].'],
  ['GENERAL XUE YUE (薛岳)', '¡Defensa de Changsha! Bajo la lluvia del río Miluo, destruyan su batería de morteros [E] y resistan el cerco Tianlu.'],
  ['MANDO DE LA CONTRAOFENSIVA (1945)', '¡Ofensiva final en Hunan Occidental! Demuelan el último búnker enemigo y alcen la bandera de la liberación.']
];
export const MID_WAVE_RADIOS = [
  ['INTELIGENCIA · 29.º EJÉRCITO', '¡Informe confirmado! El soldado Shimura ya apareció sano y salvo en su unidad, ¡pero el mando japonés ataca igualmente!'],
  ['PUESTO DE MANDO · WANPING', '¡El mayor Jin Zhenzhong ha sido herido en el parapeto norte, pero sigue dirigiendo el fuego! ¡Resistan!'],
  ['ESCUADRÓN DADAO · VANGUARDIA', '¡Combate en el puente ferroviario paralelo! Coordinad el fuego del escuadrón [T] y cuidado con granaderos Tipo 97.'],
  ['RADIO DE CAMPAÑA · NANYUAN', '¡Los generales Tong Linge (佟麟阁) y Zhao Dengyu (赵登郁) han caído heroicamente en Nanyuan! ¡Último esfuerzo por sus compañeros!'],
  ['RADIO · ORILLA DEL SUZHOU', '¡La ciudad entera observa la resistencia de Sihang! Sigan combatiendo en el bulevar entre las ruinas.'],
  ['RADIO · GRAN CANAL', '¡Las líneas japonesas flaquean! Cada calle recuperada acerca la primera gran victoria de la guerra.'],
  ['RADIO · 9.ª ZONA DE GUERRA', '¡El enemigo queda atrapado sin suministros en Changsha! Mantengan el fuego hasta completar el cerco.'],
  ['RADIO NACIONAL · BEIPING Y CHONGQING', '¡Las divisiones invasoras se rinden y retroceden en todos los frentes! ¡El fin de los ocho años de guerra está aquí!']
];
export const WAVE_BANNERS = [
  ['第一幕 · 借口失踪', 'CAPÍTULO 1 · 7 JUL 1937 · LUGOUQIAO'],
  ['第二幕 · 炮击宛平', 'CAPÍTULO 2 · 8 JUL 1937 · WANPING'],
  ['第三幕 · 铁桥夜袭', 'CAPÍTULO 3 · 9 JUL 1937 · PUENTE FERROVIARIO'],
  ['第四幕 · 南苑血战', 'CAPÍTULO 4 · 28 JUL 1937 · NANYUAN'],
  ['第五幕 · 四行仓库', 'CAPÍTULO 5 · OCT 1937 · ALMACÉN SIHANG (SHANGHÁI)'],
  ['第六幕 · 台儿庄大捷', 'CAPÍTULO 6 · ABR 1938 · TAI\'ERZHUANG'],
  ['第七幕 · 长沙大捷', 'CAPÍTULO 7 · 1941 · CHANGSHA (TIANLU)'],
  ['第八幕 · 抗战胜利', 'CAPÍTULO 8 · 1945 · LIBERACIÓN Y VICTORIA FINAL']
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
      { t0:0, t1:4.2, fromPos:[28,9.5,0], toPos:[14,13.5,-8], fromLook:[30,9,0], toLook:[10,8,0],
        tag:'1937–1944 · DE LUGOUQIAO A SHANGHÁI, TAI\'ERZHUANG Y CHANGSHA',
        zh:'卢沟晓月 · 淞沪血战 · 台儿庄 · 长沙大捷',
        sub:'De las barricadas de Marco Polo y el Almacén Sihang al Gran Canal y Changsha, millones de defensores sostuvieron ocho años de guerra total.',
        events:[{ at:0.5, fn:(S)=>S.hooks.spawnArtilleryBlast(8, DECK_TOP, 3.0) }] },
      { t0:4.2, t1:8.4, fromPos:[14,13.5,-8], toPos:[-8,18,-12], fromLook:[-28,10,0], toLook:[-38,11,0],
        tag:'1945 · GRAN CONTRAOFENSIVA Y EXPULSIÓN DEL INVASOR',
        zh:'1945年大反攻 · 驱逐日寇',
        sub:'En la primavera y el verano de 1945 las fuerzas chinas rompen las últimas líneas imperiales en Hunan y recuperan el territorio nacional.',
        events:[{ at:4.6, fn:(S)=>S.hooks.spawnArtilleryBlast(-20, DECK_TOP+1, -2.5) }] },
      { t0:8.4, t1:12.6, fromPos:[-8,18,-12], toPos:[-24,22,-16], fromLook:[-38,11,0], toLook:[-38,9,0],
        tag:'2 DE SEPTIEMBRE – 10 DE OCTUBRE DE 1945 · RENDICIÓN INCONDICIONAL',
        zh:'抗战胜利 · 中华光复',
        sub:'Japón capituló en 1945 y firmó su rendición oficial en Beiping el 10 de octubre de 1945. La bandera china volvió a ondear sobre toda la nación.',
        events:[{ at:8.5, fn:(S)=>{ S.scene.background.setHex(0x2b2430); S.scene.fog.color.setHex(0x2b2430); S.moonLight.color.setHex(0xffe0b2); } }] }
    ]
  }
};
