"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KeyRound,
  StickyNote,
  CreditCard,
  IdCard,
  Share2,
  LifeBuoy,
  Settings,
  Search,
  ChevronsUpDown,
  ShieldCheck,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/vault", label: "Passwords", icon: KeyRound, enabled: true },
  { href: "/notes", label: "Secure Notes", icon: StickyNote, enabled: true },
  { href: "/payments", label: "Payments", icon: CreditCard, enabled: false },
  { href: "/ids", label: "IDs", icon: IdCard, enabled: false },
];

const SECONDARY = [
  { href: "/sharing", label: "Sharing Center", icon: Share2, enabled: false },
  { href: "/support", label: "Support", icon: LifeBuoy, enabled: false },
  { href: "/settings", label: "Settings", icon: Settings, enabled: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-background/60 p-3 backdrop-blur">
      <button
        type="button"
        className="mb-4 flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-muted"
      >
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Vaultly</div>
            <div className="text-xs text-muted-foreground">Personal plan</div>
          </div>
        </div>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </button>

      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search" className="pl-8" />
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname?.startsWith(item.href);
          const content = (
            <span
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                active && item.enabled
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground",
                item.enabled ? "hover:bg-muted hover:text-foreground" : "cursor-not-allowed opacity-60",
              )}
            >
              <Icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              {!item.enabled && (
                <Badge variant="secondary" className="text-[10px]">
                  Soon
                </Badge>
              )}
            </span>
          );
          return item.enabled ? (
            <Link key={item.href} href={item.href}>
              {content}
            </Link>
          ) : (
            <div key={item.href}>{content}</div>
          );
        })}
      </nav>

      <div className="my-4 border-t" />

      <nav className="flex flex-col gap-1">
        {SECONDARY.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.href}
              className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-60"
            >
              <Icon className="size-4" />
              <span className="flex-1">{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
        <UserButton appearance={{ elements: { avatarBox: "size-9" } }} />
        <div className="flex-1 overflow-hidden text-sm">
          <div className="truncate font-medium">Your account</div>
          <div className="truncate text-xs text-muted-foreground">
            Manage profile
          </div>
        </div>
      </div>
    </aside>
  );
}
