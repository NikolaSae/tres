// app/page.tsx
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dobrodošli | Fin-App-Hub",
  description: "Finansijski izveštaji, reklamacije, parking i još mnogo toga.",
};

export default async function Home() {
  // ✅ connection() signalizira Next.js-u da je ova stranica dinamička
  await connection();
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="space-y-6 text-center px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)] animate-in fade-in duration-700">
          Fin-App-Hub
        </h1>
        <p className="text-slate-100 text-base sm:text-lg font-light tracking-wide max-w-md mx-auto animate-in fade-in duration-700 delay-150">
          Finansijski izveštaji, reklamacije, parking i još mnogo toga.
        </p>
        <div className="pt-4 animate-in fade-in duration-700 delay-300">
          <LoginButton mode="modal" asChild>
            <Button
              variant="default"
              size="lg"
              className="shadow-lg hover:shadow-xl bg-white text-slate-900 hover:bg-slate-100 transition-all duration-300 transform hover:scale-105"
            >
              Prijava
            </Button>
          </LoginButton>
        </div>
      </div>
    </main>
  );
}