import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Placeholder de la Fase 0: prueba que proxy.ts redirige aquí cuando no hay
// sesión. El formulario real (Supabase Auth con email/password) se
// construye en la Fase 1.
export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Acceso staff</CardTitle>
          <CardDescription>Admin y Vendedor. Formulario pendiente (Fase 1).</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </main>
  );
}
