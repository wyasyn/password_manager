"use client";

import { useEffect, useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  DEFAULT_OPTIONS,
  generatePassword,
  type GeneratorOptions,
} from "@/lib/password-generator";
import { PasswordStrengthMeter } from "./password-strength-meter";

type Props = {
  onUse: (password: string) => void;
};

export function PasswordGeneratorControls({ onUse }: Props) {
  const [opts, setOpts] = useState<GeneratorOptions>(DEFAULT_OPTIONS);
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(generatePassword(opts));
  }, [opts]);

  function regenerate() {
    setValue(generatePassword(opts));
  }

  async function copy() {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-muted/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <code className="flex-1 break-all font-mono text-sm">{value}</code>
          <div className="flex shrink-0 gap-1">
            <Button type="button" size="icon" variant="ghost" onClick={copy}>
              <Copy className="size-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" onClick={regenerate}>
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <PasswordStrengthMeter value={value} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Length</Label>
          <span className="text-sm tabular-nums text-muted-foreground">
            {opts.length}
          </span>
        </div>
        <Slider
          value={[opts.length]}
          min={8}
          max={64}
          step={1}
          onValueChange={(v) =>
            setOpts((o) => ({
              ...o,
              length: Array.isArray(v) ? v[0] : v,
            }))
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { key: "upper", label: "Uppercase (A–Z)" },
            { key: "lower", label: "Lowercase (a–z)" },
            { key: "digits", label: "Digits (0–9)" },
            { key: "symbols", label: "Symbols (!@#…)" },
            { key: "excludeAmbiguous", label: "Exclude ambiguous" },
          ] as const
        ).map((opt) => (
          <label
            key={opt.key}
            className="flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm hover:bg-muted/50"
          >
            <Checkbox
              checked={opts[opt.key]}
              onCheckedChange={(checked) =>
                setOpts((o) => ({ ...o, [opt.key]: checked === true }))
              }
            />
            {opt.label}
          </label>
        ))}
      </div>

      <Button type="button" className="w-full" onClick={() => onUse(value)}>
        Use this password
      </Button>
    </div>
  );
}
