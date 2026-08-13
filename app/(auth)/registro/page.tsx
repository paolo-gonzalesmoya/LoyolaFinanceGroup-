import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RegistroForm } from "./form";

export default function RegistroPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crea tu cuenta</CardTitle>
          <CardDescription>
            Regístrate para simular tu financiamiento. Tu solicitud avanza de verdad una vez que confirmemos tu identidad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistroForm />
        </CardContent>
      </Card>
    </main>
  );
}
