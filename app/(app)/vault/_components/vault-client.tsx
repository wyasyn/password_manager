"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deletePasswordEntry, type PasswordRow } from "../actions";
import { PasswordForm } from "./password-form";
import { generatePassword } from "@/lib/password-generator";

type Props = { initialEntries: PasswordRow[] };

export function VaultClient({ initialEntries }: Props) {
  const [entries] = useState(initialEntries);
  const [selected, setSelected] = useState<PasswordRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [generatedSeed, setGeneratedSeed] = useState("");
  const [pending, startTransition] = useTransition();

  function openNew() {
    setGeneratedSeed(generatePassword());
    setCreating(true);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    startTransition(async () => {
      try {
        await deletePasswordEntry(id);
        toast.success("Deleted");
        setSelected(null);
      } catch {
        toast.error("Failed to delete");
      }
    });
  }

  return (
    <>
      <header className="flex items-center justify-between border-b bg-background px-8 py-5">
        <div>
          <h1 className="text-2xl font-semibold">Passwords</h1>
          <p className="text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} in your vault
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 size-4" /> New password
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {entries.length === 0 ? (
          <EmptyState onCreate={openNew} />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead className="w-48">Last used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(entry)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 rounded-md">
                          {entry.iconUrl && <AvatarImage src={entry.iconUrl} alt="" />}
                          <AvatarFallback className="rounded-md text-xs">
                            {entry.platformName.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{entry.platformName}</div>
                          {entry.platformUrl && (
                            <div className="truncate text-xs text-muted-foreground">
                              {entry.platformUrl}
                            </div>
                          )}
                        </div>
                        {entry.isReused && (
                          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            <AlertCircle className="size-3" /> Reused
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.lastUsedAt
                        ? `${formatDistanceToNow(new Date(entry.lastUsedAt))} ago`
                        : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="size-12 rounded-lg">
                    {selected.iconUrl && <AvatarImage src={selected.iconUrl} alt="" />}
                    <AvatarFallback className="rounded-lg">
                      {selected.platformName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl">{selected.platformName}</SheetTitle>
                    {selected.platformUrl && (
                      <p className="text-sm text-muted-foreground">{selected.platformUrl}</p>
                    )}
                  </div>
                </div>
                {selected.isReused && (
                  <Alert>
                    <AlertCircle className="size-4" />
                    <AlertTitle>Reused password</AlertTitle>
                    <AlertDescription>
                      This account uses a password you&apos;ve used elsewhere. Update it for better protection.
                    </AlertDescription>
                  </Alert>
                )}
              </SheetHeader>
              <div className="mt-4 px-1 pb-4">
                <PasswordForm entry={selected} onDone={() => setSelected(null)} />
                <div className="mt-4 flex justify-start border-t pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(selected.id)}
                    disabled={pending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 size-4" /> Delete entry
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New password</DialogTitle>
          </DialogHeader>
          <PasswordForm
            initialPassword={generatedSeed}
            onDone={() => setCreating(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-background py-20 text-center">
      <h3 className="text-lg font-semibold">Your vault is empty</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Save your first password to get started. Vaultly will generate strong ones for you.
      </p>
      <Button className="mt-6" onClick={onCreate}>
        <Plus className="mr-2 size-4" /> New password
      </Button>
    </div>
  );
}
