// ✏️ Las zonas que se recorren caminando: diálogos al entrar, letreros, personajes, regalos y jefes.
import type { Linea } from './historia';
import type { ObjetoId } from './objetos';
import type { ActorId, PersonajeId } from './personajes';
import type { Tema } from '../sistema/texturas';

export type TipoInteractivo = 'letrero' | 'npc' | 'estrella' | 'regalo' | 'recuerdo' | 'invisible';
export type TipoDeco = 'flor' | 'arbusto' | 'cristal' | 'columna' | 'orbe';

export interface Interactivo {
  tipo: TipoInteractivo;
  x: number;
  y: number;
  lineas: Linea[];
  /** Lo que dice a partir de la segunda vez. */
  despues?: Linea[];
  actor?: ActorId;
  alto?: number;
  /** Para regalos: qué objeto dan y una clave única para no darlo dos veces. */
  objeto?: ObjetoId;
  clave?: string;
}

export interface Sala {
  tema: Tema;
  ancho: number;
  /** Un lago en la parte de abajo (no se puede caminar ahí). */
  agua?: boolean;
  /** false = Nott y Vaal empiezan separados y hay que reunirse. */
  juntos: boolean;
  inicio: Record<PersonajeId, { x: number; y: number }>;
  alEntrar?: Linea[];
  deco?: { tipo: TipoDeco; cantidad: number }[];
  solidos?: { tipo: TipoDeco; x: number; y: number }[];
  interactivos?: Interactivo[];
  /** Al pasar esta x se avanza a lo siguiente. */
  salida?: number;
  jefe?: { actor: ActorId; x: number; y: number; alto: number; lineas: Linea[] };
  /** Diálogo al reunirse (según quién juega): 1 jugador con Nott, 1 jugador con Vaal, o 2 jugadores. */
  encuentro?: Record<'nott' | 'vaal' | 'dos', Linea[]>;
}

/** Una fila de obstáculos de (x1, y1) a (x2, y2). */
function fila(tipo: TipoDeco, x1: number, y1: number, x2: number, y2: number, paso: number) {
  const n = Math.round(Math.hypot(x2 - x1, y2 - y1) / paso);
  return Array.from({ length: n + 1 }, (_, i) => ({ tipo, x: x1 + ((x2 - x1) * i) / n, y: y1 + ((y2 - y1) * i) / n }));
}

const ESTRELLA: Linea[] = [
  { texto: 'Una estrella brillante. Al tocarla, se sienten llenos de DETERMINACIÓN.' },
  { texto: '(HP restaurado. Partida guardada.)' },
];

const REUNION: Linea[] = [
  { quien: 'vaal', exp: 'feliz', texto: '¡Nott!' },
  { quien: 'nott', exp: 'feliz', texto: '¡Vaal! ¡Estás bien!' },
  { quien: 'vaal', exp: 'normal', texto: 'Sí... aunque...' },
  { quien: 'vaal', exp: 'triste', texto: 'Todavía estoy un poquito enojada contigo.' },
  { quien: 'nott', exp: 'triste', texto: 'Yo también... bueno, ya ni me acuerdo por qué.' },
  { quien: 'vaal', exp: 'sorprendido', texto: '¡Yo tampoco! Pero...' },
];

