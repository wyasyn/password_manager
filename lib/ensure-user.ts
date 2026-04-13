import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

// Idempotent upsert. Acts as a fallback when the Clerk webhook hasn't fired yet
// (e.g. local dev without webhook tunnel).
export async function ensureUserExists(userId: string): Promise<void> {
  const user = await currentUser();
  if (!user || user.id !== userId) return;

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";

  await db
    .insert(users)
    .values({
      id: userId,
      email,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
      imageUrl: user.imageUrl ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
        imageUrl: user.imageUrl ?? null,
        updatedAt: sql`now()`,
      },
    });
}
