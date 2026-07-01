export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-cream/95 px-4 py-3 backdrop-blur md:hidden">
      <div>
        <h1 className="text-base font-bold leading-tight text-ink">Radar Escolar</h1>
        <p className="text-[11px] text-ink-light">Pedagogía del Cuidado</p>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
        PM
      </div>
    </header>
  );
}
