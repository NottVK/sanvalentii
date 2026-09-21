import Phaser from 'phaser';
import { bip } from '../sistema/sfx';

/** Escribe un texto letra por letra con "bip", como en Undertale. */
export class Typewriter {
  private completo = '';
  private i = 0;
  private espera = 0;
  private voz = 0;

  constructor(private txt: Phaser.GameObjects.Text) {}

  get terminado() {
    return this.i >= this.completo.length;
  }

  iniciar(texto: string, voz: number) {
    // Se calculan los saltos de línea antes, para que las palabras no salten de renglón a medio escribir
    this.completo = this.txt.getWrappedText(texto).join('\n');
    this.i = 0;
    this.espera = 0;
    this.voz = voz;
    this.txt.setText('');
  }

  saltar() {
    this.i = this.completo.length;
    this.txt.setText(this.completo);
  }

  update(delta: number) {
    if (this.terminado) return;
    this.espera -= delta;
    while (this.espera <= 0 && !this.terminado) {
      const c = this.completo[this.i++];
      this.espera += '.!?'.includes(c) ? 160 : c === ',' ? 90 : 35;
      if (c.trim() && this.i % 2 === 1) bip(this.voz);
    }
    this.txt.setText(this.completo.slice(0, this.i));
  }
}
