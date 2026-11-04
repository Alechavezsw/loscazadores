"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowsClockwise, ChartBar, Gauge, Gear, Megaphone, Newspaper, Play } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/admin", label: "Resumen", Icono: Gauge, exacto: true },
  { href: "/admin/noticias", label: "Noticias", Icono: Newspaper, exacto: false },
  { href: "/admin/videos", label: "Videos", Icono: Play, exacto: false },
  { href: "/admin/estadisticas", label: "Estadísticas", Icono: ChartBar, exacto: false },
  { href: "/admin/redes", label: "Redes", Icono: ArrowsClockwise, exacto: false },
  { href: "/admin/publicidad", label: "Publicidad", Icono: Megaphone, exacto: false },
  { href: "/admin/ajustes", label: "Ajustes", Icono: Gear, exacto: false },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Panel" className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
      <ul className="flex gap-1 md:flex-col">
        {ITEMS.map(({ href, label, Icono, exacto }) => {
          const activo = exacto ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-semibold transition-all duration-700 ease-fluid active:scale-[0.98]",
                  activo ? "bg-white text-ink" : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icono weight={activo ? "fill" : "regular"} className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