export const SALAS: Record<string, Sala> = {
  jardin: {
    tema: 'jardin',
    ancho: 640,
    juntos: false,
    inicio: { nott: { x: 110, y: 430 }, vaal: { x: 530, y: 430 } },
    alEntrar: [
      { texto: 'JARDÍN DORMIDO' },
      { quien: 'nott', exp: 'sorprendido', texto: '¿Eh...? ¿Dónde estoy? Esto no es mi cuarto.' },
      { quien: 'vaal', exp: 'sorprendido', texto: '¿Qué es este lugar...? ¿Nott?' },
      { quien: 'nott', exp: 'sorprendido', texto: '¡¿Vaal?! ¡Te escucho! ¿Dónde estás?' },
      { quien: 'vaal', exp: 'triste', texto: '¡Del otro lado de estos arbustos! No puedo pasar...' },
      { solo: 1, texto: '(Busca la forma de llegar hasta tu pareja.)' },
      { solo: 2, texto: '(Cada uno controla a su personaje. ¡Encuentren la forma de reunirse!)' },
    ],
    deco: [{ tipo: 'flor', cantidad: 16 }],
    solidos: fila('arbusto', 320, 200, 320, 470, 26),
    interactivos: [
      {
        tipo: 'letrero',
        x: 190,
        y: 180,
        lineas: [{ texto: 'Letrero: "Jardín Dormido. Aquí despiertan los corazones perdidos."' }],
      },
      {
        tipo: 'letrero',
        x: 450,
        y: 180,
        lineas: [{ texto: 'Letrero: "Cuidado: los arbustos pican. Rodéelos por arriba."' }],
      },
      {
        tipo: 'regalo',
        x: 580,
        y: 250,
        objeto: 'te',
        clave: 'jardin-regalo',
        lineas: [{ texto: 'Hay un regalito entre las flores.' }],
      },
    ],
    encuentro: {
      nott: [
        ...REUNION,
        { quien: 'vaal', exp: 'feliz', texto: '¡No te voy a perdonar tan fácil! ¡Vas a tener que ganarte mi corazón otra vez!' },
      ],
      vaal: [
        ...REUNION,
        { quien: 'nott', exp: 'sonrojado', texto: 'Yo tampoco pienso ceder tan fácil. ¡Si quieres que te perdone, demuéstramelo!' },
        { quien: 'vaal', exp: 'feliz', texto: '¡¿Ah, sí?! ¡Ya vas a ver!' },
      ],
      dos: [
        ...REUNION,
        { temblor: true, texto: 'De pronto, una sombra se levanta entre los dos...' },
        { quien: 'orgullo', texto: '¡Alto ahí! Ninguno de los dos va a pedir perdón primero.' },
        { quien: 'orgullo', texto: '¡Yo soy EL ORGULLO, y me alimento de sus peleas!' },
        { quien: 'nott', exp: 'sorprendido', texto: '¿Y esa cosa de dónde salió?' },
        { quien: 'vaal', exp: 'normal', texto: '¡Nott, tenemos que vencerlo juntos!' },
      ],
    },
  },

  claro: {
    tema: 'jardin',
    ancho: 960,
    juntos: true,
    inicio: { nott: { x: 90, y: 300 }, vaal: { x: 130, y: 350 } },
    alEntrar: [
      { quien: 'vaal', exp: 'sonrojado', texto: '...Te extrañé, ¿sabes?' },
      { quien: 'nott', exp: 'sonrojado', texto: 'Yo más. Aunque solo fueron unas horas.' },
      { quien: 'vaal', exp: 'feliz', texto: '¡Unas horas son muchísimo!' },
      { texto: 'Algo se mueve entre las flores...' },
    ],
    deco: [{ tipo: 'flor', cantidad: 26 }],
    interactivos: [
      {
        tipo: 'npc',
        actor: 'petalo',
        x: 470,
        y: 260,
        alto: 48,
        lineas: [
          { quien: 'petalo', texto: '¡Hola, hola! Soy Pétalo, la flor más amable del Subsuelo.' },
          { quien: 'petalo', texto: 'Así que El Olvido también los trajo aquí... qué mala suerte.' },
          { quien: 'nott', exp: 'normal', texto: '¿Sabes cómo salir de este lugar?' },
          { quien: 'petalo', texto: '¡Claro! Pero no es fácil. Tendrán que pasar a los tres Guardianes.' },
          { quien: 'petalo', texto: 'Rosalía, la Guardiana de Espinas, en el Bosque. El Cupido Oscuro, en el Lago de Cristal.' },
          { quien: 'petalo', texto: 'Y al final... El Olvido, en su Torre.' },
          { quien: 'vaal', exp: 'sorprendido', texto: '¿Al mismísimo Olvido?' },
          { quien: 'petalo', texto: 'Sí. Pero escuchen bien: El Olvido es fuerte contra los corazones solitarios.' },
          { quien: 'petalo', texto: 'Mientras estén juntos, podrán con él. ¡No se suelten!' },
          { quien: 'petalo', texto: 'Ah, y toquen las estrellas brillantes. Recuperan energía y guardan su progreso.' },
        ],
        despues: [{ quien: 'petalo', texto: '¡El Bosque de Espinas está hacia la derecha! ¡Suerte, tortolitos!' }],
      },
      { tipo: 'estrella', x: 280, y: 170, lineas: ESTRELLA },
      {
        tipo: 'regalo',
        x: 760,
        y: 430,
        objeto: 'galleta',
        clave: 'claro-regalo',
        lineas: [{ texto: 'Alguien dejó un regalito aquí.' }],
      },
      {
        tipo: 'letrero',
        x: 880,
        y: 160,
        lineas: [{ texto: 'Letrero: ">> Bosque de Espinas. Prohibido regar sin permiso."' }],
      },
    ],
    salida: 920,
  },

  bosque: {
    tema: 'bosque',
    ancho: 1600,
    juntos: true,
    inicio: { nott: { x: 70, y: 290 }, vaal: { x: 70, y: 350 } },
    alEntrar: [
      { texto: 'BOSQUE DE ESPINAS' },
      { quien: 'vaal', exp: 'triste', texto: 'Qué lugar tan oscuro... todas las rosas están marchitas.' },
      { quien: 'nott', exp: 'normal', texto: 'Quédate cerca de mí.' },
      { quien: 'vaal', exp: 'feliz', texto: 'Eso debería decirlo yo.' },
    ],
    deco: [{ tipo: 'flor', cantidad: 8 }],
    solidos: [
      ...fila('arbusto', 380, 120, 380, 250, 26),
      ...fila('arbusto', 700, 330, 700, 470, 26),
      ...fila('arbusto', 1020, 120, 1020, 260, 26),
      { tipo: 'arbusto', x: 560, y: 420 },
      { tipo: 'arbusto', x: 860, y: 170 },
      { tipo: 'arbusto', x: 1180, y: 430 },
    ],
    interactivos: [
      {
        tipo: 'letrero',
        x: 250,
        y: 160,
        lineas: [
          { texto: 'Letrero: "Las rosas de este bosque se marchitaron el día que su guardiana olvidó quién las plantó."' },
        ],
      },
      {
        tipo: 'invisible',
        x: 560,
        y: 300,
        lineas: [
          { texto: 'Una rosa marchita. Parece muy triste.' },
          { quien: 'vaal', exp: 'triste', texto: 'Pobrecita...' },
        ],
      },
      {
        tipo: 'regalo',
        x: 880,
        y: 440,
        objeto: 'chocolate',
        clave: 'bosque-regalo',
        lineas: [{ texto: 'Entre las espinas hay un regalito.' }],
      },
      { tipo: 'estrella', x: 1200, y: 190, lineas: ESTRELLA },
    ],
    jefe: {
      actor: 'rosalia',
      x: 1480,
      y: 330,
      alto: 110,
      lineas: [
        { quien: 'rosalia', texto: '¿Quién se atreve a pisar mi bosque?' },
        { quien: 'nott', exp: 'normal', texto: 'Solo queremos pasar. Vamos a casa.' },
        { quien: 'rosalia', texto: '¿Casa? Yo también tenía una. Y a alguien que plantaba rosas para mí...' },
        { quien: 'rosalia', texto: '...¿Quién era? ¡No lo recuerdo! ¡El Olvido se lo llevó todo!' },
        { quien: 'rosalia', texto: '¡Si yo no puedo recordar el amor, NADIE saldrá de aquí!' },
        { quien: 'vaal', exp: 'sorprendido', temblor: true, texto: '¡Nott, cuidado!' },
      ],
    },
  },

  lago: {
    tema: 'lago',
    ancho: 1500,
    agua: true,
    juntos: true,
    inicio: { nott: { x: 70, y: 250 }, vaal: { x: 70, y: 320 } },
    alEntrar: [
      { texto: 'LAGO DE CRISTAL' },
      { quien: 'nott', exp: 'triste', texto: 'Rosalía estaba muy sola... ojalá esté mejor.' },
      { quien: 'vaal', exp: 'feliz', texto: 'Seguro que sí. Las flores ya estaban volviendo a abrir.' },
    ],
    deco: [{ tipo: 'cristal', cantidad: 14 }],
    solidos: [
      { tipo: 'cristal', x: 420, y: 180 },
      { tipo: 'cristal', x: 440, y: 200 },
      { tipo: 'cristal', x: 900, y: 330 },
      { tipo: 'cristal', x: 920, y: 350 },
    ],
    interactivos: [
      {
        tipo: 'npc',
        actor: 'glup',
        x: 560,
        y: 390,
        alto: 40,
        lineas: [
          { quien: 'glup', texto: '¡Glup! ¡Visitantes! ¡Glup!' },
          { quien: 'glup', texto: '¿Van a ver al Cupido Oscuro? Glup...' },
          { quien: 'glup', texto: 'Antes era el cupido más dulce del Subsuelo. Unía corazones.' },
          { quien: 'glup', texto: 'Pero El Olvido le hizo olvidar para qué sirve el amor.' },
          { quien: 'glup', texto: 'Ahora dispara flechas que SEPARAN a las parejas. ¡Glup!' },
          { quien: 'glup', texto: 'Si los ataca... ¡no se suelten de la mano!' },
        ],
        despues: [{ quien: 'glup', texto: 'Glup. (Glup está haciendo burbujas en forma de corazón.)' }],
      },
      {
        tipo: 'invisible',
        x: 820,
        y: 390,
        lineas: [
          { texto: 'Se asoman al lago. Ven sus reflejos, uno al lado del otro.' },
          { quien: 'vaal', exp: 'feliz', texto: 'Nos vemos bien juntos, ¿no?' },
          { quien: 'nott', exp: 'sonrojado', texto: 'Tú te ves bien. Yo solo salgo al lado.' },
          { quien: 'vaal', exp: 'sonrojado', texto: 'Tonto.' },
        ],
      },
      {
        tipo: 'regalo',
        x: 300,
        y: 160,
        objeto: 'bombon',
        clave: 'lago-regalo',
        lineas: [{ texto: 'Un regalito brilla junto a los cristales.' }],
      },
      { tipo: 'estrella', x: 1100, y: 200, lineas: ESTRELLA },
    ],
    jefe: {
      actor: 'cupido',
      x: 1390,
      y: 290,
      alto: 90,
      lineas: [
        { quien: 'cupido', texto: 'Vaya, vaya... una parejita.' },
        { quien: 'cupido', texto: '¿Saben cuántas parejas he separado? Ya perdí la cuenta.' },
        { quien: 'vaal', exp: 'triste', texto: '¿Por qué haces eso?' },
        { quien: 'cupido', texto: 'Porque el amor duele. Si nadie ama, nadie sufre. Así de simple.' },
        { quien: 'nott', exp: 'normal', texto: 'Eso no es cierto.' },
        { quien: 'cupido', temblor: true, texto: '¡Entonces demuéstrenlo!' },
      ],
    },
  },

  torre: {
    tema: 'torre',
    ancho: 1600,
    juntos: true,
    inicio: { nott: { x: 70, y: 280 }, vaal: { x: 70, y: 340 } },
    alEntrar: [
      { texto: 'TORRE DEL OLVIDO' },
      { quien: 'vaal', exp: 'triste', texto: 'Hace frío aquí... siento que se me olvidan cosas.' },
      { quien: 'nott', exp: 'normal', texto: 'Vaal, mírame. ¿Te acuerdas de mí?' },
      { quien: 'vaal', exp: 'feliz', texto: 'Eres el tonto que me roba las cobijas.' },
      { quien: 'nott', exp: 'feliz', texto: 'Esa es mi chica.' },
      { texto: 'Hay recuerdos flotando en el aire. Tal vez deberían verlos.' },
    ],
    deco: [{ tipo: 'orbe', cantidad: 10 }],
    solidos: [
      { tipo: 'columna', x: 300, y: 170 },
      { tipo: 'columna', x: 300, y: 460 },
      { tipo: 'columna', x: 650, y: 170 },
      { tipo: 'columna', x: 650, y: 460 },
      { tipo: 'columna', x: 1000, y: 170 },
      { tipo: 'columna', x: 1000, y: 460 },
    ],
    // ✏️ Cambia estos recuerdos por recuerdos reales de ustedes dos
    interactivos: [
      {
        tipo: 'recuerdo',
        x: 450,
        y: 230,
        lineas: [
          { texto: 'Un recuerdo flota en el aire... Es el día en que se conocieron.' },
          { quien: 'vaal', exp: 'sonrojado', texto: 'Estabas tan nervioso que no podías ni hablar.' },
          { quien: 'nott', exp: 'sonrojado', texto: '¡No es cierto! ...Bueno, un poquito.' },
        ],
      },
      {
        tipo: 'recuerdo',
        x: 800,
        y: 360,
        lineas: [
          { texto: 'Otro recuerdo... Su primera cita.' },
          { quien: 'nott', exp: 'triste', texto: 'Llegué tarde y tú me esperaste igual.' },
          { quien: 'vaal', exp: 'feliz', texto: 'Siempre te voy a esperar.' },
        ],
      },
      {
        tipo: 'recuerdo',
        x: 1150,
        y: 220,
        lineas: [
          { texto: 'Este recuerdo brilla más que los otros... La primera vez que se dijeron "te quiero".' },
          { quien: 'vaal', exp: 'feliz', texto: 'Ese día lo supe.' },
          { quien: 'nott', exp: 'sorprendido', texto: '¿Qué cosa?' },
          { quien: 'vaal', exp: 'sonrojado', texto: 'Que eras tú.' },
        ],
      },
      {
        tipo: 'regalo',
        x: 560,
        y: 440,
        objeto: 'pastel',
        clave: 'torre-regalo',
        lineas: [{ texto: 'Un regalito olvidado en un rincón.' }],
      },
      { tipo: 'estrella', x: 1300, y: 400, lineas: ESTRELLA },
    ],
    jefe: {
      actor: 'olvido',
      x: 1490,
      y: 330,
      alto: 130,
      lineas: [
        { quien: 'olvido', texto: 'Así que llegaron hasta aquí.' },
        { quien: 'olvido', texto: 'Rosalía. El Cupido. Todos cayeron.' },
        { quien: 'olvido', texto: 'Pero yo soy distinto. Yo soy lo que queda cuando el amor se apaga.' },
        { quien: 'olvido', texto: 'Todo se olvida. Las citas. Las risas. Los "te quiero".' },
        { quien: 'nott', exp: 'normal', texto: 'Lo nuestro no.' },
        { quien: 'vaal', exp: 'normal', texto: '¡Nunca lo nuestro!' },
        { quien: 'olvido', temblor: true, texto: 'Eso dicen todos... ¡al principio!' },
      ],
    },
  },
};
