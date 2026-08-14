import Link from "next/link";
import { redirect } from "next/navigation";
import { getClienteUser } from "@/lib/auth/session";
import { signOutCliente } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

// Chequeo optimista de UX, igual que (staff)/layout.tsx — la frontera dura
// es RLS (ver supabase/migrations/..._fase7_portal_cliente_rls.sql).
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cliente = await getClienteUser();
  if (!cliente) redirect("/portal-login/ingresar");

  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b p-4">
        <Link href="/portal">
          <Logo className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{cliente.nombre}</span>
          <form action={signOutCliente}>
            <Button type="submit" variant="ghost" size="sm">
              Cerrar Sesión
            </Button>
          </form>
        </div>
      </header>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
