import Link from "next/link";

export function StatusFilterChip({
  href,
  label,
  count,
  tone,
  active,
}: {
  href: string;
  label: string;
  count: number;
  tone: "neutral" | "shortlist" | "reject";
  active: boolean;
}) {
  const toneClass =
    tone === "shortlist"
      ? "text-[#2F5E7A]"
      : tone === "reject"
      ? "text-primary"
      : "text-muted-foreground";
  return (
    <Link
      href={href}
      scroll={false}
      className={`
        caps-meta tabular
        flex items-center gap-1.5 px-3 py-2.5 md:py-1 rounded-sm
        transition-all duration-150
        ${toneClass}
        ${active ? "bg-secondary opacity-100" : "opacity-65 hover:opacity-100 hover:bg-secondary/40"}
      `}
    >
      <span>{String(count).padStart(2, "0")}</span>
      <span>{label}</span>
    </Link>
  );
}
