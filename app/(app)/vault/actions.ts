"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { passwordEntries } from "@/db/schema";
import { decrypt, encrypt, hmacPassword } from "@/lib/crypto";
import { faviconUrl, normalizeDomain } from "@/lib/favicon";
import { ensureUserExists } from "@/lib/ensure-user";

const InputSchema = z.object({
  platformName: z.string().min(1, "Required").max(120),
  platformUrl: z.string().max(255).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  username: z.string().max(120).optional().nullable(),
  password: z.string().min(1, "Required").max(512),
  website: z.string().max(255).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
});

export type PasswordEntryInput = z.infer<typeof InputSchema>;

export type PasswordRow = {
  id: string;
  platformName: string;
  platformUrl: string | null;
  iconUrl: string | null;
  email: string | null;
  username: string | null;
  website: string | null;
  note: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  isReused: boolean;
};

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await ensureUserExists(userId);
  return userId;
}

export async function listPasswordEntries(): Promise<PasswordRow[]> {
  const userId = await requireUserId();
  const rows = await db
    .select()
    .from(passwordEntries)
    .where(eq(passwordEntries.userId, userId))
    .orderBy(sql`${passwordEntries.lastUsedAt} desc nulls last, ${passwordEntries.createdAt} desc`);

  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.passwordHmac, (counts.get(r.passwordHmac) ?? 0) + 1);

  return rows.map((r) => ({
    id: r.id,
    platformName: r.platformName,
    platformUrl: r.platformUrl,
    iconUrl: r.iconUrl,
    email: r.email,
    username: r.username,
    website: r.website,
    note: r.note,
    lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    isReused: (counts.get(r.passwordHmac) ?? 0) > 1,
  }));
}

export async function createPasswordEntry(raw: PasswordEntryInput) {
  const userId = await requireUserId();
  const input = InputSchema.parse(raw);
  const domain = input.platformUrl ? normalizeDomain(input.platformUrl) : null;

  await db.insert(passwordEntries).values({
    userId,
    platformName: input.platformName,
    platformUrl: domain,
    iconUrl: faviconUrl(domain),
    email: input.email || null,
    username: input.username || null,
    passwordCiphertext: encrypt(input.password),
    passwordHmac: hmacPassword(input.password),
    website: input.website || null,
    note: input.note || null,
  });

  revalidatePath("/vault");
}

export async function updatePasswordEntry(id: string, raw: PasswordEntryInput) {
  const userId = await requireUserId();
  const input = InputSchema.parse(raw);
  const domain = input.platformUrl ? normalizeDomain(input.platformUrl) : null;

  await db
    .update(passwordEntries)
    .set({
      platformName: input.platformName,
      platformUrl: domain,
      iconUrl: faviconUrl(domain),
      email: input.email || null,
      username: input.username || null,
      passwordCiphertext: encrypt(input.password),
      passwordHmac: hmacPassword(input.password),
      website: input.website || null,
      note: input.note || null,
      updatedAt: new Date(),
    })
    .where(and(eq(passwordEntries.id, id), eq(passwordEntries.userId, userId)));

  revalidatePath("/vault");
}

export async function deletePasswordEntry(id: string) {
  const userId = await requireUserId();
  await db
    .delete(passwordEntries)
    .where(and(eq(passwordEntries.id, id), eq(passwordEntries.userId, userId)));
  revalidatePath("/vault");
}

export async function revealPassword(id: string): Promise<string> {
  const userId = await requireUserId();
  const [row] = await db
    .select({ ciphertext: passwordEntries.passwordCiphertext })
    .from(passwordEntries)
    .where(and(eq(passwordEntries.id, id), eq(passwordEntries.userId, userId)))
    .limit(1);
  if (!row) throw new Error("Not found");

  await db
    .update(passwordEntries)
    .set({ lastUsedAt: new Date() })
    .where(and(eq(passwordEntries.id, id), eq(passwordEntries.userId, userId)));

  return decrypt(row.ciphertext);
}
