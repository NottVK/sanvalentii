// Cruceta y botones A/B en pantalla para celulares. En 2 jugadores, cada uno tiene su lado.
import { entrada, type Accion } from '../sistema/entrada';

export const esTactil = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

/** Direcciones según el sector (8 sectores de 45°) donde está el dedo sobre la cruceta. */
const SECTORES: Record<number, Accion[]> = {
  0: ['derecha'],
  1: ['derecha', 'abajo'],
  2: ['abajo'],
  3: ['abajo', 'izquierda'],
  4: ['izquierda'],
  [-4]: ['izquierda'],
  [-3]: ['izquierda', 'arriba'],
  [-2]: ['arriba'],
  [-1]: ['arriba', 'derecha'],
};

function crear(clase: string, html = '') {
  const el = document.createElement('div');
  el.className = clase;
  el.innerHTML = html;
  return el;
}

function crearCruceta(j: number) {
  const el = crear(`ctl dpad j${j + 1}`, '<i class="u"></i><i class="d"></i><i class="l"></i><i class="r"></i>');
  const mando = entrada.jugador(j);
  let activas = new Set<Accion>();

  const aplicar = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const nuevas = new Set<Accion>(
      Math.hypot(dx, dy) > 0.25 ? SECTORES[Math.round(Math.atan2(dy, dx) / (Math.PI / 4))] : [],
    );
    for (const a of activas) if (!nuevas.has(a)) mando.soltar(a);
    for (const a of nuevas) if (!activas.has(a)) mando.presionar(a);
    activas = nuevas;
    el.dataset.dir = [...nuevas].join(' ');
  };
  const soltarTodo = () => {
    activas.forEach((a) => mando.soltar(a));
    activas = new Set();
    el.dataset.dir = '';
  };

  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    aplicar(e);
  });
  el.addEventListener('pointermove', (e) => el.hasPointerCapture(e.pointerId) && aplicar(e));
  el.addEventListener('pointerup', soltarTodo);
  el.addEventListener('pointercancel', soltarTodo);
  el.addEventListener('lostpointercapture', soltarTodo);
  return el;
}

function crearBoton(j: number, accion: Accion, letra: string) {
  const el = crear(`btn ${letra.toLowerCase()}`, letra);
  const mando = entrada.jugador(j);
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    el.classList.add('on');
    mando.presionar(accion);
  });
  const soltar = () => {
    el.classList.remove('on');
    mando.soltar(accion);
  };
  el.addEventListener('pointerup', soltar);
  el.addEventListener('pointercancel', soltar);
  el.addEventListener('lostpointercapture', soltar);
  return el;
}

function crearBotonera(j: number, etiqueta?: string) {
  const el = crear(`ctl botones j${j + 1}`);
  if (etiqueta) el.append(crear('etiqueta', etiqueta));
  el.append(crearBoton(j, 'cancelar', 'B'), crearBoton(j, 'aceptar', 'A'));
  return el;
}

function botonPantallaCompleta() {
  const el = crear('ctl pantalla', '⛶');
  el.addEventListener('click', () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  });
  return el;
}

/** Muestra los controles táctiles para 1 o 2 jugadores (solo en pantallas táctiles). */
export function montarTactil(modo: 1 | 2, etiquetas: string[] = []) {
  if (!esTactil()) return;
  document.body.classList.add('tactil');
  const cont = document.getElementById('tactil')!;
  cont.className = modo === 2 ? 'dos' : 'uno';
  cont.innerHTML = '';
  for (let j = 0; j < modo; j++) cont.append(crearCruceta(j), crearBotonera(j, modo === 2 ? etiquetas[j] : undefined));
  if ('requestFullscreen' in document.documentElement) cont.append(botonPantallaCompleta());
  // Phaser recalcula el tamaño del juego al cambiar el espacio disponible
  window.dispatchEvent(new Event('resize'));
}
