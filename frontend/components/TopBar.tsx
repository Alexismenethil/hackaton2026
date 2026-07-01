import { Search, Bell } from "lucide-react";

export default function TopBar({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between px-10 py-8">
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      <div className="flex items-center gap-5 text-ink-light">
        <Search size={20} />
        <div className="relative">
          <Bell size={20} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}
