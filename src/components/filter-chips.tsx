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
      "rounded-sm text-sm transition-colors",
      active
        ? "text-foreground underline decoration-foreground/40 decoration-1 underline-offset-4"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-x-4 gap-y-1">
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
