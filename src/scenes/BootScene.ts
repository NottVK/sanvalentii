import Phaser from 'phaser';
import { FUENTE } from '../config';
import { ELENCO, type Expresion } from '../data/personajes';
import { ACTORES, claveRetrato, claveSprite, crearPlaceholders, crearTexturasBase, suavizarModelos } from '../sistema/texturas';

/** Carga los modelos que pongas en ELENCO y crea dibujos provisionales para lo que falte. */
export class BootScene extends Phaser.Scene {
  private cargados: string[] = [];

  constructor() {
    super('Boot');
  }

  preload() {
    this.add.text(320, 240, 'Cargando...', { fontFamily: FUENTE, fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
    this.load.on('loaderror', (file: Phaser.Loader.File) => console.warn(`No se pudo cargar ${file.src}`));

    for (const id of ACTORES) {
      const actor = ELENCO[id];
      if (actor.sprite) this.cargar(claveSprite(id), actor.sprite);
      for (const [exp, ruta] of Object.entries(actor.retratos)) {
        if (ruta) this.cargar(claveRetrato(id, exp as Expresion), ruta);
      }
    }
  }

  private cargar(clave: string, ruta: string) {
    this.load.image(clave, ruta);
    this.cargados.push(clave);
  }

  create() {
    crearTexturasBase(this);
    suavizarModelos(this, this.cargados);
    crearPlaceholders(this);
    this.scene.start('Titulo');
  }
}
