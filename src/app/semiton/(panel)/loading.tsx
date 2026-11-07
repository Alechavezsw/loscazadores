import { Skeleton } from "@/components/site/Brand";

/** Se muestra al pasar de una sección del panel a otra mientras llegan los datos. */
export default function Cargando() {
  return (
    <div role="status">
      <span className="sr-only">Cargando</span>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="mt-4 h-64" />
    </div>
  );
}
