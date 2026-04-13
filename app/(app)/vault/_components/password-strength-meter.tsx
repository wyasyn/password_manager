"use client";

import { useMemo } from "react";
import { passwordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

export function PasswordStrengthMeter({ value }: { value: string }) {
  const result = useMemo(() => passwordStrength(value || ""), [value]);
  const filled = ((result.score + 1) / 5) * 100;

  return (
    <div className="space-y-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all", result.color)}
          style={{ width: `${value ? filled : 0}%` }}
        />
      </div>
      {value && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          Password strength: {result.label}
        </p>
      )}
    </div>
  );
}
