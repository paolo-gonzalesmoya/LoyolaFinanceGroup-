import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { StaffNav } from "./staff-nav";

// Chequeo optimista de UX (redirige si no hay fila `usuario`) — la frontera
// dura de verdad es RLS en cada tabla, no esto. Ver proxy.ts y las políticas
// en supabase/migrations.
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getStaffUser();
  if (!usuario) redirect("/login");

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-64 shrink-0 flex-col bg-[#101d33]">
        <div className="border-b border-white/10 p-5">
          <Link href="/dashboard">
            <Logo onDark className="h-8 w-auto" />
          </Link>
        </div>
        <StaffNav />
        <div className="border-t border-white/10 p-4">
          <Link href="/cuenta" className="block text-sm text-white/70 transition-colors hover:text-white">
            <span className="font-medium">{usuario.nombre}</span>
            <span className="block text-xs tracking-wide text-white/40 uppercase">{usuario.rol}</span>
          </Link>
          <form action={signOut} className="mt-3">
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white">
              Cerrar Sesión
            </Button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1 overflow-x-auto bg-muted/20">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
