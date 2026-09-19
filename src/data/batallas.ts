// ✏️ Las batallas: acciones de ACTUAR, respuestas, ataques y textos de victoria.
// En los textos, {actor} es quien actúa y {pareja} es el otro personaje.
import type { ObjetoId } from './objetos';
import type { ActorId, Expresion, PersonajeId } from './personajes';

export type Patron = 'lluvia' | 'lados' | 'apuntado' | 'enredaderas' | 'muros' | 'espiral';

export interface AccionBatalla {
  nombre: string;
  narracion: string[];
  /** Lo que responde el enemigo en su globo de diálogo. */
  respuesta?: string;
  exp?: Expresion;
  /** Cuánto llena la barra de PIEDAD/AMOR (100 = se puede perdonar). */
  piedad: number;
}

export interface DefBatalla {
  enemigo: ActorId;
  tamano: number;
  /** Vida del enemigo. 0 = no se le puede hacer daño (LUCHAR usa `luchar`). */
  hp: number;
  /** Daño que hace cada ataque. */
  ataque: number;
  /** Si es false, los HP nunca bajan de 1. */
  puedePerder: boolean;
  etiqueta: 'AMOR' | 'PIEDAD';
  bala: string;
  patrones: Patron[];
  /** Cuántos ataques lanza a la vez (1 por defecto). */
  simultaneos?: number;
  /** Multiplica qué tan seguido dispara (1 = normal). */
  intensidad?: number;
  /** Multiplica la velocidad de las balas (1 = normal). */
  velocidadBalas?: number;
  /** Cuánto dura cada ataque, en ms (6000 por defecto). */
  duracionAtaque?: number;
  inicio: string;
  textosMenu: string[];
  textoLleno: string;
  acciones: AccionBatalla[];
  luchar?: AccionBatalla;
  respuestas: string[];
  huir?: string[];
  /** A partir de cierta vida, el enemigo cambia de ataques. */
  fase2?: {
    umbral: number;
    dialogo: string[];
    patrones: Patron[];
    respuestas: string[];
    simultaneos?: number;
    /** Daño extra por golpe en la segunda fase (1 por defecto). */
    danoExtra?: number;
  };
  victoriaPerdonar: string[];
  victoriaDerrotar: string[];
  premio?: ObjetoId;
}

/** En modo 1 jugador, a veces tu pareja te ayuda durante las batallas contra los jefes. */
export const APOYO: Record<PersonajeId, { texto: string; cura?: number }[]> = {
  vaal: [
    { texto: 'Vaal te grita: "¡Tú puedes, Nott!"' },
    { texto: 'Vaal te lanza un beso. ¡Recuperas 4 HP!', cura: 4 },
    { texto: 'Vaal te aprieta la mano. ¡Recuperas 3 HP!', cura: 3 },
  ],
  nott: [
    { texto: 'Nott te grita: "¡Vamos, Vaal! ¡Eres la mejor!"' },
    { texto: 'Nott te da un besito en la frente. ¡Recuperas 4 HP!', cura: 4 },
    { texto: 'Nott se pone delante de ti para cubrirte. ¡Recuperas 3 HP!', cura: 3 },
  ],
};

