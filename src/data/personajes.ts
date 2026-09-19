export const EXPRESIONES = ['normal', 'feliz', 'sonrojado', 'triste', 'sorprendido'] as const;
export type Expresion = (typeof EXPRESIONES)[number];

export type PersonajeId = 'nott' | 'vaal';
export type ActorId = PersonajeId | 'petalo' | 'glup' | 'orgullo' | 'rosalia' | 'cupido' | 'olvido';
/** Qué dibujo provisional usar mientras no haya imagen propia. */
export type Dibujo = 'chico' | 'chica' | 'flor' | 'pez' | 'orgullo' | 'rosal' | 'cupido' | 'olvido';

export interface Actor {
  nombre: string;
  /** Color principal del dibujo provisional. */
  color: number;
  /** Tono del "bip" al hablar, en Hz. Más alto = voz más aguda. */
  voz: number;
  dibujo: Dibujo;
  /** Color del alma en las batallas (solo Nott y Vaal). */
  alma?: number;
  /** Imagen de cuerpo completo para el mapa (opcional). */
  sprite?: string;
  /** Retratos para los diálogos. Si falta una expresión se usa 'normal'. */
  retratos: Partial<Record<Expresion, string>>;
}

/** true si tus modelos son pixel art (bordes nítidos); false si son ilustraciones (suavizado). */
export const MODELOS_PIXEL_ART = false;

// Cuando tengas los modelos, ponlos en public/assets/personajes/<id>/ y agrega las rutas, por ejemplo:
//   sprite: 'assets/personajes/vaal/sprite.png',
//   retratos: {
//     normal: 'assets/personajes/vaal/normal.png',
//     feliz: 'assets/personajes/vaal/feliz.png',
//   },
export const ELENCO: Record<ActorId, Actor> = {
  nott: { nombre: 'Nott', color: 0x3b6fd8, voz: 300, dibujo: 'chico', alma: 0xff3030, retratos: {} },
  vaal: { nombre: 'Vaal', color: 0xe94f8a, voz: 540, dibujo: 'chica', alma: 0xff80e0, retratos: {} },

  petalo: { nombre: 'Pétalo', color: 0xffd84a, voz: 720, dibujo: 'flor', retratos: {} },
  glup: { nombre: 'Glup', color: 0x4ab3e0, voz: 820, dibujo: 'pez', retratos: {} },

  orgullo: { nombre: 'El Orgullo', color: 0x111118, voz: 180, dibujo: 'orgullo', retratos: {} },
  rosalia: { nombre: 'Rosalía', color: 0xd9304f, voz: 440, dibujo: 'rosal', retratos: {} },
  cupido: { nombre: 'Cupido Oscuro', color: 0x7a4bd1, voz: 640, dibujo: 'cupido', retratos: {} },
  olvido: { nombre: 'El Olvido', color: 0x8a8a9a, voz: 130, dibujo: 'olvido', retratos: {} },
};

export const JUGABLES: PersonajeId[] = ['nott', 'vaal'];
export const pareja = (id: PersonajeId): PersonajeId => (id === 'nott' ? 'vaal' : 'nott');
