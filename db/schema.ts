import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // keep if using external auth
    email: text("email").notNull().unique(),
    name: text("name"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("users_email_idx").on(t.email)],
);

export const passwordEntries = pgTable(
  "password_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platformName: text("platform_name").notNull(),
    platformUrl: text("platform_url"),
    iconUrl: text("icon_url"),
    email: text("email"),
    username: text("username"),
    passwordCiphertext: text("password_ciphertext").notNull(),
    passwordHmac: text("password_hmac").notNull(),
    website: text("website"),
    note: text("note"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("password_entries_user_id_idx").on(t.userId),
    index("password_entries_user_hmac_idx").on(t.userId, t.passwordHmac),
  ],
);

export const secureNotes = pgTable(
  "secure_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    bodyCiphertext: text("body_ciphertext").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("secure_notes_user_id_idx").on(t.userId)],
);

export type PasswordEntry = typeof passwordEntries.$inferSelect;
export type NewPasswordEntry = typeof passwordEntries.$inferInsert;
export type SecureNote = typeof secureNotes.$inferSelect;
export type NewSecureNote = typeof secureNotes.$inferInsert;