export const BATALLAS: Record<string, DefBatalla> = {
  // ---------- Reencuentro, modo 1 jugador jugando con Nott ----------
  'perdon-vaal': {
    enemigo: 'vaal',
    tamano: 150,
    hp: 0,
    ataque: 3,
    puedePerder: false,
    etiqueta: 'AMOR',
    bala: 'corazon-blanco',
    patrones: ['lluvia', 'lados', 'lluvia', 'lados'],
    inicio: '¡Vaal bloquea el camino... con una sonrisa!',
    textosMenu: [
      'Vaal se cruza de brazos... pero sonríe.',
      'Vaal intenta seguir enojada. No le está funcionando.',
      'Huele a chocolate y flores.',
      'Tu corazón late muy rápido.',
    ],
    textoLleno: 'Vaal te mira con ojos brillantes. ¡Ya puedes PERDONAR!',
    luchar: {
      nombre: 'Luchar',
      narracion: ['Levantas la mano para atacar...', '...pero terminas acariciándole el cabello.'],
      respuesta: '¿Eso era un ataque? Jeje.',
      exp: 'feliz',
      piedad: 10,
    },
    acciones: [
      {
        nombre: 'Pedir perdón',
        narracion: ['Le dices: "Perdóname, Vaal. Fui un tonto."'],
        respuesta: '...Sí fuiste un tonto. Pero eres MI tonto.',
        exp: 'sonrojado',
        piedad: 30,
      },
      {
        nombre: 'Abrazar',
        narracion: ['La abrazas fuerte, fuerte.'],
        respuesta: '¡Suéltame! ...No, no me sueltes.',
        exp: 'feliz',
        piedad: 30,
      },
      {
        nombre: 'Halagar',
        narracion: ['Le dices que tiene la sonrisa más bonita del mundo.'],
        respuesta: '¡¿Q-qué cosas dices?!',
        exp: 'sonrojado',
        piedad: 25,
      },
      {
        nombre: 'Chiste',
        narracion: ['Le cuentas un chiste malísimo.', '...', '......'],
        respuesta: 'Jajaja, ¡qué malo! Pero me hizo reír.',
        exp: 'feliz',
        piedad: 20,
      },
    ],
    respuestas: ['¡No me vas a convencer tan fácil!', 'Jeje, ¡esquiva esto!', 'Hmph.', '...Un poquito más y te perdono.'],
    huir: ['Intentas huir...', 'pero tu corazón no quiere irse de aquí.'],
    victoriaPerdonar: ['Perdonaste a Vaal.', 'Y Vaal te perdonó a ti.', '¡GANASTE! Obtuviste 0 EXP y un corazón entero.'],
    victoriaDerrotar: [],
  },

  // ---------- Reencuentro, modo 1 jugador jugando con Vaal ----------
  'perdon-nott': {
    enemigo: 'nott',
    tamano: 150,
    hp: 0,
    ataque: 3,
    puedePerder: false,
    etiqueta: 'AMOR',
    bala: 'corazon-blanco',
    patrones: ['lados', 'lluvia', 'lados', 'lluvia'],
    inicio: '¡Nott bloquea el camino! ...Y trata de verse serio.',
    textosMenu: [
      'Nott finge estar serio. No le sale.',
      'Nott mira para otro lado. Se está sonrojando.',
      'Huele a chocolate y flores.',
      'Tu corazón late muy rápido.',
    ],
    textoLleno: 'Nott te mira como si fueras lo más bonito del mundo. ¡Ya puedes PERDONAR!',
    luchar: {
      nombre: 'Luchar',
      narracion: ['Levantas la mano para atacar...', '...pero terminas pellizcándole un cachete.'],
      respuesta: '¡Auch! ...Eso fue tierno.',
      exp: 'feliz',
      piedad: 10,
    },
    acciones: [
      {
        nombre: 'Pedir perdón',
        narracion: ['Le dices: "Perdóname, Nott. Me enojé por nada."'],
        respuesta: '...Yo también me enojé por nada. Perdóname tú.',
        exp: 'sonrojado',
        piedad: 30,
      },
      {
        nombre: 'Abrazar',
        narracion: ['Lo abrazas por sorpresa.'],
        respuesta: '¡E-eso es trampa!',
        exp: 'sonrojado',
        piedad: 30,
      },
      {
        nombre: 'Halagar',
        narracion: ['Le dices que es el chico más lindo del universo.'],
        respuesta: '¿D-de verdad? ...Dilo otra vez.',
        exp: 'feliz',
        piedad: 25,
      },
      {
        nombre: 'Puchero',
        narracion: ['Haces tu mejor puchero.'],
        respuesta: '¡No! ¡El puchero no! ¡Es mi debilidad!',
        exp: 'sorprendido',
        piedad: 25,
      },
    ],
    respuestas: ['¡No me vas a convencer tan fácil!', '¡Esquiva esto!', 'Hmph.', '...Casi, casi te perdono.'],
    huir: ['Intentas huir...', 'pero tu corazón no quiere irse de aquí.'],
    victoriaPerdonar: ['Perdonaste a Nott.', 'Y Nott te perdonó a ti.', '¡GANASTE! Obtuviste 0 EXP y un corazón entero.'],
    victoriaDerrotar: [],
  },

  // ---------- Reencuentro, modo 2 jugadores ----------
  orgullo: {
    enemigo: 'orgullo',
    tamano: 160,
    hp: 70,
    ataque: 3,
    puedePerder: true,
    etiqueta: 'PIEDAD',
    bala: 'sombra',
    patrones: ['lluvia', 'lados', 'apuntado'],
    inicio: '¡EL ORGULLO se interpone entre Nott y Vaal!',
    textosMenu: [
      'El Orgullo se infla como un globo.',
      'El Orgullo dice que pedir perdón es de débiles.',
      'El Orgullo se acomoda la corona.',
    ],
    textoLleno: 'El Orgullo es del tamaño de una pasa. ¡Ya pueden PERDONAR!',
    acciones: [
      {
        nombre: 'Pedir perdón',
        narracion: ['{actor} le pide perdón a {pareja}, en voz alta.', 'El Orgullo se encoge.'],
        respuesta: '¡N-no! ¡No se pidan perdón!',
        piedad: 30,
      },
      {
        nombre: 'Tomar mano',
        narracion: ['{actor} le toma la mano a {pareja}.', 'El Orgullo no sabe qué hacer.'],
        respuesta: '¡Suéltense! ¡Qué asco, tanto amor!',
        piedad: 25,
      },
      {
        nombre: 'Reírse',
        narracion: ['{actor} mira a {pareja}... y se echan a reír sin razón.'],
        respuesta: '¡¿De qué se ríen?! ¡Esto es serio!',
        piedad: 25,
      },
      {
        nombre: 'Ignorarlo',
        narracion: ['{actor} ignora al Orgullo por completo.'],
        respuesta: '¡Oigan! ¡Préstenme atención!',
        piedad: 15,
      },
    ],
    respuestas: ['¡Nadie pide perdón primero!', '¡Tú tienes la razón! ¡No, tú! ¡Peleen!', 'Mi corona brilla con sus peleas.'],
    victoriaPerdonar: [
      'El Orgullo se hace chiquito, chiquito...',
      '...hasta desaparecer.',
      'Nott y Vaal se miran. Ya no queda nada que perdonar.',
    ],
    victoriaDerrotar: ['El Orgullo se rompe como un espejo.', 'Nott y Vaal se miran. Ya no queda nada que perdonar.'],
  },

  // ---------- Jefe 1 ----------
  rosalia: {
    enemigo: 'rosalia',
    tamano: 170,
    hp: 100,
    ataque: 4,
    puedePerder: true,
    etiqueta: 'PIEDAD',
    bala: 'espina',
    patrones: ['lluvia', 'enredaderas', 'lados', 'enredaderas'],
    inicio: '¡Rosalía, la Guardiana de Espinas, les cierra el paso!',
    textosMenu: [
      'Rosalía agita sus espinas.',
      'Los pétalos de Rosalía están secos.',
      'Huele a tierra mojada... y a tristeza.',
    ],
    textoLleno: 'Las espinas de Rosalía se ablandan. ¡Ya pueden PERDONAR!',
    acciones: [
      {
        nombre: 'Regar',
        narracion: ['{actor} riega las rosas marchitas con cuidado.'],
        respuesta: '¿Q-qué haces? ...Hace tanto que nadie me regaba.',
        piedad: 25,
      },
      {
        nombre: 'Elogiar',
        narracion: ['{actor} le dice que sus espinas son muy elegantes.'],
        respuesta: '¿Elegantes? ...Nadie me había dicho eso.',
        piedad: 20,
      },
      {
        nombre: 'Preguntar',
        narracion: ['{actor} le pregunta quién plantó su jardín.'],
        respuesta: 'Alguien... alguien que me quería. ¡No lo recuerdo!',
        piedad: 20,
      },
      {
        nombre: 'Cantar',
        narracion: ['Nott y Vaal le cantan una canción de cuna a las flores.'],
        respuesta: 'Esa canción... ella me la cantaba...',
        piedad: 30,
      },
    ],
    respuestas: ['¡Fuera de mi bosque!', '¡Mis espinas nunca olvidan!', 'Todo se marchita al final.'],
    huir: ['¡No pueden huir!', 'La salida está detrás de Rosalía.'],
    victoriaPerdonar: [
      'Rosalía recuerda...',
      'Era su amada quien plantaba las rosas. Y cada rosa era un "te quiero".',
      'ROSALÍA: Gracias... ya me acuerdo de ella.',
      'Las rosas del bosque vuelven a florecer.',
    ],
    victoriaDerrotar: ['Rosalía se deshace en pétalos...', 'ROSALÍA: ...Qué cansada estaba. Gracias.'],
    premio: 'rosa',
  },

  // ---------- Jefe 2 ----------
  cupido: {
    enemigo: 'cupido',
    tamano: 160,
    hp: 120,
    ataque: 4,
    puedePerder: true,
    etiqueta: 'PIEDAD',
    bala: 'flecha',
    patrones: ['apuntado', 'lados', 'espiral', 'apuntado'],
    inicio: '¡El Cupido Oscuro tensa su arco!',
    textosMenu: [
      'El Cupido Oscuro bosteza. Separar parejas es aburrido.',
      'Las flechas del Cupido brillan de color púrpura.',
      'El Cupido Oscuro evita mirarlos.',
    ],
    textoLleno: 'El Cupido Oscuro baja la mirada. ¡Ya pueden PERDONAR!',
    acciones: [
      {
        nombre: 'Tomar mano',
        narracion: ['Nott y Vaal se toman de la mano.', 'Las flechas del Cupido no pueden pasar entre ellos.'],
        respuesta: '¡¿Qué?! ¡¿Por qué no funcionan mis flechas?!',
        piedad: 30,
      },
      {
        nombre: 'Preguntar',
        narracion: ['{actor} le pregunta por qué dejó de unir corazones.'],
        respuesta: 'Porque... ya no me acuerdo cómo se sentía.',
        piedad: 20,
      },
      {
        nombre: 'Mostrarle',
        narracion: ['{actor} le muestra cómo mira a {pareja}.'],
        respuesta: 'Esa mirada... yo antes hacía que la gente mirara así.',
        piedad: 25,
      },
      {
        nombre: 'Invitar',
        narracion: ['{actor} lo invita a comer chocolate con ustedes.'],
        respuesta: '¿Chocolate? ¿Con los dos? ...Bueno, un poquito.',
        piedad: 20,
      },
    ],
    respuestas: ['¡El amor es un error!', '¡Sepárense!', 'Mis flechas nunca fallan... casi.'],
    huir: ['¡No pueden huir!', 'La salida está detrás del Cupido.'],
    victoriaPerdonar: [
      'El Cupido Oscuro baja su arco.',
      'CUPIDO: Ya me acuerdo... el amor no se trata de flechas.',
      'CUPIDO: Se trata de quedarse. Incluso después de pelear.',
      'Sus alas vuelven a ser blancas.',
    ],
    victoriaDerrotar: ['El arco del Cupido se rompe.', 'CUPIDO: ...Supongo que su amor es más fuerte que mis flechas.'],
    premio: 'pastel',
  },

  // ---------- Jefe final ----------
  olvido: {
    enemigo: 'olvido',
    tamano: 180,
    hp: 240,
    ataque: 6,
    puedePerder: true,
    etiqueta: 'PIEDAD',
    bala: 'sombra',
    // El jefe final es MUCHO más difícil: dos ataques a la vez, más rápidos y más largos
    patrones: ['lluvia', 'muros', 'apuntado', 'espiral', 'lados'],
    simultaneos: 2,
    intensidad: 1.35,
    velocidadBalas: 1.25,
    duracionAtaque: 8000,
    inicio: '¡El Olvido los envuelve en oscuridad!',
    textosMenu: [
      'El Olvido susurra: "¿Cómo se llamaba la persona que tienes al lado?"',
      'Todo está en silencio. Demasiado silencio.',
      'Por un segundo, {actor} olvida su propio nombre. {pareja} se lo recuerda.',
    ],
    textoLleno: 'El Olvido se está desvaneciendo. ¡Ya pueden PERDONAR!',
    acciones: [
      {
        nombre: 'Recordar',
        narracion: ['{actor} recuerda el día en que conoció a {pareja}.'],
        respuesta: '¡Ese recuerdo es MÍO! ...¿Por qué no puedo borrarlo?',
        piedad: 12,
      },
      {
        nombre: 'Te quiero',
        narracion: ['{actor} le dice "te quiero" a {pareja}.', '{pareja} le responde: "yo más".'],
        respuesta: '¡Basta! ¡Esas palabras queman!',
        piedad: 15,
      },
      {
        nombre: 'Abrazarse',
        narracion: ['Nott y Vaal se abrazan en medio de la oscuridad.', 'Por un momento, todo brilla.'],
        respuesta: '¡Aaagh! ¡Demasiada luz!',
        piedad: 15,
      },
      {
        nombre: 'Reírse',
        narracion: ['Se acuerdan de una broma que solo ellos entienden.', 'Se ríen tanto que les duele la panza.'],
        respuesta: '¡¿Qué es tan gracioso?! ¡No lo entiendo!',
        piedad: 10,
      },
    ],
    respuestas: ['Todo se olvida.', 'Ya no se acuerdan de nada...', 'Ríndanse. Es más fácil olvidar.'],
    huir: ['¡No pueden huir!', 'Si no vencen al Olvido, nunca volverán a casa.'],
    fase2: {
      umbral: 0.6,
      dialogo: [
        'El Olvido se estremece.',
        'OLVIDO: ¡¿Por qué no me temen?! ¡Todo lo que aman va a desaparecer!',
        'La oscuridad se vuelve más espesa...',
      ],
      patrones: ['muros', 'espiral', 'apuntado', 'lados', 'lluvia'],
      respuestas: ['¡DESAPAREZCAN!', '¡Olvídense de todo!', '¡No hay nada que recordar!'],
      simultaneos: 3,
      danoExtra: 1,
    },
    victoriaPerdonar: [
      'El Olvido deja de moverse.',
      'OLVIDO: ...Lo que se ama de verdad... nunca se olvida.',
      'OLVIDO: Supongo que... eso siempre lo supe.',
      'El Olvido se desvanece como la niebla al amanecer.',
    ],
    victoriaDerrotar: [
      'El Olvido se quiebra en mil pedazos.',
      'OLVIDO: Imposible... ¿cómo... siguen recordando...?',
      'El Olvido se desvanece como la niebla al amanecer.',
    ],
  },
};
