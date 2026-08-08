import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Loyola Finance Group</h1>
        <p className="text-muted-foreground">
          Financiamiento y cobranza para negocios de servicios.
        </p>
      </div>
      <div className="flex gap-3">
        <Button render={<Link href="/login" />}>Acceso staff</Button>
        <Button render={<Link href="/portal-login" />} variant="outline">
          Portal del cliente
        </Button>
      </div>
    </main>
  );
}
