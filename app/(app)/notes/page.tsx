import { listNotes } from "./actions";
import { NotesClient } from "./_components/notes-client";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const notes = await listNotes();
  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <NotesClient initialNotes={notes} />
    </main>
  );
}
