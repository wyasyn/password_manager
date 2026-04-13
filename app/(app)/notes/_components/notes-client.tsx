"use client";

import { useState, useTransition, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Plus, Trash2, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createNote,
  deleteNote,
  readNote,
  updateNote,
  type NoteRow,
} from "../actions";

type Props = { initialNotes: NoteRow[] };

export function NotesClient({ initialNotes }: Props) {
  const [notes] = useState(initialNotes);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedId) return;
    setBody("Loading…");
    readNote(selectedId)
      .then((n) => {
        setTitle(n.title);
        setBody(n.body);
      })
      .catch(() => toast.error("Failed to load note"));
  }, [selectedId]);

  function save() {
    startTransition(async () => {
      try {
        if (selectedId) {
          await updateNote(selectedId, { title, body });
        } else {
          await createNote({ title, body });
          setCreating(false);
        }
        toast.success("Saved");
        setSelectedId(null);
        setTitle("");
        setBody("");
      } catch {
        toast.error("Failed to save");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this note?")) return;
    startTransition(async () => {
      await deleteNote(id);
      toast.success("Deleted");
      setSelectedId(null);
    });
  }

  return (
    <>
      <header className="flex items-center justify-between border-b bg-background px-8 py-5">
        <div>
          <h1 className="text-2xl font-semibold">Secure Notes</h1>
          <p className="text-sm text-muted-foreground">
            {notes.length} {notes.length === 1 ? "note" : "notes"} encrypted
          </p>
        </div>
        <Button
          onClick={() => {
            setTitle("");
            setBody("");
            setCreating(true);
          }}
        >
          <Plus className="mr-2 size-4" /> New note
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-background py-20 text-center">
            <StickyNote className="size-8 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-semibold">No notes yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Save secrets, recovery codes, or anything else worth encrypting.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setSelectedId(n.id)}
                className="group rounded-xl border bg-background p-4 text-left transition hover:border-foreground/20 hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <StickyNote className="size-4 text-muted-foreground" />
                  <div className="truncate font-medium">{n.title}</div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(n.updatedAt))} ago
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit note</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 px-1">
            <div className="space-y-1.5">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note-body">Body</Label>
              <Textarea
                id="note-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
              />
            </div>
            <div className="flex justify-between border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectedId && remove(selectedId)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 size-4" /> Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedId(null)}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={pending}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New secure note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-title">Title</Label>
              <Input
                id="new-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Recovery codes"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-body">Body</Label>
              <Textarea
                id="new-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Write something secret..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={pending || !title}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
