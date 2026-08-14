import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { LoginForm } from "../login-form";

export default function IngresarPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <Logo className="h-10 w-auto" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Portal del cliente</CardTitle>
          <CardDescription>Ingresa con tu cuenta de Loyola Finance Group.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
