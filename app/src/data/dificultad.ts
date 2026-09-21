// ✏️ Los niveles de dificultad. "Fácil" es el juego tal cual; los otros multiplican estos números.
// Cada nivel tiene además un ajuste extra que solo se aplica al jefe final (El Olvido).

export interface Ajustes {
  /** Vida de los enemigos. */
  vida: number;
  /** Daño que reciben Nott y Vaal. */
  dano: number;
  /** Qué tan seguido dispara el enemigo. */
  intensidad: number;
  /** Velocidad de las balas. */
  velocidad: number;
  /** Cuánto dura cada ataque. */
  duracion: number;
  /** Cuánto llenan la barra de PIEDAD las acciones de ACTUAR. */
  piedad: number;
  /** Ataques simultáneos de más. */
  ataquesExtra: number;
}

export interface Dificultad {
  nombre: string;
  descripcion: string;
  color: string;
  ajustes: Ajustes;
  /** Se multiplica encima de `ajustes`, solo en la batalla contra El Olvido. */
  jefeFinal: Partial<Ajustes>;
}

export type DificultadId = 'facil' | 'normal' | 'dificil';

export const DIFICULTADES: Record<DificultadId, Dificultad> = {
  facil: {
    nombre: 'Fácil',
    descripcion: 'Para disfrutar la historia sin apuros.\nLos ataques son lentos y perdonan.',
    color: '#7fe8a0',
    ajustes: { vida: 1, dano: 1, intensidad: 1, velocidad: 1, duracion: 1, piedad: 1, ataquesExtra: 0 },
    jefeFinal: { vida: 0.85, dano: 0.8, intensidad: 0.9, duracion: 0.85 },
  },
  normal: {
    nombre: 'Normal',
    descripcion: 'Hay que esquivar de verdad.\nEl último jefe se pone serio.',
    color: '#ffd84a',
    ajustes: { vida: 1.15, dano: 1.2, intensidad: 1.15, velocidad: 1.1, duracion: 1.1, piedad: 0.85, ataquesExtra: 0 },
    jefeFinal: { vida: 1.05, dano: 1.05, intensidad: 1.1, duracion: 1.05, ataquesExtra: 1 },
  },
  dificil: {
    nombre: 'Difícil',
    descripcion: 'Balas rápidas y sin descanso.\nEl Olvido no perdona nada.',
    color: '#ff5a78',
    ajustes: { vida: 1.35, dano: 1.45, intensidad: 1.3, velocidad: 1.2, duracion: 1.2, piedad: 0.7, ataquesExtra: 1 },
    jefeFinal: { vida: 1.1, dano: 1.1, intensidad: 1.15, velocidad: 1.1, duracion: 1.1, ataquesExtra: 1 },
  },
};

export const ORDEN_DIFICULTAD: DificultadId[] = ['facil', 'normal', 'dificil'];

/** Los ajustes del nivel elegido, con el extra del jefe final si corresponde. */
export function ajustesDe(id: DificultadId, esJefeFinal: boolean): Ajustes {
  const d = DIFICULTADES[id];
  if (!esJefeFinal) return d.ajustes;
  const extra = d.jefeFinal;
  const combinar = (clave: keyof Ajustes) =>
    clave === 'ataquesExtra'
      ? d.ajustes.ataquesExtra + (extra.ataquesExtra ?? 0)
      : d.ajustes[clave] * (extra[clave] ?? 1);
  return {
    vida: combinar('vida'),
    dano: combinar('dano'),
    intensidad: combinar('intensidad'),
    velocidad: combinar('velocidad'),
    duracion: combinar('duracion'),
    piedad: combinar('piedad'),
    ataquesExtra: combinar('ataquesExtra'),
  };
}
