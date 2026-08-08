"use client";

import { useActionState, useState } from "react";
import { crearUsuarioStaff, cambiarActivoUsuario } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROL_LABEL: Record<string, string> = { admin: "Admin", vendedor: "Vendedor" };

export function NuevoUsuarioForm() {
  const [state, action, pending] = useActionState(crearUsuarioStaff, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuevo usuario de staff</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="correo">Correo</Label>
              <Input id="correo" name="correo" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rol">Rol</Label>
              <Select name="rol" defaultValue="vendedor">
                <SelectTrigger id="rol" className="w-full">
                  <SelectValue>{(value: string | null) => ROL_LABEL[value ?? "vendedor"]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Creando…" : "Crear usuario"}
          </Button>
        </form>

        {state?.password && <PasswordGenerada password={state.password} />}
      </CardContent>
    </Card>
  );
}

function PasswordGenerada({ password }: { password: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
      <p className="font-medium">Usuario creado. Contraseña temporal (no se vuelve a mostrar):</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="rounded bg-background px-2 py-1">{password}</code>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(password);
            setCopiado(true);
          }}
        >
          {copiado ? "Copiada" : "Copiar"}
        </Button>
      </div>
      <p className="mt-1 text-muted-foreground">
        Pásasela a la persona por un canal seguro; que la cambie apenas entre desde “Mi cuenta” (arriba a la derecha).
      </p>
    </div>
  );
}

type UsuarioRow = { id: string; nombre: string; correo: string; rol: string; activo: boolean };

export function ListaUsuarios({ usuarios }: { usuarios: UsuarioRow[] }) {
  return (
    <div className="divide-y rounded-md border">
      {usuarios.map((usuario) => (
        <div key={usuario.id} className="flex items-center justify-between p-3 text-sm">
          <div>
            <p className="font-medium">
              {usuario.nombre} <span className="text-muted-foreground">· {usuario.correo}</span>
            </p>
            <div className="mt-1 flex gap-1.5">
              <Badge variant="secondary">{ROL_LABEL[usuario.rol] ?? usuario.rol}</Badge>
              <Badge variant={usuario.activo ? "outline" : "destructive"}>
                {usuario.activo ? "Activo" : "Desactivado"}
              </Badge>
            </div>
          </div>
          <form action={cambiarActivoUsuario.bind(null, usuario.id, !usuario.activo)}>
            <Button type="submit" size="sm" variant="ghost">
              {usuario.activo ? "Desactivar" : "Activar"}
            </Button>
          </form>
        </div>
      ))}
      {usuarios.length === 0 && <p className="p-3 text-sm text-muted-foreground">Sin usuarios todavía.</p>}
    </div>
  );
}
