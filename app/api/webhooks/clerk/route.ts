import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("CLERK_WEBHOOK_SECRET is not set", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const u = evt.data;
    const email =
      u.email_addresses.find((e) => e.id === u.primary_email_address_id)
        ?.email_address ?? u.email_addresses[0]?.email_address ?? "";
    const name =
      [u.first_name, u.last_name].filter(Boolean).join(" ") || null;

    await db
      .insert(users)
      .values({
        id: u.id,
        email,
        name,
        imageUrl: u.image_url ?? null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { email, name, imageUrl: u.image_url ?? null, updatedAt: sql`now()` },
      });
  } else if (evt.type === "user.deleted" && evt.data.id) {
    await db.delete(users).where(sql`${users.id} = ${evt.data.id}`);
  }

  return new Response("ok", { status: 200 });
}
