"use client";

import { useActionState, useState } from "react";
import { crearCotizacion } from "../../actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

let nextRowId = 0;

export function CotizacionForm({ clienteId }: { clienteId: string }) {
  const [state, action, pending] = useActionState(crearCotizacion.bind(null, clienteId), undefined);
  const [filas, setFilas] = useState(() => [nextRowId++]);

  return (
    <Card>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-3">
            <Label>Ítems</Label>
            {filas.map((filaId) => (
              <div key={filaId} className="grid grid-cols-[1fr_5rem_7rem_auto] items-end gap-2">
                <div className="space-y-1.5">
                  {filaId === filas[0] && <Label className="text-xs">Descripción</Label>}
                  <Input name="descripcion" placeholder="Materiales, mano de obra…" />
                </div>
                <div className="space-y-1.5">
                  {filaId === filas[0] && <Label className="text-xs">Cantidad</Label>}
                  <Input name="cantidad" type="number" step="any" defaultValue="1" />
                </div>
                <div className="space-y-1.5">
                  {filaId === filas[0] && <Label className="text-xs">Precio unitario</Label>}
                  <Input name="precio_unitario" type="number" step="any" />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={filas.length === 1}
                  onClick={() => setFilas((f) => f.filter((id) => id !== filaId))}
                >
                  Quitar
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setFilas((f) => [...f, nextRowId++])}>
              Agregar ítem
            </Button>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="requiere_financiamiento" defaultChecked />
            Requiere financiamiento
          </label>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Creando…" : "Crear cotización"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
