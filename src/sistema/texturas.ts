import Phaser from 'phaser';
import { ELENCO, EXPRESIONES, MODELOS_PIXEL_ART, type ActorId, type Dibujo, type Expresion } from '../data/personajes';

export const claveRetrato = (id: ActorId, exp: Expresion) => `retrato-${id}-${exp}`;
export const claveSprite = (id: ActorId) => `sprite-${id}`;
export const ACTORES = Object.keys(ELENCO) as ActorId[];

/** Textura del retrato; si esa expresión no existe usa la 'normal'. */
export function retratoDisponible(scene: Phaser.Scene, id: ActorId, exp: Expresion = 'normal') {
  const clave = claveRetrato(id, exp);
  return scene.textures.exists(clave) ? clave : claveRetrato(id, 'normal');
}

/** Escala una imagen para que mida `alto` píxeles, sea del tamaño que sea el modelo original. */
export function escalarAAltura<T extends Phaser.GameObjects.Image>(obj: T, alto: number) {
  obj.setScale(alto / obj.frame.height);
  return obj;
}

/** Escala una imagen para que quepa en un cuadrado de `lado` píxeles. */
export function escalarACaja<T extends Phaser.GameObjects.Image>(obj: T, lado: number) {
  obj.setScale(lado / Math.max(obj.frame.width, obj.frame.height));
  return obj;
}

