"use client";

import { useActionState } from "react";
import { convertirACliente } from "../../clientes/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ConvertirClienteForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(convertirACliente.bind(null, leadId), undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Convertir a cliente</CardTitle>
        <CardDescription>Solo admin. Captura el SSN/ITN — se cifra antes de guardarse.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ssn_itn">SSN / ITN</Label>
            <Input id="ssn_itn" name="ssn_itn" required autoComplete="off" />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="autorizado" className="mt-1" />
            El cliente autorizó la captura de sus datos y la consulta de crédito.
          </label>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Convirtiendo…" : "Convertir a cliente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
