import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { CONSTRUCTIONS_URL } from "@/components/site-links";

// Header blanco compartido del sitio público: el logo es un .jpg con fondo
// blanco, así que sobre blanco se ve a tamaño real sin placa alrededor.
export function SiteHeader({ activo }: { activo?: "nosotros" }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="Loyola Finance Group — inicio" className="shrink-0">
          <Logo className="h-10 w-auto sm:h-12" />
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/nosotros"
            className={`hidden rounded-md px-3 py-2 transition-colors sm:inline-block ${
              activo === "nosotros" ? "font-medium text-[#153D7E]" : "text-slate-600 hover:text-[#153D7E]"
            }`}
          >
            Nosotros
          </Link>
          <a
            href={CONSTRUCTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 rounded-md px-3 py-2 text-slate-600 transition-colors hover:text-[#153D7E] md:inline-flex"
          >
            Loyola Constructions
            <ArrowUpRight className="size-3.5" />
          </a>
          <Link
            href="/login"
            className="hidden rounded-md px-3 py-2 text-slate-600 transition-colors hover:text-[#153D7E] sm:inline-block"
          >
            Acceso Staff
          </Link>
          <Button
            size="sm"
            className="ml-1 bg-[#153D7E] px-4 text-white hover:bg-[#11326A]"
            render={<Link href="/portal-login" />}
          >
            Portal del cliente
          </Button>
        </nav>
      </div>
    </header>
  );
}
