"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Bell, Settings } from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icono: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icono: Users },
  { href: "/notificaciones", label: "Notificaciones", icono: Bell },
  { href: "/configuracion", label: "Configuración", icono: Settings, soloAdmin: true },
];

export function StaffNav({ rol }: { rol: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-3">
      {LINKS.filter((link) => !link.soloAdmin || rol === "admin").map((link) => {
        const activo = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              activo ? "bg-[#D6AD58] font-medium text-[#1a1206]" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <link.icono className="size-4" strokeWidth={1.75} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
