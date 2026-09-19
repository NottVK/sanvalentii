// Efectos de sonido generados en el momento (sin archivos de audio).
let ctx: AudioContext | null = null;

function audio() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// iPhone/iPad (Safari) solo permiten encender el audio dentro de un toque o tecla del usuario,
// así que se desbloquea en el primer toque y se sigue intentando hasta que quede activo.
function desbloquear() {
  const a = audio();
  const silencio = a.createBufferSource();
  silencio.buffer = a.createBuffer(1, 1, 22050);
  silencio.connect(a.destination);
  silencio.start(0);
  if (a.state === 'running') EVENTOS_DESBLOQUEO.forEach((e) => window.removeEventListener(e, desbloquear, true));
}
const EVENTOS_DESBLOQUEO = ['pointerdown', 'pointerup', 'touchend', 'keydown'];
EVENTOS_DESBLOQUEO.forEach((e) => window.addEventListener(e, desbloquear, { capture: true }));

export function tono(freq: number, dur = 0.05, tipo: OscillatorType = 'square', vol = 0.04, retraso = 0) {
  const a = audio();
  const t = a.currentTime + retraso;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur);
}

const arpegio = (notas: number[], paso: number, tipo: OscillatorType = 'triangle') =>
  notas.forEach((f, i) => tono(f, paso * 1.5, tipo, 0.06, i * paso));

/** El "bip" de cuando un personaje habla. */
export const bip = (voz: number) => tono(voz, 0.045, 'square', 0.03);

export const sfx = {
  mover: () => tono(520, 0.04),
  confirmar: () => {
    tono(660, 0.05);
    tono(990, 0.07, 'square', 0.04, 0.05);
  },
  dano: () => tono(110, 0.2, 'sawtooth', 0.07),
  curar: () => arpegio([523, 659, 784], 0.08),
  amor: () => arpegio([784, 1175], 0.08),
  encuentro: () => [0, 0.15, 0.3].forEach((t) => tono(880, 0.08, 'square', 0.05, t)),
  victoria: () => arpegio([523, 659, 784, 1047], 0.12),
  golpe: () => {
    tono(200, 0.12, 'square', 0.07);
    tono(90, 0.2, 'sawtooth', 0.06, 0.05);
  },
  fallo: () => tono(260, 0.15, 'triangle', 0.05),
  romper: () => [400, 300, 200, 120].forEach((f, i) => tono(f, 0.12, 'sawtooth', 0.06, i * 0.09)),
  temblor: () => tono(55, 0.5, 'sawtooth', 0.06),
  regalo: () => arpegio([659, 880, 1319], 0.07),
};
