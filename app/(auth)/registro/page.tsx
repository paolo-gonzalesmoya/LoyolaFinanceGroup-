import Link from "next/link";
import { Mail, UserCheck, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPatternStrips } from "@/components/hero-pattern-strips";

const PASOS = [
  {
    icono: Mail,
    titulo: "Confirma tu correo",
    descripcion: "Te mandamos un link de confirmación apenas te registras — ábrelo para poder entrar al portal.",
  },
  {
    icono: UserCheck,
    titulo: "Confirmamos tu identidad",
    descripcion: "Un administrador revisa tus datos a mano antes de que tu solicitud avance de verdad.",
  },
  {
    icono: Calculator,
    titulo: "Armamos tu financiamiento",
    descripcion: "Con tu score consultado, te preparamos las opciones de tasa y cuotas para tu contrato.",
  },
];

export default function RegistroPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[#101d33]">
        <HeroPatternStrips />
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.2em] text-[#c68a3d] uppercase">Nueva cuenta</p>
              <h1 className="mt-4 max-w-2xl font-[family-name:var(--font-display)] text-4xl leading-tight text-white text-balance sm:text-5xl">
                Crea tu cuenta
              </h1>
              <p className="mt-6 max-w-lg text-base text-white/70 sm:text-lg">
                Regístrate y confirma tu correo para entrar al portal. Tu solicitud avanza de verdad una vez que
                confirmemos tu identidad.
              </p>
            </div>
            <Button
              size="lg"
              className="h-auto shrink-0 bg-[#c68a3d] px-8 py-4 text-lg font-semibold text-[#1a1206] shadow-lg shadow-black/20 hover:bg-[#d69a4d]"
              render={<Link href="/registro/formulario" />}
            >
              Comenzar Registro →
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-foreground sm:text-3xl">Los próximos pasos</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {PASOS.map((paso) => (
              <div key={paso.titulo}>
                <paso.icono className="size-6 text-[#c68a3d]" strokeWidth={1.75} />
                <h3 className="mt-3 text-sm font-semibold text-foreground">{paso.titulo}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{paso.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
