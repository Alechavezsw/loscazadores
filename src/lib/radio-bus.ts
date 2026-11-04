/**
 * Hay dos reproductores de Radio del Sur (el flotante del sábado y el de Se Armó el Bailongo). Cuando uno
 * empieza a sonar le avisa al otro para que se calle: nunca suenan los dos a la vez.
 */
const EVENTO = "lc-radio-suena";

export type OrigenRadio = "flotante" | "bailongo";

export function avisarSuena(origen: OrigenRadio) {
  window.dispatchEvent(new CustomEvent<OrigenRadio>(EVENTO, { detail: origen }));
}

/** Llama a `alCallar` cuando suena el reproductor de otro origen. Devuelve la función para dejar de escuchar. */
export function alSonarOtro(origen: OrigenRadio, alCallar: () => void) {
  const oyente = (e: Event) => {
    if ((e as CustomEvent<OrigenRadio>).detail !== origen) alCallar();
  };
  window.addEventListener(EVENTO, oyente);
  return () => window.removeEventListener(EVENTO, oyente);
}
