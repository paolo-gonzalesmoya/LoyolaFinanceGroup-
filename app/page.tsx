import Link from "next/link";
import { ShieldCheck, Clock, CreditCard, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const PASOS = [
  {
    numero: "01",
    titulo: "Solicita tu financiamiento",
    descripcion: "Cuéntanos cuánto necesitas para tu proyecto — techo, aire acondicionado o remodelación.",
  },
  {
    numero: "02",
    titulo: "Te evaluamos",
    descripcion: "Revisamos tu solicitud y te damos una respuesta clara, sin vueltas ni letra chica.",
  },
  {
    numero: "03",
    titulo: "Paga en cuotas",
    descripcion: "Cuotas mensuales fijas — sigues tu cronograma y el estado de cada una desde tu portal.",
  },
];

const BENEFICIOS = [
  {
    icono: ShieldCheck,
    titulo: "Tus datos, protegidos",
    descripcion: "Tu información sensible se guarda cifrada. Nunca la compartimos con nadie más.",
  },
  {
    icono: Clock,
    titulo: "Aprobación rápida",
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

export default function Home() {
  return (
    <main>
      <header className="border-b border-white/10 bg-[#101d33]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-[family-name:var(--font-display)] text-lg italic text-white">Loyola Finance Group</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-white/70 transition-colors hover:text-white">
              Acceso staff
            </Link>
            <Button size="sm" className="bg-[#c68a3d] text-[#1a1206] hover:bg-[#d69a4d]" render={<Link href="/portal-login" />}>
              Portal del cliente
            </Button>
          </nav>
        </div>
      </header>

      <section
        className="relative overflow-hidden bg-[#101d33] bg-repeat"
        style={{ backgroundImage: "url('/patterns/houses.svg')", backgroundSize: "260px 150px" }}
      >
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.2em] text-[#c68a3d] uppercase">Financiamiento para tu hogar</p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-tight text-white text-balance sm:text-5xl">
              Tu techo, tu aire acondicionado, tu remodelación — pagados a tu ritmo.
            </h1>
            <p className="mt-6 max-w-lg text-base text-white/70 sm:text-lg">
              Financiamos los proyectos de tu hogar con cuotas mensuales claras y sin sorpresas. Solicita, te
              evaluamos, y arrancas tu proyecto.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" className="bg-[#c68a3d] text-[#1a1206] hover:bg-[#d69a4d]" render={<Link href="/registro" />}>
                Crea tu cuenta
              </Button>
              <Link href="/portal-login" className="text-sm text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline">
                Ya tengo cuenta — ingresar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-foreground sm:text-3xl">Cómo funciona</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {PASOS.map((paso) => (
              <div key={paso.numero}>
                <span className="font-[family-name:var(--font-display)] text-3xl text-[#c68a3d] italic">{paso.numero}</span>
                <h3 className="mt-3 text-base font-semibold text-foreground">{paso.titulo}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{paso.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFICIOS.map((beneficio) => (
              <div key={beneficio.titulo}>
                <beneficio.icono className="size-6 text-[#c68a3d]" strokeWidth={1.75} />
                <h3 className="mt-3 text-sm font-semibold text-foreground">{beneficio.titulo}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{beneficio.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
          <div>
            <p className="font-[family-name:var(--font-display)] italic text-foreground">Loyola Finance Group</p>
            <p className="mt-1 text-sm text-muted-foreground">Financiamiento y cobranza para negocios de servicios.</p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/portal-login" className="text-muted-foreground hover:text-foreground">
              Portal del cliente
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Acceso staff
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
