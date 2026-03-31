import { AdscoraMark } from "@/components/AdscoraLogo";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { BarChart3, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-muted-foreground text-center">Authentication required.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 z-10">
        <a href="/panel" className="flex items-center gap-2 min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <AdscoraMark className="h-8 w-8 shrink-0" />
          <span className="font-sans text-lg font-semibold tracking-tight truncate">Adscora</span>
        </a>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[140px]">
            {user.name || user.email}
          </span>
          <Button variant="ghost" size="sm" className="gap-1.5" asChild>
            <a href="/analyses">
              <BarChart3 className="size-4" />
              <span className="hidden sm:inline">Analyses</span>
            </a>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5" asChild>
            <a href="/settings">
              <Settings className="size-4" />
              <span className="hidden sm:inline">Settings</span>
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            title="Sign out"
            onClick={async () => {
              await logout();
              setLocation("/");
            }}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
