import Phaser from 'phaser';
import { pareja } from './data/personajes';
import { guardar, partida } from './estado';

type Escena = 'Cinematica' | 'Mapa' | 'Batalla' | 'Huida' | 'Final';

interface Paso {
  escena: Escena;
  id: string | (() => string);
}

/** El orden de la historia. Cada escena llama a avanzar() cuando termina. */
export const PASOS: Paso[] = [
  { escena: 'Cinematica', id: 'prologo' },
  { escena: 'Mapa', id: 'jardin' },
  // El reencuentro: en 1 jugador peleas contra tu pareja; en 2 jugadores, juntos contra El Orgullo
  { escena: 'Batalla', id: () => (partida.modo === 2 ? 'orgullo' : `perdon-${pareja(partida.p1)}`) },
  { escena: 'Mapa', id: 'claro' },
  { escena: 'Mapa', id: 'bosque' },
  { escena: 'Batalla', id: 'rosalia' },
  { escena: 'Mapa', id: 'lago' },
  { escena: 'Batalla', id: 'cupido' },
  { escena: 'Mapa', id: 'torre' },
  { escena: 'Batalla', id: 'olvido' },
  { escena: 'Cinematica', id: 'derrumbe' },
  { escena: 'Huida', id: 'huida' },
  { escena: 'Cinematica', id: 'despertar' },
  { escena: 'Final', id: 'final' },
];

/** Escenas que ya están saliendo (para que apretar varias veces no reinicie el fundido). */
const saliendo = new WeakSet<Phaser.Scene>();

/** Guarda y va al paso `n` de la historia con un fundido. */
export function irAPaso(scene: Phaser.Scene, n: number, blanco = false) {
  if (saliendo.has(scene)) return;
  saliendo.add(scene);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => saliendo.delete(scene));

  partida.paso = Phaser.Math.Clamp(n, 0, PASOS.length - 1);
  guardar();
  const paso = PASOS[partida.paso];
  const id = typeof paso.id === 'function' ? paso.id() : paso.id;
  const c = blanco ? 255 : 0;
  const cam = scene.cameras.main;
  cam.fadeOut(500, c, c, c);
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(paso.escena, { id }));
}

export function avanzar(scene: Phaser.Scene, blanco = false) {
  irAPaso(scene, partida.paso + 1, blanco);
}
