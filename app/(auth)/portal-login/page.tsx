import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Placeholder de la Fase 0. El acceso real del portal del cliente
// (auth separada de la de staff, vía invitación) se construye en la Fase 7.
export default function PortalLoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Portal del cliente</CardTitle>
          <CardDescription>Acceso por invitación. Formulario pendiente (Fase 7).</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </main>
  );
}
