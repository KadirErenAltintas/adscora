import { AdscoraMark } from "@/components/AdscoraLogo";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { BarChart3, LogOut, Menu, X, Settings, Sparkles } from "lucide-react";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in</p>
          <a href="/" className="btn btn-primary">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Chat Workspace", path: "/panel", icon: Sparkles },
    { label: "Analyses", path: "/analyses", icon: BarChart3 },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="flex" style={{ minHeight: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 z-40 w-60 sm:w-64 h-screen bg-card border-r border-border transition-transform duration-300 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-border">
          <a href="/panel" className="flex items-center gap-2 sm:gap-3 min-w-0 rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
            <AdscoraMark className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
            <h1 className="font-display text-base sm:text-lg font-extrabold text-foreground truncate tracking-tight">
              Adscora
            </h1>
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 sm:px-4 py-4 sm:py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs sm:text-sm font-medium"
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="px-2 sm:px-4 py-3 sm:py-4 border-t border-border">
          <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-muted">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-foreground truncate">{user.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 sm:p-1.5 hover:bg-card rounded-lg transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <div className="flex-1 min-w-0" />
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <main className="flex-1 min-w-0 overflow-auto">
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
