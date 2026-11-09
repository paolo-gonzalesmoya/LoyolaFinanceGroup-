import Link from "next/link";
import { ShieldCheck, FileText, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPatternStrips } from "@/components/hero-pattern-strips";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";

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
    <main>
      <header className="border-b border-white/10 bg-[#174EA6]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/">
            <Logo onDark className="h-7 w-auto" />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/nosotros" className="text-white">
              Nosotros
            </Link>
            <Link href="/login" className="text-white/70 transition-colors hover:text-white">
              Acceso Staff
            </Link>
            <Button size="sm" className="bg-[#D6AD58] text-[#1a1206] hover:bg-[#E2C07A]" render={<Link href="/portal-login" />}>
              Portal del cliente
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#174EA6]">
        <HeroPatternStrips />
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.2em] text-[#D6AD58] uppercase">Nosotros</p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-tight text-white text-balance sm:text-5xl">
              Financiamiento directo, pensado para tu próximo proyecto en Texas.
            </h1>
            <p className="mt-6 max-w-lg text-base text-white/70 sm:text-lg">
              Loyola Finance Group financia proyectos de construcción y mejoras del hogar — techos, aire
              acondicionado, remodelaciones — para clientes en Texas, trabajando junto al contratista que ejecuta
              la obra.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="grid gap-12 sm:grid-cols-2">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-foreground sm:text-3xl">Qué hacemos</h2>
              <p className="mt-4 text-sm text-muted-foreground sm:text-base">
                No somos un prestamista genérico: financiamos directamente la obra que un contratista ya te está
                cotizando. Tú solicitas el monto que necesitas, evaluamos tu solicitud y — si es aprobada — armamos
                un contrato con cuotas mensuales fijas para que puedas arrancar tu proyecto sin tener que pagarlo
                todo por adelantado.
              </p>
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-foreground sm:text-3xl">Cómo trabajamos</h2>
              <p className="mt-4 text-sm text-muted-foreground sm:text-base">
                Tu asesor arma tu solicitud contigo, evaluamos tu crédito y te mostramos las condiciones exactas del
                financiamiento antes de que firmes nada. Desde tu portal ves siempre el estado real de tu solicitud,
                tu cronograma de pagos y cada cuota — sin sorpresas en el camino.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-foreground sm:text-3xl">Nuestro compromiso</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {COMPROMISOS.map((item) => (
              <div key={item.titulo}>
                <item.icono className="size-6 text-[#D6AD58]" strokeWidth={1.75} />
                <h3 className="mt-3 text-sm font-semibold text-foreground">{item.titulo}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center sm:py-20">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-foreground sm:text-3xl">
            ¿Listo para tu próximo proyecto?
          </h2>
          <div className="mt-6">
            <Button
              size="lg"
              className="bg-[#D6AD58] text-[#1a1206] hover:bg-[#E2C07A]"
              render={<a href="https://constructions.loyola-finance-group.com/" target="_blank" rel="noopener noreferrer" />}
            >
              Habla con tu contratista
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
