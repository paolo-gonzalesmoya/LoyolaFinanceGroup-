"use client";

import { useActionState } from "react";
import { registrarAvanceObra } from "./actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ETAPA_LABEL: Record<string, string> = { inicial: "Inicial", en_proceso: "En proceso", final: "Final" };

export function AvanceObraForm({ clienteId, contratoId }: { clienteId: string; contratoId: string }) {
  const [state, action, pending] = useActionState(
    registrarAvanceObra.bind(null, { clienteId, contratoId }),
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="etapa">Etapa</Label>
        <Select name="etapa" defaultValue="inicial">
          <SelectTrigger id="etapa" className="w-full">
            <SelectValue>{(value: string | null) => ETAPA_LABEL[value ?? "inicial"]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inicial">Inicial</SelectItem>
            <SelectItem value="en_proceso">En proceso</SelectItem>
            <SelectItem value="final">Final</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" name="descripcion" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="foto">Foto</Label>
        <Input id="foto" name="foto" type="file" accept="image/*" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Registrar avance"}
      </Button>
    </form>
  );
}

type Avance = { id: string; etapa: string; descripcion: string | null; fecha_registro: string; fotoUrl: string | null };

export function AvanceObraTimeline({ avances }: { avances: Avance[] }) {
  if (avances.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin avances registrados todavía.</p>;
  }

  return (
    <div className="space-y-3">
      {avances.map((avance) => (
        <div key={avance.id} className="rounded-md border p-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{ETAPA_LABEL[avance.etapa] ?? avance.etapa}</Badge>
            <span className="text-muted-foreground">{new Date(avance.fecha_registro).toLocaleString("es")}</span>
          </div>
          {avance.descripcion && <p className="mt-1">{avance.descripcion}</p>}
          {avance.fotoUrl && (
            <a
              href={avance.fotoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-primary hover:underline"
            >
              Ver foto
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
