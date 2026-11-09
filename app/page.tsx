import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Circle,
  ClipboardList,
  CreditCard,
  FileSignature,
  Home as HomeIcon,
  Lock,
  MapPin,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPatternStrips } from "@/components/hero-pattern-strips";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CONSTRUCTIONS_URL } from "@/components/site-links";

const CONFIANZA = [
  { icono: Lock, texto: "Datos cifrados" },
  { icono: CalendarCheck, texto: "Cuotas mensuales fijas" },
  { icono: FileSignature, texto: "Condiciones claras antes de firmar" },
  { icono: MapPin, texto: "Proyectos en Texas" },
];

const PASOS = [
  {
    icono: ClipboardList,
    titulo: "Solicita tu financiamiento",
    descripcion: "Cuéntanos cuánto necesitas para tu proyecto — techo, aire acondicionado o remodelación.",
  },
  {
    icono: SearchCheck,
    titulo: "Te evaluamos",
    descripcion: "Revisamos tu solicitud y te damos una respuesta clara, sin vueltas ni letra chica.",
  },
  {
    icono: CalendarCheck,
    titulo: "Paga en cuotas",
    descripcion: "Cuotas mensuales fijas — sigues tu cronograma y el estado de cada una desde tu portal.",
  },
];

const BENEFICIOS = [
  {
    icono: ShieldCheck,
    titulo: "Tus datos, protegidos",
    descripcion: "Tu información sensible se guarda cifrada y nunca se comparte con terceros.",
  },
  {
    icono: SearchCheck,
    titulo: "Respuesta clara",
    descripcion: "Evaluamos tu solicitud y te avisamos apenas tenemos una decisión.",
  },
  {
    icono: CreditCard,
    titulo: "Pagos organizados",
    descripcion: "Ves tu cronograma completo y el estado de cada cuota desde tu portal, sin sorpresas.",
  },
  {
    icono: HomeIcon,
    titulo: "Para tu próximo proyecto",
    descripcion: "Roofing, aire acondicionado, mejoras del hogar — financiamos lo que tu casa necesita.",
  },
];

// Vista ilustrativa del portal: solo estados del proceso, sin montos, plazos
// ni tasas — mencionar cifras de crédito en publicidad activa requisitos de
// divulgación de TILA/Reg Z.
const ETAPAS_PORTAL = [
  { texto: "Solicitud recibida", hecho: true },
  { texto: "Evaluación de crédito", hecho: true },
  { texto: "Contrato con cuotas fijas", hecho: true },
  { texto: "Tu proyecto en marcha", hecho: false },
];

function TarjetaPortal() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div aria-hidden className="absolute -inset-3 rounded-[28px] bg-white/10 blur-sm" />
      <div className="relative rounded-2xl bg-white p-6 shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-[0.15em] text-[#153D7E] uppercase">Tu portal</p>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Aprobado</span>
        </div>
        <p className="mt-3 text-lg font-semibold text-slate-900">Remodelación de techo</p>
        <ul className="mt-5 space-y-3">
          {ETAPAS_PORTAL.map((etapa) => (
            <li key={etapa.texto} className="flex items-center gap-3 text-sm">
              {etapa.hecho ? (
                <CheckCircle2 className="size-5 shrink-0 text-[#153D7E]" />
              ) : (
                <Circle className="size-5 shrink-0 text-slate-300" />
              )}
              <span className={etapa.hecho ? "text-slate-800" : "text-slate-500"}>{etapa.texto}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Cronograma de pagos</p>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < 3 ? "bg-[#D6AD58]" : "bg-slate-200"}`} />
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Sigue cada cuota desde tu celular.</p>
        </div>
      </div>
      <p className="relative mt-3 text-center text-xs text-white/60">Vista ilustrativa del portal del cliente</p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="bg-white">
      <SiteHeader />

      <section className="relative overflow-hidden bg-[#153D7E]">
        <HeroPatternStrips />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.14),transparent_55%)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#F0D89E] uppercase">
              Financiamiento confiable para tu hogar en Texas
            </p>
            <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl leading-[1.1] text-white text-balance sm:text-5xl lg:text-[3.4rem]">
              Tu techo, tu aire acondicionado, tu remodelación — financiados con claridad.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Financiamos los proyectos de tu hogar con cuotas mensuales fijas, tasas claras y sin letra chica.
              Solicita, te evaluamos, y arrancas tu proyecto.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
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
              </Button>
            </div>
          </div>
          <TarjetaPortal />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-5 px-4 py-7 sm:px-6 lg:grid-cols-4">
          {CONFIANZA.map((item) => (
            <div key={item.texto} className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <item.icono className="size-5 shrink-0 text-[#153D7E]" strokeWidth={1.75} />
              {item.texto}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#B8913E] uppercase">Proceso</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-slate-900 sm:text-4xl">
              Cómo funciona
            </h2>
            <p className="mt-4 text-slate-600">Tres pasos, con las condiciones claras desde el inicio.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PASOS.map((paso, i) => (
              <div
                key={paso.titulo}
                className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[#153D7E]/8 text-[#153D7E]">
                    <paso.icono className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-3xl text-[#D6AD58] italic">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 text-base font-semibold text-slate-900">{paso.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{paso.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#B8913E] uppercase">Por qué Loyola</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-slate-900 sm:text-4xl">
              Financiamiento pensado para tu hogar
            </h2>
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFICIOS.map((beneficio) => (
              <div key={beneficio.titulo} className="border-t-2 border-[#D6AD58] pt-5">
                <beneficio.icono className="size-6 text-[#153D7E]" strokeWidth={1.75} />
                <h3 className="mt-4 text-sm font-semibold text-slate-900">{beneficio.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{beneficio.descripcion}</p>
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
                Conoce Loyola Constructions
                <ArrowUpRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                render={<Link href="/nosotros" />}
              >
                Sobre nosotros
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
