"use client";

import { useActionState } from "react";
import { completarDatosLead } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Campo = {
  id: string;
  nombre_campo: string;
  unidad_medida: string | null;
  tipo_dato: "numero" | "texto" | "seleccion";
  opciones: string[] | null;
};

export function CompletarDatosForm({ leadId, campos }: { leadId: string; campos: Campo[] }) {
  const [state, action, pending] = useActionState(completarDatosLead.bind(null, leadId), undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="direccion">Dirección</Label>
          <Input id="direccion" name="direccion" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" type="tel" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="correo">Correo</Label>
          <Input id="correo" name="correo" type="email" />
        </div>
      </div>

      {campos.map((campo) => {
        const name = `campo_${campo.id}`;
        const etiqueta = campo.unidad_medida ? `${campo.nombre_campo} (${campo.unidad_medida})` : campo.nombre_campo;

        if (campo.tipo_dato === "seleccion") {
          return (
            <div key={campo.id} className="space-y-1.5">
              <Label htmlFor={name}>{etiqueta}</Label>
              <Select name={name}>
                <SelectTrigger id={name} className="w-full">
                  <SelectValue placeholder="Elige una opción" />
                </SelectTrigger>
                <SelectContent>
                  {(campo.opciones ?? []).map((opcion) => (
                    <SelectItem key={opcion} value={opcion}>
                      {opcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        return (
          <div key={campo.id} className="space-y-1.5">
            <Label htmlFor={name}>{etiqueta}</Label>
            <Input id={name} name={name} type={campo.tipo_dato === "numero" ? "number" : "text"} step="any" />
          </div>
        );
      })}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar y avanzar a en proceso"}
      </Button>
    </form>
  );
}
