import { useRequireAuth } from "@/_core/hooks/useRequireAuth";
import { useLocation, useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function StoreDetail() {
  const { isAuthenticated, loading: authLoading } = useRequireAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/stores/:storeId");
  const [isEditing, setIsEditing] = useState(false);

  const storeId = params?.storeId ? parseInt(params.storeId) : null;

  const { data: store, isLoading } = trpc.stores.get.useQuery(
    { id: storeId || 0 },
    { enabled: isAuthenticated && !!storeId }
  );

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center text-gray-400">
          Loading...
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!match || !storeId) {
    return <DashboardLayout>Workspace not found</DashboardLayout>;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!store) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/stores")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <p className="text-muted-foreground">Workspace not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => setLocation("/stores")}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1>{store.name}</h1>
          <p className="text-muted-foreground">{store.niche}</p>
        </div>

        {/* Store Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Workspace Details</CardTitle>
                <CardDescription>Core information about your workspace</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Workspace Name</Label>
              <Input
                value={store.name}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Niche</Label>
              <Input
                value={store.niche || ""}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Website</Label>
              <Input
                value={store.website || ""}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Target Market</Label>
              <Input
                value={store.targetMarket || ""}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Currency</Label>
                <Input
                  value={store.currency || "USD"}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Monthly Budget</Label>
                <Input
                  type="number"
                  value={store.monthlyBudget || ""}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>

            {isEditing && (
              <Button className="w-full mt-4">Save Changes</Button>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/chats")}
            >
              Start New Chat
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/analyses")}
            >
              Create New Analysis
            </Button>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Chats</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Analyses</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm text-muted-foreground">
                {new Date(store.createdAt).toLocaleDateString("en-US")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
