import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";

// Excel-friendly: nunca incluye el SSN/ITN (ni cifrado ni de ningún modo) —
// esta lista es solo lo que ya se ve en /clientes, para que admin la pueda
// bajar y filtrar/ordenar en su propia planilla.
function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET() {
  const usuario = await getStaffUser();
  if (!usuario || (usuario.rol !== "admin" && usuario.rol !== "vendedor")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // Sin filtro explícito: la RLS scoped al asesor (vendedor_select en
  // cliente) limita el export a sus propios clientes.
  const supabase = await createClient();
  const { data: clientes, error } = await supabase
    .from("cliente")
    .select("nombre, correo, telefono, direccion, fecha_registro, verificado")
    .order("fecha_registro", { ascending: false });

  if (error) {
    return NextResponse.json({ error: `No se pudo exportar: ${error.message}` }, { status: 500 });
  }

  const columnas = ["Nombre", "Correo", "Teléfono", "Dirección", "Registrado", "Verificado"];
  const filas = (clientes ?? []).map((cliente) =>
    [
      cliente.nombre,
      cliente.correo ?? "",
      cliente.telefono ?? "",
      cliente.direccion ?? "",
      new Date(cliente.fecha_registro).toLocaleDateString("es"),
      cliente.verificado ? "Sí" : "No",
    ]
      .map((valor) => csvEscape(String(valor)))
      .join(",")
  );

  // BOM al inicio: sin esto Excel interpreta mal los acentos/ñ en UTF-8.
  const csv = "﻿" + [columnas.join(","), ...filas].join("\r\n");
  const fecha = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-${fecha}.csv"`,
    },
  });
}
