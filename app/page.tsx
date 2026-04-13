import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ShieldCheck, KeyRound, Sparkles } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/vault");

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-5 text-primary" />
          Vaultly
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>
            Sign in
          </Link>
          <Link href="/sign-up" className={buttonVariants()}>
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" /> Strong by default. Yours alone.
        </span>
        <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          A password manager that actually feels good to use.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Generate uncrackable passwords, save them per platform, and forget
          about ever reusing one again.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
            <KeyRound className="mr-2 size-4" /> Create your vault
          </Link>
          <Link
            href="/sign-in"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            I already have one
          </Link>
        </div>
      </section>

      <footer className="px-8 py-6 text-center text-xs text-muted-foreground">
        Built with Next.js · Encrypted with AES-256-GCM
      </footer>
    </main>
  );
}
