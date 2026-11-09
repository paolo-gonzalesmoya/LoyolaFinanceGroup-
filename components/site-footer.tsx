import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";

// Nota: los destinos exactos de "Enlaces" y de la empresa hermana quedan
// pendientes de revisión — Paolo pidió dejarlos así por ahora y ajustarlos
// después.
export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Logo className="h-8 w-auto" />
            <p className="mt-3 text-sm text-muted-foreground">
              Financiamiento directo para proyectos de construcción y mejoras del hogar en Texas.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium tracking-[0.15em] text-muted-foreground uppercase">Enlaces</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/nosotros" className="text-muted-foreground hover:text-foreground">
                Nosotros
              </Link>
              <Link href="/portal-login" className="text-muted-foreground hover:text-foreground">
                Portal del cliente
              </Link>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Acceso Staff
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium tracking-[0.15em] text-muted-foreground uppercase">Empresa hermana</p>
            <a
              href="https://constructions.loyola-finance-group.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block"
            >
              <Image
                src="/logo-construction.jpg"
                alt="Loyola Construction LLC"
                width={1260}
                height={511}
                className="h-10 w-auto"
              />
            </a>
            <p className="mt-2 text-xs text-muted-foreground">La obra la ejecuta Loyola Construction — nosotros financiamos.</p>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Loyola Finance Group. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
