import Image from "next/image";

// Logo real de la marca (recursos/logo.jfif, recortado). Tiene fondo blanco
// (es un .jpg, sin transparencia) — sobre fondos oscuros hay que envolverlo
// en una placa blanca (onDark) para que no se vea como un rectángulo suelto.
export function Logo({ className = "h-9 w-auto", onDark = false }: { className?: string; onDark?: boolean }) {
  const img = (
    <Image src="/logo.jpg" alt="Loyola Finance Group" width={1394} height={587} className={className} priority />
  );

  if (!onDark) return img;

  return <span className="inline-flex items-center rounded-md bg-white px-3 py-1.5 shadow-sm">{img}</span>;
}
