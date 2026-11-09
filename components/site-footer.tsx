import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { CONSTRUCTIONS_URL, SPUR_SQUARES_URL } from "@/components/site-links";

// Footer blanco: hace juego con el fondo blanco de los logos (.jpg sin
// transparencia), así que se ven sin placa ni recorte.
export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo className="h-12 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              Financiamiento directo para proyectos de construcción y mejoras del hogar en Texas.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#153D7E] uppercase">Enlaces</p>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              <li>
                <Link href="/nosotros" className="text-slate-600 transition-colors hover:text-[#153D7E]">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link href="/portal-login" className="text-slate-600 transition-colors hover:text-[#153D7E]">
                  Portal del cliente
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-slate-600 transition-colors hover:text-[#153D7E]">
                  Acceso Staff
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-5">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#153D7E] uppercase">Empresa hermana y socios</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <a
                href={CONSTRUCTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-xl border border-slate-200 p-4 transition-colors hover:border-[#153D7E]/40 hover:bg-slate-50"
              >
                <Image
                  src="/logo-construction.jpg"
                  alt="Loyola Construction LLC"
                  width={1260}
                  height={511}
                  className="h-10 w-auto self-start"
                />
                <span className="mt-3 flex items-center gap-1 text-xs text-slate-600 group-hover:text-[#153D7E]">
                  Loyola Constructions · ejecuta la obra
                  <ArrowUpRight className="size-3.5" />
                </span>
              </a>
              <a
                href={SPUR_SQUARES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-xl border border-slate-200 p-4 transition-colors hover:border-[#153D7E]/40 hover:bg-slate-50"
              >
                <span className="text-lg font-semibold tracking-tight text-slate-900">Spur Squares</span>
                <span className="mt-3 flex items-center gap-1 text-xs text-slate-600 group-hover:text-[#153D7E]">
                  Socio
                  <ArrowUpRight className="size-3.5" />
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Loyola Finance Group. Todos los derechos reservados.</span>
          <span>Texas, EE. UU.</span>
        </div>
      </div>
    </footer>
  );
}
