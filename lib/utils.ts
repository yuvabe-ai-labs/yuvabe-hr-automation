import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDuration(startDate: string, endDate: string): string {
  const startMatch = startDate.match(/^(\d{4})-(\d{2})$/);
  if (!startMatch) return `${startDate} – ${endDate}`;
  const startY = parseInt(startMatch[1], 10);
  const startM = parseInt(startMatch[2], 10);

  const ongoing = endDate === "present";
  let endY: number;
  let endM: number;
  if (ongoing) {
    const now = new Date();
    endY = now.getFullYear();
    endM = now.getMonth() + 1;
  } else {
    const endMatch = endDate.match(/^(\d{4})-(\d{2})$/);
    if (!endMatch) return `${startDate} – ${endDate}`;
    endY = parseInt(endMatch[1], 10);
    endM = parseInt(endMatch[2], 10);
  }

  const totalMonths = Math.max(0, (endY - startY) * 12 + (endM - startM));
  let label: string;
  if (totalMonths < 1) label = "<1m";
  else if (totalMonths < 12) label = `${totalMonths}m`;
  else {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    label = months === 0 ? `${years}y` : `${years}y ${months}m`;
  }
  return ongoing ? `${label} · now` : label;
}
