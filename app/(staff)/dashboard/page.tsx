// Placeholder de la Fase 0: solo prueba que proxy.ts exige sesión para
// llegar hasta acá. El dashboard real (préstamos, cuotas del día, etc.) se
// construye conforme avanzan las Fases 1-6.
export default function DashboardPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">Llegaste hasta acá porque hay una sesión activa.</p>
    </div>
  );
}
