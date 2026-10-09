"use client";

import { cn } from "@/lib/utils";

interface FilterChipsProps {
  label: string;
  allLabel: string;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function FilterChips({
  label,
  allLabel,
  options,
  value,
  onChange,
}: FilterChipsProps) {
  const chip = (active: boolean) =>
    cn(
      "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors active:scale-[0.97]",
      active
        ? "border-foreground bg-foreground text-background"
        : "border-border text-muted-foreground hover:bg-card hover:text-foreground"
    );

  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={chip(value === null)}
      >
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(value === option ? null : option)}
          className={chip(value === option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
