"use client";

import { useActionState, useState } from "react";
import { crearCliente } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { US_STATES } from "@/lib/us-states";
import { PREQUALIFICACION_TEXTO } from "@/lib/legal/prequalificacion";

function EstadoSelect({ id, name, defaultValue, required }: { id: string; name: string; defaultValue?: string; required?: boolean }) {
  return (
    <Select name={name} defaultValue={defaultValue} required={required}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue>{(value: string | null) => value ?? "Selecciona"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {US_STATES.map((s) => (
          <SelectItem key={s.code} value={s.code}>
            {s.nombre} ({s.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function NuevoClienteForm() {
  const [state, action, pending] = useActionState(crearCliente, undefined);
  const [instalacionMisma, setInstalacionMisma] = useState(true);

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="nombre_pila">Nombre*</Label>
          <Input id="nombre_pila" name="nombre_pila" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nombre_medio">Segundo nombre</Label>
          <Input id="nombre_medio" name="nombre_medio" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="apellido">Apellido*</Label>
          <Input id="apellido" name="apellido" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="direccion">Dirección de correspondencia*</Label>
        <Input id="direccion" name="direccion" required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="ciudad">Ciudad*</Label>
          <Input id="ciudad" name="ciudad" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estado">Estado*</Label>
          <EstadoSelect id="estado" name="estado" defaultValue="TX" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="codigo_postal">Código postal*</Label>
          <Input id="codigo_postal" name="codigo_postal" required />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="licencia_numero">Número de licencia de conducir</Label>
          <Input id="licencia_numero" name="licencia_numero" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="licencia_estado">Estado de la licencia</Label>
          <EstadoSelect id="licencia_estado" name="licencia_estado" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fecha_nacimiento">Fecha de nacimiento*</Label>
          <Input id="fecha_nacimiento" name="fecha_nacimiento" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ssn_itn">SSN / ITN*</Label>
          <Input id="ssn_itn" name="ssn_itn" required />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">El SSN/ITN se guarda cifrado — solo se muestran los últimos 4 dígitos salvo revelado explícito.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" type="tel" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="correo">Correo</Label>
          <Input id="correo" name="correo" type="email" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>¿La dirección de instalación es la misma que la de arriba?*</Label>
        <input type="hidden" name="instalacion_misma_direccion" value={instalacionMisma ? "si" : "no"} />
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={instalacionMisma ? "default" : "outline"}
            onClick={() => setInstalacionMisma(true)}
          >
            Sí
          </Button>
          <Button
            type="button"
            variant={!instalacionMisma ? "default" : "outline"}
            onClick={() => setInstalacionMisma(false)}
          >
            No
          </Button>
        </div>
      </div>

      {!instalacionMisma && (
        <div className="space-y-4 rounded-md border p-3">
          <div className="space-y-1.5">
            <Label htmlFor="direccion_instalacion">Dirección de instalación*</Label>
            <Input id="direccion_instalacion" name="direccion_instalacion" required={!instalacionMisma} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="ciudad_instalacion">Ciudad*</Label>
              <Input id="ciudad_instalacion" name="ciudad_instalacion" required={!instalacionMisma} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estado_instalacion">Estado*</Label>
              <EstadoSelect id="estado_instalacion" name="estado_instalacion" defaultValue="TX" required={!instalacionMisma} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="codigo_postal_instalacion">Código postal*</Label>
              <Input id="codigo_postal_instalacion" name="codigo_postal_instalacion" required={!instalacionMisma} />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-line text-muted-foreground">
        {PREQUALIFICACION_TEXTO}
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="autorizado" className="mt-1" />
        El cliente autorizó la captura de sus datos y la consulta de crédito.
      </label>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Registrando…" : "Registrar cliente"}
      </Button>
    </form>
  );
}
