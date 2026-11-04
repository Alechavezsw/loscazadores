"use client";

import { useSyncExternalStore } from "react";

const sinSuscripcion = () => () => undefined;

/**
 * Es false mientras la página se arma en el servidor y justo después de cargar, y pasa a true cuando React
 * ya tomó el control. Los formularios que se envían con JavaScript deshabilitan su botón hasta entonces:
 * si se envían antes, el navegador los manda por su cuenta y los datos terminan escritos en la dirección.
 */
export function useHidratado() {
  return useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
}
