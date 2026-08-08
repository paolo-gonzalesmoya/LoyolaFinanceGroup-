import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

// Chequeo optimista de UX (redirige si no hay fila `usuario`) — la frontera
// dura de verdad es RLS en cada tabla, no esto. Ver proxy.ts y las políticas
// en supabase/migrations.
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getStaffUser();
  if (!usuario) redirect("/login");

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/leads", label: "Leads" },
    ...(usuario.rol === "admin"
      ? [
          { href: "/clientes", label: "Clientes" },
          { href: "/configuracion", label: "Configuración" },
        ]
      : []),
  ];

  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Loyola Finance Group</span>
          <nav className="flex gap-4 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {usuario.nombre} · {usuario.rol}
          </span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Salir
            </Button>
          </form>
        </div>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
