"use client";

import { useActionState } from "react";
import { crearLead } from "../actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NuevoLeadForm({ categorias }: { categorias: { id: string; nombre: string }[] }) {
  const [state, action, pending] = useActionState(crearLead, undefined);

  return (
    <Card>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre del cliente</Label>
            <Input id="nombre" name="nombre" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="categoria_id">Categoría</Label>
            <Select name="categoria_id" required>
              <SelectTrigger id="categoria_id" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    categorias.find((categoria) => categoria.id === value)?.nombre ?? "Elige una categoría"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" name="direccion" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" type="tel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="correo">Correo</Label>
              <Input id="correo" name="correo" type="email" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="foto_dni">Foto de DNI</Label>
            <Input id="foto_dni" name="foto_dni" type="file" accept="image/*" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="foto_recibo">Foto de recibo</Label>
            <Input id="foto_recibo" name="foto_recibo" type="file" accept="image/*" />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Creando…" : "Crear lead"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
