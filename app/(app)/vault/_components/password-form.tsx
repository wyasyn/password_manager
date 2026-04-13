"use client";

import { useState, useTransition } from "react";
import { Copy, Eye, EyeOff, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createPasswordEntry,
  updatePasswordEntry,
  type PasswordEntryInput,
  type PasswordRow,
} from "../actions";
import { generatePassword } from "@/lib/password-generator";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { PasswordGeneratorControls } from "./password-generator-controls";

type Props = {
  entry?: PasswordRow;
  initialPassword?: string;
  onDone: () => void;
  onDelete?: () => void;
};

export function PasswordForm({ entry, initialPassword, onDone }: Props) {
  const [tab, setTab] = useState<"details" | "generator">("details");
  const [show, setShow] = useState(false);
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState<PasswordEntryInput>({
    platformName: entry?.platformName ?? "",
    platformUrl: entry?.platformUrl ?? "",
    email: entry?.email ?? "",
    username: entry?.username ?? "",
    password: initialPassword ?? "",
    website: entry?.website ?? "",
    note: entry?.note ?? "",
  });

  function update<K extends keyof PasswordEntryInput>(
    key: K,
    value: PasswordEntryInput[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function copy() {
    if (!form.password) return;
    await navigator.clipboard.writeText(form.password);
    toast.success("Copied");
  }

  function regenerate() {
    update("password", generatePassword());
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (entry) {
          await updatePasswordEntry(entry.id, form);
          toast.success("Updated");
        } else {
          await createPasswordEntry(form);
          toast.success("Saved");
        }
        onDone();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex h-full flex-col">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="details">Login details</TabsTrigger>
        <TabsTrigger value="generator">Generator</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-4 flex-1 overflow-y-auto pr-1">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="platformName">Platform</Label>
            <Input
              id="platformName"
              value={form.platformName}
              onChange={(e) => update("platformName", e.target.value)}
              placeholder="Airtable"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="platformUrl">Domain</Label>
            <Input
              id="platformUrl"
              value={form.platformUrl ?? ""}
              onChange={(e) => update("platformUrl", e.target.value)}
              placeholder="airtable.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@neonexus.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={form.username ?? ""}
              onChange={(e) => update("username", e.target.value)}
              placeholder="chloe"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="pr-24 font-mono"
                required
              />
              <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5">
                <Button type="button" size="icon" variant="ghost" className="size-7" onClick={copy}>
                  <Copy className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => setShow((s) => !s)}
                >
                  {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
                <Button type="button" size="icon" variant="ghost" className="size-7" onClick={regenerate}>
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>
            </div>
            <PasswordStrengthMeter value={form.password} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <div className="relative">
              <Input
                id="website"
                value={form.website ?? ""}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://airtable.com/login"
                className="pr-9"
              />
              {form.website && (
                <a
                  href={form.website}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={form.note ?? ""}
              onChange={(e) => update("note", e.target.value)}
              placeholder="Enter a description..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onDone}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="generator" className="mt-4">
        <PasswordGeneratorControls
          onUse={(pw) => {
            update("password", pw);
            setTab("details");
          }}
        />
      </TabsContent>
    </Tabs>
  );
}
