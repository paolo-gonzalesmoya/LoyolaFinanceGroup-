import Link from "next/link";
import { CalendarClock, CreditCard, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroPatternStrips } from "@/components/hero-pattern-strips";
import { LoginForm } from "./login-form";

const BENEFICIOS = [
  {
    icono: CalendarClock,
    titulo: "Tu cronograma de pagos",
    descripcion: "Mira cada cuota, su fecha de vencimiento y su estado, siempre actualizado.",
  },
  {
    icono: CreditCard,
    titulo: "Tu downpayment y método de cobro",
    descripcion: "Paga tu downpayment inicial y administra la tarjeta o cuenta con la que se te cobra.",
  },
  {
    icono: Bell,
    titulo: "Notificaciones de tu solicitud",
    descripcion: "Entérate apenas haya una novedad sobre tu crédito o tus pagos.",
  },
];

export default function PortalLoginPage() {
  return (
    <main className="scroll-smooth">
      <section className="relative overflow-hidden bg-[#101d33]">
        <HeroPatternStrips />
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.2em] text-[#c68a3d] uppercase">Portal del cliente</p>
              <h1 className="mt-4 max-w-2xl font-[family-name:var(--font-display)] text-4xl leading-tight text-white text-balance sm:text-5xl">
                Todo tu financiamiento, en un solo lugar
              </h1>
              <p className="mt-6 max-w-lg text-base text-white/70 sm:text-lg">
                Ingresa con tu cuenta para ver tu solicitud, tu cronograma de pagos y el estado de tu contrato con
                Loyola Finance Group.
              </p>
            </div>
            <Button
              size="lg"
              className="shrink-0 bg-[#c68a3d] text-[#1a1206] hover:bg-[#d69a4d]"
              render={<a href="#ingresar" />}
            >
              Ingresar
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-foreground sm:text-3xl">Qué vas a encontrar</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
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

      <section id="ingresar" className="border-t bg-muted/40 scroll-mt-6">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-sm">
            <Card>
              <CardContent className="pt-6">
                <LoginForm />
              </CardContent>
            </Card>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link href="/registro" className="text-foreground underline-offset-4 hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
