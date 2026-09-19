import { INVENTARIO_INICIAL, type ObjetoId } from './data/objetos';
import { JUGABLES, pareja, type PersonajeId } from './data/personajes';

export const HP_MAX = 30;

export interface Partida {
  modo: 1 | 2;
  /** Personaje del jugador 1 (en 2 jugadores, el jugador 2 usa el otro). */
  p1: PersonajeId;
  /** En qué parte de la historia van (ver PASOS en flujo.ts). */
  paso: number;
  inventario: ObjetoId[];
  hp: Record<PersonajeId, number>;
  /** Regalos ya recogidos. */
  recogidos: string[];
}

const CLAVE = 'nuestra-historia-partida';

const crear = (modo: 1 | 2, p1: PersonajeId): Partida => ({
  modo,
  p1,
  paso: 0,
  inventario: [...INVENTARIO_INICIAL],
  hp: { nott: HP_MAX, vaal: HP_MAX },
  recogidos: [],
});

export let partida: Partida = crear(1, 'nott');

export function nuevaPartida(modo: 1 | 2, p1: PersonajeId) {
  partida = crear(modo, p1);
  guardar();
}

export function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(partida));
  } catch {
    // Sin almacenamiento (modo privado): se juega igual, solo que no se guarda
  }
}

export function cargarPartida() {
  try {
    const texto = localStorage.getItem(CLAVE);
    if (!texto) return false;
    partida = { ...crear(1, 'nott'), ...JSON.parse(texto) };
    return true;
  } catch {
    return false;
  }
}

export function hayPartida() {
  try {
    return localStorage.getItem(CLAVE) !== null;
  } catch {
    return false;
  }
}

export function borrarPartida() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // nada que borrar
  }
}

/** Personajes controlados por jugadores, en orden: [jugador 1, jugador 2]. */
export function jugadores(): PersonajeId[] {
  return partida.modo === 2 ? [partida.p1, pareja(partida.p1)] : [partida.p1];
}

export function curarTodos() {
  for (const id of JUGABLES) partida.hp[id] = HP_MAX;
}
