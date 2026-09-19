// ✏️ Aquí van las escenas de historia, el final y los créditos. Cámbialos como quieras.
import type { ActorId, Expresion } from './personajes';

export interface Linea {
  /** Quién habla. Si se omite, es el narrador (sin retrato). */
  quien?: ActorId;
  exp?: Expresion;
  texto: string;
  /** Mostrar solo en modo 1 jugador o solo en modo 2 jugadores. */
  solo?: 1 | 2;
  /** Cambia el fondo de la escena de historia (ver CinematicaScene). */
  fondo?: Fondo;
  /** Sacude la pantalla al mostrar la línea. */
  temblor?: boolean;
}

export type Fondo = 'negro' | 'noche' | 'sombra' | 'subsuelo' | 'derrumbe' | 'luz' | 'manana';

export const TITULO = 'Nuestra Historia';
export const SUBTITULO = 'Nott y Vaal en el Subsuelo de los Corazones';

export const CINEMATICAS: Record<string, Linea[]> = {
  prologo: [
    { fondo: 'noche', texto: 'Esta es la historia de Nott y Vaal.' },
    { texto: 'Dos corazones que, pasara lo que pasara, siempre encontraban el camino de vuelta el uno al otro.' },
    { texto: 'Pero una noche, discutieron.' },
    { texto: 'Por algo tan pequeño... que ninguno de los dos podría recordar qué fue.' },
    { texto: 'Se fueron a dormir enojados, dándose la espalda.' },
    { quien: 'nott', exp: 'triste', texto: '(...Tal vez debí pedirle perdón.)' },
    { quien: 'vaal', exp: 'triste', texto: '(...Tal vez debí abrazarlo.)' },
    { fondo: 'sombra', temblor: true, texto: 'Y en la oscuridad, algo los estaba escuchando.' },
    { quien: 'olvido', texto: 'Mmm... qué delicia. Un corazón partido en dos.' },
    { quien: 'olvido', texto: 'Me los llevaré al Subsuelo de los Corazones.' },
    { quien: 'olvido', texto: 'Allí abajo, poco a poco... se olvidarán el uno del otro.' },
    { quien: 'olvido', texto: 'Para siempre. Jejejeje...' },
    { fondo: 'negro', texto: '...' },
    { fondo: 'subsuelo', texto: 'Cuando despertaron, ya no estaban en casa.' },
  ],

  derrumbe: [
    { fondo: 'derrumbe', temblor: true, texto: 'Sin El Olvido, el Subsuelo empezó a temblar.' },
    { quien: 'petalo', texto: '¡Nott! ¡Vaal! ¡Todo se está derrumbando!' },
    { quien: 'petalo', texto: '¡La salida está al final del túnel! ¡CORRAN y no se suelten!' },
    { quien: 'vaal', exp: 'sorprendido', texto: '¡Nott, dame la mano!' },
    { quien: 'nott', exp: 'feliz', temblor: true, texto: '¡Nunca te la voy a soltar!' },
  ],

  despertar: [
    { fondo: 'luz', texto: 'Corrieron hacia la luz, tomados de la mano...' },
    { fondo: 'manana', texto: 'Y entonces... despertaron.' },
    { texto: 'Era de mañana. El sol entraba por la ventana.' },
    { texto: 'Y esta vez, estaban abrazados.' },
    { quien: 'vaal', exp: 'sonrojado', texto: '...¿Nott? Tuve un sueño rarísimo.' },
    { quien: 'nott', exp: 'sorprendido', texto: '¿Con una flor que habla y un cupido emo?' },
    { quien: 'vaal', exp: 'sorprendido', texto: '¡¿Tú también?!' },
    { quien: 'nott', exp: 'normal', texto: 'Oye, Vaal... perdón por lo de anoche.' },
    { quien: 'vaal', exp: 'feliz', texto: 'Perdóname tú a mí. Ni siquiera me acuerdo por qué peleamos.' },
    { quien: 'nott', exp: 'feliz', texto: 'Yo tampoco. Solo me acuerdo de que te quiero.' },
    { quien: 'vaal', exp: 'sonrojado', texto: 'Tonto... yo también te quiero.' },
  ],
};

export const FINAL = {
  mensaje: 'Feliz San Valentín',
  /** La carta que aparece al empezar los créditos. */
  tituloCarta: 'Para Vaal',
  carta: `Hay días en los que simplemente me detengo a pensar en ti, y siento que el pecho se me llena de algo que no sé nombrar del todo… tal vez sea esto: amarte tanto que hasta duele un poco.

A pesar de todo lo que hemos pasado, de cada obstáculo, de cada momento difícil, sigo aquí, eligiéndote, deseándote, anhelando cada instante a tu lado como si fuera el primero. No es solo que te amo — es que te extraño incluso cuando estás cerca, porque siempre quiero más de ti, más de nosotros.

Quiero estar siempre contigo. No como una promesa vacía, sino como algo que siento en lo más profundo: que mi vida sabe mejor cuando la comparto contigo. Que mis días tienen sentido cuando pienso en construir un futuro a tu lado.

Eres mi calma y mi anhelo al mismo tiempo, Vaal. Y hoy, en San Valentín, solo quiero que sepas que te amo demasiado, que me importas más de lo que las palabras alcanzan a decir, y que no hay nada — nada — que cambie lo que siento por ti.

Te amo, mi chica. Siempre.

Gracias por ser mi persona favorita, te amo muchisimo`,
  dedicatoria: 'Gracias por ser mi persona favorita.\nTe quiero muchísimo.',
  creditos: [
    'NUESTRA HISTORIA',
    '',
    '- Protagonistas -',
    'Nott',
    'Vaal',
    '',
    '- Guardianes -',
    'El Orgullo',
    'Rosalía, Guardiana de Espinas',
    'Cupido Oscuro',
    'El Olvido',
    '',
    '- Participación especial -',
    'Pétalo',
    'Glup',
    '',
    'Hecho con todo el amor del mundo',
    '',
    '',
    'Gracias por jugar',
  ],
};
