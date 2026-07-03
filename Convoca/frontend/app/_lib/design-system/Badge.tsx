import type { StatusStyle } from "./status-map";

export function Badge({ label, bg, color }: StatusStyle) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-bold"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}
