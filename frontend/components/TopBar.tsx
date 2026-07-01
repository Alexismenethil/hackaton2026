import { Search, Bell } from "lucide-react";

export default function TopBar({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-6 sm:px-6 md:px-10 md:py-8">
      <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      <div className="hidden items-center gap-1 text-ink-light sm:flex">
        <button
          type="button"
          aria-label="Buscar"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 hover:bg-black/5 hover:text-ink active:scale-95"
        >
          <Search size={19} />
        </button>
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 hover:bg-black/5 hover:text-ink active:scale-95"
        >
          <Bell size={19} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-cream" />
        </button>
      </div>
    </div>
  );
}
