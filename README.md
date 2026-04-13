# Vaultly — Password Manager

A self-hostable password manager built with **Next.js 16**, **Clerk**, **Drizzle + Neon Postgres**, and **shadcn/ui**. Generate strong passwords with full control over the rules, then save credentials per platform with AES-256-GCM encryption at rest.

## Features

- 🔐 **Vault** — store credentials per platform (email, username, password, website, note) with auto-resolved favicons
- 🎲 **Password generator** — length 8–64, character-class toggles, exclude ambiguous characters
- 💪 **Strength meter** — live scoring via `zxcvbn-ts`
- ♻️ **Reused-password detection** — server-side HMAC fingerprinting, never stores plaintext
- 📝 **Secure Notes** — encrypted free-form notes for recovery codes, secrets, etc.
- 👤 **Auth** — Clerk (email + social), with `<UserButton />` and webhook-driven user sync
- 🎨 **UI** — shadcn/ui components, Inter font, light/dark ready
- ⚡ **Built for Next.js 16** — uses the new `proxy.ts` (renamed from `middleware.ts`), async request APIs, Turbopack

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Auth | [`@clerk/nextjs`](https://clerk.com) |
| Database | [Neon](https://neon.tech) Postgres |
| ORM | [Drizzle](https://orm.drizzle.team) |
| UI | [shadcn/ui](https://ui.shadcn.com), Tailwind v4, lucide-react |
| Validation | Zod + react-hook-form |
| Crypto | Node `crypto` — AES-256-GCM + HMAC-SHA256 |
| Strength | `@zxcvbn-ts/core` |

## Prerequisites

- **Node.js 20+**
- **pnpm 9+** (`npm install -g pnpm`)
- A **Neon** account (free) → https://neon.tech
- A **Clerk** account (free) → https://dashboard.clerk.com

## Quick start

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/password_manager.git
cd password_manager
pnpm install
```

### 2. Configure environment

Copy the example file and fill it in:

```bash
cp .env.example .env.local
```

Generate the two encryption keys (each must be 32 bytes / 64 hex chars):

```bash
openssl rand -hex 32   # → ENCRYPTION_KEY
openssl rand -hex 32   # → HMAC_KEY
```

> ⚠️ **Keep these keys safe.** If you lose `ENCRYPTION_KEY`, every saved password becomes unrecoverable. Never commit `.env.local`.

Then add:

- `DATABASE_URL` — from your Neon project's connection details
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` — from your Clerk dashboard's API Keys page

### 3. Create the database tables

Generate a migration from the schema, then apply it to Neon:

```bash
pnpm db:generate
pnpm db:migrate
```

This creates the `users`, `password_entries`, and `secure_notes` tables on your Neon database. Migrations are applied via `@neondatabase/serverless` over HTTP — no `pg` driver, no SSL footguns.

### 4. Run it

```bash
pnpm dev
```

Open http://localhost:3000, sign up, and you'll land on `/vault`.

## Optional: Clerk webhook (production)

In dev, `lib/ensure-user.ts` lazily upserts the current Clerk user on first request, so you can skip this. For production, wire up the webhook so users are synced immediately:

1. In the Clerk Dashboard, go to **Webhooks** → **Add Endpoint**
2. URL: `https://your-domain.com/api/webhooks/clerk`
3. Subscribe to: `user.created`, `user.updated`, `user.deleted`
4. Copy the **Signing Secret** into `CLERK_WEBHOOK_SECRET`

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations to Neon (uses `@neondatabase/serverless`) |
| `pnpm db:studio` | Open Drizzle Studio in the browser |

## Project structure

```
app/
  (app)/                  # auth-gated route group
    layout.tsx            # sidebar shell + auth gate
    _components/
      sidebar.tsx
    vault/
      page.tsx
      actions.ts          # server actions (CRUD + reveal)
      _components/
        vault-client.tsx
        password-form.tsx
        password-generator-controls.tsx
        password-strength-meter.tsx
    notes/
      page.tsx
      actions.ts
      _components/notes-client.tsx
  api/webhooks/clerk/route.ts
  sign-in/[[...sign-in]]/page.tsx
  sign-up/[[...sign-up]]/page.tsx
  page.tsx                # landing page
  layout.tsx              # ClerkProvider + Inter
db/
  index.ts                # Neon + Drizzle client
  schema.ts               # users, password_entries, secure_notes
lib/
  crypto.ts               # AES-256-GCM + HMAC
  password-generator.ts   # Web Crypto-backed generator
  password-strength.ts    # zxcvbn-ts wrapper
  favicon.ts              # domain → icon URL
  ensure-user.ts          # lazy user upsert
  utils.ts                # cn()
proxy.ts                  # Clerk middleware (Next 16 rename)
drizzle.config.ts
.env.example
```

## How encryption works

Each saved password takes two trips through the crypto layer:

1. **Encryption** — `lib/crypto.ts` encrypts plaintext with **AES-256-GCM** using `ENCRYPTION_KEY`. Stored as `base64(iv || authTag || ciphertext)`. Each entry gets a fresh 12-byte IV.
2. **Fingerprinting** — a separate **HMAC-SHA256** keyed by `HMAC_KEY` produces a non-reversible fingerprint. The vault uses this to flag passwords reused across multiple entries (the "Reused" badge) without ever needing the plaintext.

Plaintext passwords leave the database **only** when the user explicitly clicks reveal — the `revealPassword` server action returns one decrypted value at a time and bumps `lastUsedAt`. The list view never ships plaintext to the client.

> **Threat model note:** This is server-side encryption with a server-held key — convenient and works across devices, but a server compromise that leaks `ENCRYPTION_KEY` would expose all vaults. For a zero-knowledge model, you'd need to derive the key from a user-provided master password in the browser.

## Roadmap

Things planned for future versions, roughly in priority order:

### v1.1 — quality of life
- [ ] **Search & filter** — wire up the sidebar search input to filter the vault by platform / username
- [ ] **Sort options** — by name, last used, date created, strength
- [ ] **Bulk select & delete** — checkbox column from the reference design
- [ ] **Favorites / pinning**
- [ ] **Tags or folders** for grouping entries
- [ ] **Dark mode toggle** in the sidebar (theme tokens are already wired)
- [ ] **Keyboard shortcuts** — `cmd+k` quick search, `cmd+n` new entry, `cmd+c` copy on focused row

### v1.2 — security hardening
- [ ] **HIBP breach check** — k-anonymity Pwned Passwords API on save and on a periodic sweep
- [ ] **Password expiry / age warnings**
- [ ] **Vault auto-lock** after N minutes of idle (re-prompt for Clerk session)
- [ ] **Audit log** — track reveal / edit / delete events per entry
- [ ] **Rate-limit** the `revealPassword` server action

### v2 — bigger features
- [ ] **Secure file attachments** for entries (encrypted blobs in S3/R2)
- [ ] **Payments & IDs vaults** — finish the disabled sidebar items
- [ ] **Sharing center** — share a single entry with another Vaultly user via wrapped key exchange
- [ ] **Import** from 1Password / Bitwarden / LastPass / CSV
- [ ] **Export** as encrypted JSON
- [ ] **TOTP / 2FA codes** stored alongside entries (like Authy)
- [ ] **Password history** — keep the last N versions per entry

### v3 — zero-knowledge
- [ ] **Client-side E2E encryption** — derive the vault key from a user master password (Argon2id) in the browser so the server only sees ciphertext. Requires a key-recovery story (recovery codes, social recovery).
- [ ] **Browser extension** with autofill
- [ ] **Mobile app** (Expo / React Native) sharing the same encrypted store
- [ ] **CLI** for power users

### Tech debt
- [ ] CI step that runs `pnpm db:migrate` automatically on deploy
- [ ] Add unit tests for `lib/crypto.ts` (round-trip + tamper detection) and `lib/password-generator.ts` (entropy, char-class guarantees)
- [ ] Add Playwright e2e for the core sign-up → save → reveal → delete flow
- [ ] Replace `confirm()` dialogs with shadcn `AlertDialog`
- [ ] Memoize the zxcvbn dictionary load (currently lazy-init per module)

## Deploying

The easiest path is **Vercel**:

1. Push to GitHub
2. Import the repo at https://vercel.com/new
3. Add every variable from `.env.example` in **Project Settings → Environment Variables**
4. Deploy

Neon and Clerk both have free tiers that work end-to-end with Vercel out of the box.

## License

MIT
