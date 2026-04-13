import { listPasswordEntries } from "./actions";
import { VaultClient } from "./_components/vault-client";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const entries = await listPasswordEntries();
  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <VaultClient initialEntries={entries} />
    </main>
  );
}
