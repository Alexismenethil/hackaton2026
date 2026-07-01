// Iniciales en vez de fotos: no depende de red (ninguna imagen externa que
// cargar), así que nunca rompe la demo por falta de conexión.
const PALETA = ["#2E4756", "#D97748", "#3F7F5C", "#B9791F", "#6B4C8A", "#2E7D8C"];

function colorPara(nombre: string) {
  const codigo = nombre.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PALETA[codigo % PALETA.length];
}

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase();
}

export default function Avatar({ nombre, size = 48 }: { nombre: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white shrink-0"
      style={{ backgroundColor: colorPara(nombre), width: size, height: size, fontSize: size * 0.38 }}
    >
      {iniciales(nombre)}
    </div>
  );
}
