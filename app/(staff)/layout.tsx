// Shell del staff (admin + vendedor). La navegación real, condicionada por
// rol (admin ve todo, vendedor solo Leads), se arma en la Fase 1 una vez
// existe una sesión de la que leer el rol.
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh">
      <header className="border-b p-4">
        <span className="font-semibold">Loyola Finance Group</span>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
