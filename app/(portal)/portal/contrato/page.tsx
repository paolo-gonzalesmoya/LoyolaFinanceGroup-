import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClienteUser } from "@/lib/auth/session";
import { generarCronograma } from "@/lib/prestamos/amortizacion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AceptarContratoForm } from "./form";

export default async function ContratoClientePage() {
  const cliente = await getClienteUser();
  if (!cliente) redirect("/portal-login/ingresar");
  if (!cliente.tc_aceptado_en) redirect("/portal/terminos");

  const supabase = await createClient();

  const { data: solicitud } = await supabase
    .from("solicitud_credito")
    .select("id, monto_solicitado")
    .eq("cliente_id", cliente.id)
    .maybeSingle();
  if (!solicitud) redirect("/portal");

  const { data: contrato } = await supabase
    .from("contrato")
    .select("id, numero_cuotas, tasa_anual, downpayment_monto, cliente_acepto_en")
    .eq("solicitud_id", solicitud.id)
    .maybeSingle();
  if (!contrato) redirect("/portal");
  if (contrato.cliente_acepto_en) redirect("/portal");

  const total = Number(solicitud.monto_solicitado);
  const financiado = Math.round((total - Number(contrato.downpayment_monto)) * 100) / 100;
  const cronograma = generarCronograma(financiado, Number(contrato.tasa_anual) / 12, contrato.numero_cuotas, new Date());
  const totalCuotas = Math.round(cronograma.reduce((suma, c) => suma + c.monto, 0) * 100) / 100;
  const cargoFinanciero = Math.round((totalCuotas - financiado) * 100) / 100;
  const cuotaMensual = cronograma[0]?.monto ?? 0;

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Revisa y acepta tu contrato</CardTitle>
          <CardDescription>
            Es el último paso antes de poder autorizar tu método de cobro — léelo con calma antes de aceptar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 rounded-md border p-3 text-sm">
            <p>Monto solicitado: <span className="font-medium">${total.toFixed(2)}</span></p>
            <p>Pago inicial (downpayment): <span className="font-medium">${Number(contrato.downpayment_monto).toFixed(2)}</span></p>
            <p>Monto financiado: <span className="font-medium">${financiado.toFixed(2)}</span></p>
            <p>Tasa anual: <span className="font-medium">{contrato.tasa_anual}%</span></p>
            <p>
              Cuota mensual: <span className="font-medium">${cuotaMensual.toFixed(2)}</span> × {contrato.numero_cuotas} meses
            </p>
            <p>Cargo financiero total: <span className="font-medium">${cargoFinanciero.toFixed(2)}</span></p>
            <p>Total a pagar en cuotas: <span className="font-medium">${totalCuotas.toFixed(2)}</span></p>
          </div>
          <p className="text-xs text-muted-foreground">
            La tasa anual mostrada es una referencia — el cálculo formal de APR bajo Regulation Z lo confirma Loyola
            Finance Group antes de que este contrato sea definitivo.
          </p>
          <AceptarContratoForm contratoId={contrato.id} />
        </CardContent>
      </Card>
    </div>
  );
}
