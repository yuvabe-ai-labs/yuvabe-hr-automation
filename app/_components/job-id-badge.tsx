export function JobIdBadge({ code }: { code: string }) {
  return (
    <span className="caps-meta tabular bg-accent/50 text-foreground/85 px-1.5 py-0.5 rounded-sm">
      JB-{code}
    </span>
  );
}
