// app/page.tsx
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";

export default async function Home() {
  return (
    <main className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="space-y-6 text-center">
        <h1 className="text-6xl font-bold text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)]">
          Fin-App-Hub
        </h1>
        <p className="text-slate-100 text-lg font-light tracking-wide">
          Finansijski izveštaji, reklamacije, parking...
        </p>
        <div className="pt-4">
          <LoginButton mode="modal" asChild>
            <Button 
              variant={"default"} 
              size={"lg"}
              className="shadow-container hover:shadow-hover bg-white text-slate-900 hover:bg-slate-100 transition-all"
            >
              Prijava
            </Button>
          </LoginButton>
        </div>
      </div>
    </main>
  );
}