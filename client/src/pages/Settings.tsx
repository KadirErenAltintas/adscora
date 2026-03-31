import { useRequireAuth } from "@/_core/hooks/useRequireAuth";
import { useLocation } from "wouter";
import AdscoraPanelShell from "@/components/AdscoraPanelShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { User, Lock, Bell, Key, LogOut } from "lucide-react";

export default function Settings() {
  const { user, isAuthenticated, logout, loading: authLoading } = useRequireAuth({
    redirectTo: "/login",
  });
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  if (authLoading) {
    return (
      <AdscoraPanelShell>
        <div className="flex min-h-[40vh] flex-1 items-center justify-center text-muted-foreground">
          Loading...
        </div>
      </AdscoraPanelShell>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // TODO: Implement profile update mutation
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      setIsEditing(false);
    } catch (error) {
      console.error("Profile update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AdscoraPanelShell>
      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="w-full max-w-3xl space-y-8 px-4 py-6 sm:px-6 lg:space-y-12 flex-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-base text-gray-400">Manage your profile and account preferences</p>
        </div>

        {/* Profile Settings */}
        <div className="p-6 border border-white/10 rounded-lg bg-white/5">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Profile Information</h2>
              <p className="text-sm text-gray-400">View and edit your account details</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white text-sm font-medium">Full Name</Label>
              <Input
                id="name"
                className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10 disabled:opacity-50"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10 disabled:opacity-50"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                placeholder="Your email address"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)} 
                className="bg-white/10 text-white hover:bg-white/20"
              >
                Edit
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleSave} 
                  className="bg-white text-black hover:bg-gray-100"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button 
                  onClick={() => setIsEditing(false)} 
                  className="bg-white/10 text-white hover:bg-white/20"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="p-6 border border-white/10 rounded-lg bg-white/5">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Account Information</h2>
              <p className="text-sm text-gray-400">Basic details about your account</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div>
                <p className="text-sm text-gray-400">Account Type</p>
                <p className="font-medium text-white">Individual Account</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div>
                <p className="text-sm text-gray-400">Joined</p>
                <p className="font-medium text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  }) : "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-gray-400">Last Sign-in</p>
                <p className="font-medium text-white">
                  {user?.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  }) : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="p-6 border border-white/10 rounded-lg bg-white/5">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Notification Settings</h2>
              <p className="text-sm text-gray-400">Manage your email notifications</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <Label className="font-medium text-white">New Chat Notifications</Label>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded cursor-pointer accent-white" />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <Label className="font-medium text-white">Analysis Results</Label>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded cursor-pointer accent-white" />
            </div>
            <div className="flex items-center justify-between py-3">
              <Label className="font-medium text-white">Ad Performance Alerts</Label>
              <input type="checkbox" className="w-4 h-4 rounded cursor-pointer accent-white" />
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="p-6 border border-white/10 rounded-lg bg-white/5">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">API Keys</h2>
              <p className="text-sm text-gray-400">Manage API keys for integrations</p>
            </div>
          </div>

          <div className="text-center py-8">
            <p className="text-sm text-gray-400 mb-4">
              API keys are not enabled yet.
            </p>
            <p className="text-sm text-gray-500">
              Contact support if you need API access for your workspace.
            </p>
          </div>
        </div>

        {/* Logout */}
        <div className="p-6 border border-red-900/30 rounded-lg bg-red-900/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-red-900/20 flex items-center justify-center">
                <LogOut className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Sign Out</h3>
                <p className="text-sm text-gray-400">Sign out from your account</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              className="bg-red-900/30 text-red-300 hover:bg-red-900/50 border border-red-900/50"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      </div>
    </AdscoraPanelShell>
  );
}
