import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileText, Hammer, Landmark, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPatternStrips } from "@/components/hero-pattern-strips";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CONSTRUCTIONS_URL } from "@/components/site-links";

const COMPROMISOS = [
  {
    icono: FileText,
    titulo: "Contratos claros",
    descripcion: "Tasa, cuotas y cargos financieros explicados antes de firmar — sin letra chica.",
  },
  {
    icono: UserCheck,
    titulo: "Identidad confirmada",
    descripcion: "Tu asesor te registra en persona, así que tu identidad queda confirmada desde el primer momento.",
  },
  {
    icono: ShieldCheck,
    titulo: "Datos protegidos",
    descripcion: "Tu información sensible se guarda cifrada y nunca se comparte con terceros.",
  },
];

export default function NosotrosPage() {
  return (
    <main className="bg-white">
      <SiteHeader activo="nosotros" />

      <section className="relative overflow-hidden bg-[#153D7E]">
        <HeroPatternStrips />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.14),transparent_55%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#F0D89E] uppercase">Nosotros</p>
            <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl leading-[1.1] text-white text-balance sm:text-5xl">
              Financiamiento directo, pensado para el techo de tu casa en Texas.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Loyola Finance Group se especializa en financiar proyectos de roofing — techos nuevos y reparaciones —
              para clientes en Texas, trabajando junto al contratista que ejecuta la obra.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-8 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#153D7E]/8 text-[#153D7E]">
                <Landmark className="size-5" strokeWidth={1.75} />
              </span>
              <h2 className="mt-6 font-[family-name:var(--font-display)] text-2xl text-slate-900 sm:text-3xl">
                Qué hacemos
              </h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                No somos un prestamista genérico: financiamos directamente la obra que un contratista ya te está
                cotizando. Tú solicitas el monto que necesitas, evaluamos tu solicitud y — si es aprobada — armamos
                un contrato con cuotas mensuales fijas para que puedas arrancar tu proyecto sin tener que pagarlo
                todo por adelantado.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-8 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#153D7E]/8 text-[#153D7E]">
                <Hammer className="size-5" strokeWidth={1.75} />
              </span>
              <h2 className="mt-6 font-[family-name:var(--font-display)] text-2xl text-slate-900 sm:text-3xl">
                Cómo trabajamos
              </h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Tu asesor arma tu solicitud contigo, evaluamos tu crédito y te mostramos las condiciones exactas del
                financiamiento antes de que firmes nada. Desde tu portal ves siempre el estado real de tu solicitud,
                tu cronograma de pagos y cada cuota — sin sorpresas en el camino.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#B8913E] uppercase">Compromiso</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-slate-900 sm:text-4xl">
              Nuestro compromiso
            </h2>
          </div>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {COMPROMISOS.map((item) => (
              <div key={item.titulo} className="border-t-2 border-[#D6AD58] pt-5">
                <item.icono className="size-6 text-[#153D7E]" strokeWidth={1.75} />
                <h3 className="mt-4 text-sm font-semibold text-slate-900">{item.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-[#153D7E] px-6 py-14 text-center sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(214,173,88,0.25),transparent_55%)]"
            />
            <h2 className="relative font-[family-name:var(--font-display)] text-3xl text-white text-balance sm:text-4xl">
              ¿Listo para tu próximo proyecto?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-white/80">
              Loyola Constructions ejecuta la obra y nosotros la financiamos. Empieza hablando con tu contratista.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="h-11 bg-[#D6AD58] px-6 text-[#1a1206] hover:bg-[#E2C07A]"
                render={<a href={CONSTRUCTIONS_URL} target="_blank" rel="noopener noreferrer" />}
              >
                Habla con tu contratista
                <ArrowUpRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                render={<Link href="/portal-login" />}
              >
                Ingresar a mi portal
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
