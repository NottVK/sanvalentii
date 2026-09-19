// Controles para 1 o 2 jugadores: teclado y botones táctiles escriben aquí, las escenas leen de aquí.
export type Accion = 'arriba' | 'abajo' | 'izquierda' | 'derecha' | 'aceptar' | 'cancelar';

export interface Control {
  confirmar(): boolean;
  cancelar(): boolean;
  arriba(): boolean;
  abajo(): boolean;
  izquierda(): boolean;
  derecha(): boolean;
  /** Dirección mantenida, cada eje entre -1 y 1. */
  eje(): { x: number; y: number };
}

export class Mando implements Control {
  private retenido = new Set<Accion>();
  /** Acciones presionadas en este cuadro; se borran al final de cada cuadro. */
  private pulsado = new Set<Accion>();

  presionar(a: Accion) {
    if (!this.retenido.has(a)) this.pulsado.add(a);
    this.retenido.add(a);
  }

  soltar(a: Accion) {
    this.retenido.delete(a);
  }

  limpiar() {
    this.retenido.clear();
    this.pulsado.clear();
  }

  finCuadro() {
    this.pulsado.clear();
  }

  private tomar(a: Accion) {
    const si = this.pulsado.has(a);
    this.pulsado.delete(a);
    return si;
  }

  confirmar() {
    return this.tomar('aceptar');
  }
  cancelar() {
    return this.tomar('cancelar');
  }
  arriba() {
    return this.tomar('arriba');
  }
  abajo() {
    return this.tomar('abajo');
  }
  izquierda() {
    return this.tomar('izquierda');
  }
  derecha() {
    return this.tomar('derecha');
  }

  eje() {
    const r = this.retenido;
    return {
      x: (r.has('derecha') ? 1 : 0) - (r.has('izquierda') ? 1 : 0),
      y: (r.has('abajo') ? 1 : 0) - (r.has('arriba') ? 1 : 0),
    };
  }
}

/** Responde a cualquiera de los dos jugadores (para diálogos y menús compartidos). */
class MandoConjunto implements Control {
  constructor(private mandos: Mando[]) {}
  private alguno(f: (m: Mando) => boolean) {
    return this.mandos.map(f).some(Boolean);
  }
  confirmar() {
    return this.alguno((m) => m.confirmar());
  }
  cancelar() {
    return this.alguno((m) => m.cancelar());
  }
  arriba() {
    return this.alguno((m) => m.arriba());
  }
  abajo() {
    return this.alguno((m) => m.abajo());
  }
  izquierda() {
    return this.alguno((m) => m.izquierda());
  }
  derecha() {
    return this.alguno((m) => m.derecha());
  }
  eje() {
    const e = this.mandos.map((m) => m.eje());
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    return { x: clamp(e[0].x + e[1].x), y: clamp(e[0].y + e[1].y) };
  }
}

type Mapa = Record<string, [number, Accion]>;

const DIRECCIONES = (j: number, arriba: string, abajo: string, izq: string, der: string): Mapa => ({
  [arriba]: [j, 'arriba'],
  [abajo]: [j, 'abajo'],
  [izq]: [j, 'izquierda'],
  [der]: [j, 'derecha'],
});

/** 1 jugador: todas las teclas controlan al jugador 1. */
const TECLAS_1: Mapa = {
  ...DIRECCIONES(0, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'),
  ...DIRECCIONES(0, 'KeyW', 'KeyS', 'KeyA', 'KeyD'),
  KeyZ: [0, 'aceptar'],
  Enter: [0, 'aceptar'],
  NumpadEnter: [0, 'aceptar'],
  Space: [0, 'aceptar'],
  KeyF: [0, 'aceptar'],
  KeyK: [0, 'aceptar'],
  KeyX: [0, 'cancelar'],
  ShiftLeft: [0, 'cancelar'],
  ShiftRight: [0, 'cancelar'],
  KeyG: [0, 'cancelar'],
  KeyL: [0, 'cancelar'],
};

/** 2 jugadores: J1 = WASD + F/G, J2 = flechas + K/L (o Enter). */
const TECLAS_2: Mapa = {
  ...DIRECCIONES(0, 'KeyW', 'KeyS', 'KeyA', 'KeyD'),
  KeyF: [0, 'aceptar'],
  KeyZ: [0, 'aceptar'],
  KeyG: [0, 'cancelar'],
  KeyX: [0, 'cancelar'],
  ...DIRECCIONES(1, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'),
  KeyK: [1, 'aceptar'],
  Enter: [1, 'aceptar'],
  NumpadEnter: [1, 'aceptar'],
  KeyL: [1, 'cancelar'],
  ShiftRight: [1, 'cancelar'],
};

const mandos = [new Mando(), new Mando()];
const todos = new MandoConjunto(mandos);
let teclas = TECLAS_1;

export const entrada = {
  jugador: (i: number) => mandos[i],
  todos: todos as Control,
  configurar(modo: 1 | 2) {
    teclas = modo === 2 ? TECLAS_2 : TECLAS_1;
    mandos.forEach((m) => m.limpiar());
  },
  finCuadro() {
    mandos.forEach((m) => m.finCuadro());
  },
};

window.addEventListener('keydown', (e) => {
  const m = teclas[e.code];
  if (!m) return;
  e.preventDefault();
  if (!e.repeat) mandos[m[0]].presionar(m[1]);
});
window.addEventListener('keyup', (e) => {
  const m = teclas[e.code];
  if (m) mandos[m[0]].soltar(m[1]);
});
window.addEventListener('blur', () => mandos.forEach((m) => m.limpiar()));
