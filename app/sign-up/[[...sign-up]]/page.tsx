import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <SignUp appearance={{ elements: { card: "shadow-lg" } }} />
    </main>
  );
}
