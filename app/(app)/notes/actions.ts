"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { secureNotes } from "@/db/schema";
import { decrypt, encrypt } from "@/lib/crypto";
import { ensureUserExists } from "@/lib/ensure-user";

const InputSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(10_000),
});

export type NoteInput = z.infer<typeof InputSchema>;

export type NoteRow = {
  id: string;
  title: string;
  updatedAt: string;
};

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await ensureUserExists(userId);
  return userId;
}

export async function listNotes(): Promise<NoteRow[]> {
  const userId = await requireUserId();
  const rows = await db
    .select({ id: secureNotes.id, title: secureNotes.title, updatedAt: secureNotes.updatedAt })
    .from(secureNotes)
    .where(eq(secureNotes.userId, userId))
    .orderBy(desc(secureNotes.updatedAt));
  return rows.map((r) => ({ id: r.id, title: r.title, updatedAt: r.updatedAt.toISOString() }));
}

export async function readNote(id: string): Promise<{ title: string; body: string }> {
  const userId = await requireUserId();
  const [row] = await db
    .select()
    .from(secureNotes)
    .where(and(eq(secureNotes.id, id), eq(secureNotes.userId, userId)))
    .limit(1);
  if (!row) throw new Error("Not found");
  return { title: row.title, body: decrypt(row.bodyCiphertext) };
}

export async function createNote(raw: NoteInput) {
  const userId = await requireUserId();
  const input = InputSchema.parse(raw);
  await db.insert(secureNotes).values({
    userId,
    title: input.title,
    bodyCiphertext: encrypt(input.body),
  });
  revalidatePath("/notes");
}

export async function updateNote(id: string, raw: NoteInput) {
  const userId = await requireUserId();
  const input = InputSchema.parse(raw);
  await db
    .update(secureNotes)
    .set({
      title: input.title,
      bodyCiphertext: encrypt(input.body),
      updatedAt: new Date(),
    })
    .where(and(eq(secureNotes.id, id), eq(secureNotes.userId, userId)));
  revalidatePath("/notes");
}

export async function deleteNote(id: string) {
  const userId = await requireUserId();
  await db
    .delete(secureNotes)
    .where(and(eq(secureNotes.id, id), eq(secureNotes.userId, userId)));
  revalidatePath("/notes");
}