/** Los modelos que no son pixel art se ven mejor suavizados al escalarlos. */
export function suavizarModelos(scene: Phaser.Scene, claves: string[]) {
  if (MODELOS_PIXEL_ART) return;
  for (const clave of claves) {
    if (scene.textures.exists(clave)) scene.textures.get(clave).setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}

export const TEMAS = {
  jardin: { suelo: [0x2b1d3a, 0x352447], pared: [0x4a2e5c, 0x3a2249] },
  bosque: { suelo: [0x1c2a1e, 0x223526], pared: [0x2c4630, 0x213524] },
  lago: { suelo: [0x1b2540, 0x22304f], pared: [0x2b4668, 0x213853] },
  torre: { suelo: [0x24242c, 0x2c2c36], pared: [0x3b3b48, 0x2e2e3a] },
};
export type Tema = keyof typeof TEMAS;

// ---------- Utilidades de dibujo ----------

type G = Phaser.GameObjects.Graphics;

const PIEL = 0xffe0c8;
const CORAZON = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
const ESTRELLA = [
  '....X....',
  '...XXX...',
  'XXXXXXXXX',
  '.XXXXXXX.',
  '..XXXXX..',
  '.XXX.XXX.',
  'XX.....XX',
];

function nuevaTextura(scene: Phaser.Scene, clave: string, w: number, h: number, dibujar: (g: G) => void) {
  if (scene.textures.exists(clave)) return;
  const g = scene.make.graphics({}, false);
  dibujar(g);
  g.generateTexture(clave, w, h);
  g.destroy();
}

function bitmap(g: G, filas: string[], escala: number, color: number) {
  g.fillStyle(color);
  filas.forEach((fila, y) =>
    [...fila].forEach((c, x) => c === 'X' && g.fillRect(x * escala, y * escala, escala, escala)),
  );
}

const oscurecer = (color: number, cuanto: number) => Phaser.Display.Color.IntegerToColor(color).darken(cuanto).color;

// ---------- Texturas generales ----------

export function crearTexturasBase(scene: Phaser.Scene) {
  const t = (k: string, w: number, h: number, f: (g: G) => void) => nuevaTextura(scene, k, w, h, f);

  t('corazon', 14, 12, (g) => bitmap(g, CORAZON, 2, 0xff0000));
  t('corazon-blanco', 14, 12, (g) => bitmap(g, CORAZON, 2, 0xffffff));
  t('corazon-verde', 14, 12, (g) => bitmap(g, CORAZON, 2, 0x44ff66));

  // Balas
  t('espina', 10, 14, (g) => g.fillStyle(0xa8ff9a).fillTriangle(5, 0, 0, 14, 10, 14));
  t('flecha', 18, 6, (g) => {
    g.fillStyle(0xffffff).fillRect(0, 2, 12, 2);
    g.fillStyle(0xff77cc).fillTriangle(12, 0, 18, 3, 12, 6);
    g.fillStyle(0xcc99ff).fillRect(0, 0, 3, 2).fillRect(0, 4, 3, 2);
  });
  t('sombra', 14, 14, (g) => {
    g.fillStyle(0xb9b9d6).fillCircle(7, 7, 7);
    g.fillStyle(0x4b4b66).fillCircle(7, 7, 3);
  });
  t('bloque', 8, 8, (g) => g.fillStyle(0xffffff).fillRect(0, 0, 8, 8));

  // Huida
  t('roca', 24, 20, (g) => {
    g.fillStyle(0x6b6b78).fillRect(2, 5, 20, 14).fillRect(5, 1, 13, 5);
    g.fillStyle(0x8a8a98).fillRect(5, 6, 8, 4);
  });
  t('sombra-suelo', 32, 12, (g) => g.fillStyle(0x000000, 0.55).fillEllipse(16, 6, 32, 12));

  // Decoración del mapa
  t('flor', 10, 10, (g) => {
    g.fillStyle(0xffd84a).fillRect(3, 0, 4, 3).fillRect(0, 3, 3, 4).fillRect(7, 3, 3, 4).fillRect(3, 7, 4, 3);
    g.fillStyle(0xff9a2a).fillRect(3, 3, 4, 4);
  });
  t('arbusto', 28, 26, (g) => {
    g.fillStyle(0x2f5a2a).fillCircle(9, 16, 9).fillCircle(19, 16, 9).fillCircle(14, 10, 9);
    g.fillStyle(0x3f7a38).fillCircle(12, 9, 4);
    g.fillStyle(0xa8ff9a).fillRect(4, 7, 2, 2).fillRect(22, 9, 2, 2).fillRect(13, 2, 2, 2).fillRect(2, 19, 2, 2).fillRect(24, 19, 2, 2);
  });
  t('cristal', 16, 26, (g) => {
    g.fillStyle(0x7fe8ff).fillTriangle(8, 0, 0, 10, 16, 10).fillRect(0, 10, 16, 10).fillTriangle(0, 20, 16, 20, 8, 26);
    g.fillStyle(0xd9f9ff).fillRect(4, 8, 3, 10);
  });
  t('columna', 26, 60, (g) => {
    g.fillStyle(0x55556a).fillRect(3, 6, 20, 48);
    g.fillStyle(0x6e6e88).fillRect(0, 0, 26, 8).fillRect(0, 52, 26, 8);
    g.fillStyle(0x44445a).fillRect(8, 10, 3, 40).fillRect(15, 10, 3, 40);
  });
  t('letrero', 24, 26, (g) => {
    g.fillStyle(0x6b4a2b).fillRect(10, 12, 4, 14);
    g.fillStyle(0xa6784a).fillRect(0, 0, 24, 14);
    g.fillStyle(0x6b4a2b).fillRect(3, 4, 18, 2).fillRect(3, 8, 14, 2);
  });
  t('estrella', 18, 14, (g) => bitmap(g, ESTRELLA, 2, 0xffe14a));
  t('orbe', 16, 16, (g) => {
    g.fillStyle(0x9fd8ff, 0.4).fillCircle(8, 8, 8);
    g.fillStyle(0xe6f6ff).fillCircle(8, 8, 4);
  });
  t('regalo', 16, 16, (g) => {
    g.fillStyle(0xe63b5a).fillRect(1, 5, 14, 11);
    g.fillStyle(0xffd84a).fillRect(7, 5, 2, 11).fillRect(0, 4, 16, 3).fillRect(4, 0, 3, 4).fillRect(9, 0, 3, 4);
  });
  t('agua', 32, 32, (g) => {
    g.fillStyle(0x2a5f9e).fillRect(0, 0, 32, 32);
    g.fillStyle(0x4f8fd0).fillRect(2, 6, 10, 2).fillRect(18, 20, 10, 2);
  });

  for (const [tema, { suelo, pared }] of Object.entries(TEMAS)) {
    t(`suelo-${tema}`, 32, 32, (g) => {
      g.fillStyle(suelo[0]).fillRect(0, 0, 32, 32);
      g.fillStyle(suelo[1]).fillRect(0, 0, 16, 16).fillRect(16, 16, 16, 16);
    });
    t(`pared-${tema}`, 32, 32, (g) => {
      g.fillStyle(pared[0]).fillRect(0, 0, 32, 32);
      g.fillStyle(pared[1]).fillRect(0, 14, 32, 2).fillRect(0, 30, 32, 2).fillRect(15, 0, 2, 14).fillRect(6, 16, 2, 14);
    });
  }
}

// ---------- Personas (Nott y Vaal) ----------

function cara(g: G, exp: Expresion) {
  g.fillStyle(0x000000);
  if (exp === 'feliz') {
    for (const ox of [0, 28]) g.fillRect(30 + ox, 54, 4, 4).fillRect(34 + ox, 50, 4, 4).fillRect(38 + ox, 54, 4, 4);
  } else if (exp === 'sorprendido') {
    g.fillRect(31, 46, 10, 14).fillRect(59, 46, 10, 14);
  } else {
    g.fillRect(32, 48, 8, 12).fillRect(60, 48, 8, 12);
    g.fillStyle(0xffffff).fillRect(34, 50, 3, 3).fillRect(62, 50, 3, 3);
    g.fillStyle(0x000000);
    if (exp === 'triste') g.fillRect(30, 44, 6, 3).fillRect(36, 41, 6, 3).fillRect(58, 41, 6, 3).fillRect(64, 44, 6, 3);
  }

  if (exp === 'feliz') g.fillRect(40, 70, 4, 4).fillRect(44, 74, 12, 4).fillRect(56, 70, 4, 4);
  else if (exp === 'triste') g.fillRect(40, 76, 4, 4).fillRect(44, 72, 12, 4).fillRect(56, 76, 4, 4);
  else if (exp === 'sorprendido') g.fillRect(45, 70, 10, 10);
  else g.fillRect(44, 72, 12, 3);

  if (exp === 'sonrojado' || exp === 'feliz') g.fillStyle(0xff8fb0).fillRect(26, 64, 10, 5).fillRect(64, 64, 10, 5);
}

function retratoPersona(g: G, color: number, exp: Expresion, pelolargo: boolean) {
  g.fillStyle(color);
  if (pelolargo) g.fillRect(18, 8, 64, 14).fillRect(10, 18, 80, 30).fillRect(10, 48, 14, 40).fillRect(76, 48, 14, 40);
  else g.fillRect(16, 10, 68, 14).fillRect(14, 20, 72, 22).fillRect(18, 40, 6, 14).fillRect(76, 40, 6, 14);
  g.fillStyle(PIEL).fillRect(22, 30, 56, 56);
  g.fillStyle(color).fillRect(22, 26, 56, 10);
  if (!pelolargo) g.fillRect(58, 34, 20, 6);
  cara(g, exp);
}

function spritePersona(g: G, color: number, pelolargo: boolean) {
  g.fillStyle(color);
  if (pelolargo) g.fillRect(4, 0, 16, 4).fillRect(2, 2, 20, 8).fillRect(2, 10, 3, 9).fillRect(19, 10, 3, 9);
  else g.fillRect(3, 0, 18, 4).fillRect(2, 2, 20, 6);
  g.fillStyle(PIEL).fillRect(5, 6, 14, 11);
  g.fillStyle(color).fillRect(5, 4, 14, 3);
  g.fillStyle(0x000000).fillRect(8, 10, 2, 3).fillRect(14, 10, 2, 3);
  g.fillStyle(oscurecer(color, 25)).fillRect(4, 17, 16, 12);
  if (pelolargo) g.fillRect(3, 25, 18, 4);
  g.fillStyle(PIEL).fillRect(1, 18, 3, 8).fillRect(20, 18, 3, 8);
  g.fillStyle(0x2a2a40).fillRect(6, 29, 5, 7).fillRect(13, 29, 5, 7);
}

// ---------- Criaturas del Subsuelo ----------

const RETRATOS: Record<Exclude<Dibujo, 'chico' | 'chica'>, (g: G) => void> = {
  flor: (g) => {
    g.fillStyle(0x3fa34d).fillRect(46, 66, 8, 34).fillEllipse(34, 86, 22, 10).fillEllipse(66, 82, 22, 10);
    g.fillStyle(0xffd84a);
    for (let i = 0; i < 8; i++) g.fillCircle(50 + Math.cos((i * Math.PI) / 4) * 24, 40 + Math.sin((i * Math.PI) / 4) * 24, 13);
    g.fillStyle(0xfff6e0).fillCircle(50, 40, 19);
    g.fillStyle(0x000000).fillRect(41, 33, 5, 8).fillRect(54, 33, 5, 8);
    g.fillRect(44, 49, 12, 3).fillRect(41, 46, 3, 3).fillRect(56, 46, 3, 3);
    g.fillStyle(0xff8fb0).fillRect(35, 43, 5, 3).fillRect(60, 43, 5, 3);
  },
  pez: (g) => {
    g.fillStyle(0x4ab3e0).fillEllipse(46, 52, 72, 50).fillTriangle(76, 52, 98, 30, 98, 74);
    g.fillStyle(0xbfe9ff).fillEllipse(40, 62, 40, 18);
    g.fillStyle(0xffffff).fillCircle(30, 44, 10);
    g.fillStyle(0x000000).fillCircle(28, 44, 5);
    g.fillStyle(0x1f6f99).fillRect(12, 60, 10, 4);
    g.lineStyle(2, 0xbfe9ff).strokeCircle(12, 20, 5).strokeCircle(22, 8, 3);
  },
  orgullo: (g) => {
    g.fillStyle(0x111118).fillCircle(50, 58, 36).fillRect(14, 58, 72, 42);
    g.fillStyle(0x2a2a3a).fillCircle(38, 44, 8);
    g.fillStyle(0xffd700).fillRect(30, 18, 40, 10).fillTriangle(30, 18, 36, 4, 42, 18).fillTriangle(44, 18, 50, 2, 56, 18);
    g.fillTriangle(58, 18, 64, 4, 70, 18);
    g.fillStyle(0xff3b5a).fillRect(48, 21, 4, 4);
    g.fillStyle(0xffffff).fillRect(32, 50, 14, 5).fillRect(54, 50, 14, 5);
    g.fillRect(40, 72, 20, 3).fillRect(58, 68, 3, 4);
  },
  rosal: (g) => {
    g.fillStyle(0x1f4d25).fillRect(8, 62, 84, 38);
    g.fillStyle(0xa8ff9a);
    for (const x of [12, 30, 50, 70, 88]) g.fillTriangle(x - 4, 64, x, 54, x + 4, 64);
    g.fillStyle(0x8c1330).fillCircle(50, 40, 32);
    g.fillStyle(0xd9304f).fillCircle(50, 40, 25);
    g.fillStyle(0xff5a78).fillCircle(46, 36, 14);
    g.fillStyle(0x8c1330).fillCircle(50, 40, 6);
    g.fillStyle(0xffffff).fillTriangle(28, 32, 44, 38, 28, 44).fillTriangle(72, 32, 56, 38, 72, 44);
    g.fillStyle(0x000000).fillRect(33, 36, 5, 5).fillRect(62, 36, 5, 5);
    g.fillStyle(0x3a0a14).fillRect(42, 56, 16, 3);
  },
  cupido: (g) => {
    g.fillStyle(0xdddde8).fillTriangle(0, 28, 26, 42, 8, 72).fillTriangle(100, 28, 74, 42, 92, 72);
    g.lineStyle(4, 0x9b6bff).strokeEllipse(50, 10, 40, 10);
    g.fillStyle(0x7a4bd1).fillCircle(50, 46, 30);
    g.fillStyle(0xf0d0ff).fillCircle(50, 54, 24);
    g.fillStyle(0x7a4bd1).fillRect(26, 28, 48, 14);
    g.fillStyle(0xff2a55).fillRect(38, 50, 7, 5).fillRect(55, 50, 7, 5);
    g.fillStyle(0x000000).fillRect(44, 66, 12, 3).fillRect(41, 68, 3, 3).fillRect(56, 68, 3, 3);
    g.fillStyle(0xffb3d1).fillRect(88, 36, 3, 56);
  },
  olvido: (g) => {
    g.fillStyle(0x3a3a48).fillCircle(50, 50, 48);
    g.fillStyle(0x55556a).fillCircle(50, 50, 36);
    g.fillStyle(0x7a7a90).fillCircle(50, 50, 22);
    g.fillStyle(0x0c0c12).fillCircle(50, 50, 12);
    for (const [x, y] of [[20, 30], [78, 26], [30, 78], [72, 76], [12, 54], [88, 52], [50, 12]]) {
      g.fillStyle(0xffffff).fillEllipse(x, y, 10, 6);
      g.fillStyle(0x000000).fillRect(x - 1, y - 1, 3, 3);
    }
  },
};

const SPRITES: Record<Exclude<Dibujo, 'chico' | 'chica'>, [number, number, (g: G) => void]> = {
  flor: [22, 30, (g) => {
    g.fillStyle(0x3fa34d).fillRect(10, 16, 3, 14).fillRect(4, 22, 6, 3).fillRect(13, 20, 6, 3);
    g.fillStyle(0xffd84a);
    for (let i = 0; i < 6; i++) g.fillCircle(11 + Math.cos((i * Math.PI) / 3) * 6, 8 + Math.sin((i * Math.PI) / 3) * 6, 4);
    g.fillStyle(0xfff6e0).fillCircle(11, 8, 5);
    g.fillStyle(0x000000).fillRect(9, 7, 1, 2).fillRect(12, 7, 1, 2);
  }],
  pez: [30, 20, (g) => {
    g.fillStyle(0x4ab3e0).fillEllipse(12, 10, 24, 16).fillTriangle(22, 10, 30, 2, 30, 18);
    g.fillStyle(0xffffff).fillCircle(7, 8, 3);
    g.fillStyle(0x000000).fillRect(6, 7, 2, 2);
  }],
  orgullo: [36, 44, (g) => {
    g.fillStyle(0x111118).fillCircle(18, 26, 16).fillRect(2, 26, 32, 18);
    g.fillStyle(0xffd700).fillRect(9, 6, 18, 5).fillTriangle(9, 6, 12, 0, 15, 6).fillTriangle(21, 6, 24, 0, 27, 6);
    g.fillStyle(0xffffff).fillRect(10, 22, 6, 2).fillRect(20, 22, 6, 2);
  }],
  rosal: [40, 56, (g) => {
    g.fillStyle(0x1f4d25).fillRect(17, 24, 6, 32).fillRect(6, 34, 11, 5).fillRect(23, 42, 11, 5);
    g.fillStyle(0x8c1330).fillCircle(20, 14, 14);
    g.fillStyle(0xd9304f).fillCircle(20, 14, 10);
    g.fillStyle(0xff5a78).fillCircle(18, 12, 5);
    g.fillStyle(0xffffff).fillRect(12, 12, 5, 3).fillRect(23, 12, 5, 3);
  }],
  cupido: [34, 40, (g) => {
    g.fillStyle(0xdddde8).fillTriangle(0, 10, 12, 16, 4, 28).fillTriangle(34, 10, 22, 16, 30, 28);
    g.fillStyle(0x7a4bd1).fillCircle(17, 10, 9);
    g.fillStyle(0xf0d0ff).fillCircle(17, 12, 7);
    g.fillStyle(0xff2a55).fillRect(13, 11, 2, 2).fillRect(19, 11, 2, 2);
    g.fillStyle(0x3a2a5a).fillRect(11, 20, 12, 14);
    g.fillStyle(0xf0d0ff).fillRect(12, 34, 4, 6).fillRect(18, 34, 4, 6);
  }],
  olvido: [56, 64, (g) => {
    g.fillStyle(0x3a3a48).fillCircle(28, 28, 26).fillRect(6, 28, 44, 26);
    g.fillRect(6, 54, 8, 10).fillRect(20, 54, 8, 8).fillRect(34, 54, 8, 10);
    g.fillStyle(0x55556a).fillCircle(28, 28, 18);
    g.fillStyle(0x0c0c12).fillCircle(28, 28, 8);
    for (const [x, y] of [[12, 16], [44, 14], [10, 40], [46, 40]]) {
      g.fillStyle(0xffffff).fillEllipse(x, y, 6, 4);
      g.fillStyle(0x000000).fillRect(x - 1, y - 1, 2, 2);
    }
  }],
};

/** Crea dibujos provisionales para todo lo que no se haya cargado desde un archivo. */
export function crearPlaceholders(scene: Phaser.Scene) {
  for (const id of ACTORES) {
    const actor = ELENCO[id];
    const persona = actor.dibujo === 'chico' || actor.dibujo === 'chica';
    const largo = actor.dibujo === 'chica';

    if (persona) nuevaTextura(scene, claveSprite(id), 24, 36, (g) => spritePersona(g, actor.color, largo));
    else {
      const [w, h, dibujar] = SPRITES[actor.dibujo as keyof typeof SPRITES];
      nuevaTextura(scene, claveSprite(id), w, h, dibujar);
    }

    // Si pusiste retratos propios, las expresiones que falten usan tu 'normal' en vez de un dibujo provisional
    const tieneRetratos = Object.keys(actor.retratos).length > 0;
    for (const exp of EXPRESIONES) {
      if (exp !== 'normal' && (tieneRetratos || !persona)) continue;
      nuevaTextura(scene, claveRetrato(id, exp), 100, 100, (g) =>
        persona ? retratoPersona(g, actor.color, exp, largo) : RETRATOS[actor.dibujo as keyof typeof RETRATOS](g),
      );
    }
  }
}
