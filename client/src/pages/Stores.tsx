import { useRequireAuth } from "@/_core/hooks/useRequireAuth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Store, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const storeSchema = z.object({
  name: z.string().min(1, "Workspace name is required"),
  niche: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  targetMarket: z.string().optional().nullable(),
  currency: z.string().default("USD"),
  monthlyBudget: z.number().optional().nullable(),
  platformFocus: z.array(z.string()).optional().nullable(),
});

type StoreFormData = z.infer<typeof storeSchema>;

export default function Stores() {
  const { isAuthenticated, loading: authLoading } = useRequireAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const { data: stores, isLoading } = trpc.stores.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const createStoreMutation = trpc.stores.create.useMutation();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      currency: "USD",
    },
  });

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

  const onSubmit = async (data: any) => {
    try {
      await createStoreMutation.mutateAsync(data);
      reset();
      setOpen(false);
    } catch (error) {
      console.error("Create workspace error:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 lg:space-y-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">My Workspaces</h1>
            <p className="text-base text-gray-400 max-w-2xl">
              Manage your e-commerce workspaces and improve ad strategy with AI assistance.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-gray-100 inline-flex items-center gap-2 whitespace-nowrap">
                <Plus className="w-4 h-4" />
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-black border border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Workspace</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white text-sm font-medium">Workspace Name *</Label>
                  <Input
                    id="name"
                    className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                    {...register("name")}
                    placeholder="Enter workspace name"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="niche" className="text-white text-sm font-medium">Niche</Label>
                  <Input
                    id="niche"
                    className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                    {...register("niche")}
                    placeholder="e.g. Fashion, Electronics"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-white text-sm font-medium">Website</Label>
                  <Input
                    id="website"
                    className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                    {...register("website")}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetMarket" className="text-white text-sm font-medium">Target Market</Label>
                  <Input
                    id="targetMarket"
                    className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                    {...register("targetMarket")}
                    placeholder="e.g. United States, Europe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-white text-sm font-medium">Currency</Label>
                  <Input
                    id="currency"
                    className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                    {...register("currency")}
                    defaultValue="USD"
                    placeholder="USD"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyBudget" className="text-white text-sm font-medium">Monthly Budget</Label>
                  <Input
                    id="monthlyBudget"
                    type="number"
                    className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                    {...register("monthlyBudget", { valueAsNumber: true })}
                    placeholder="Monthly ad budget"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="bg-white text-black hover:bg-gray-100 w-full"
                  disabled={createStoreMutation.isPending}
                >
                  {createStoreMutation.isPending ? "Creating..." : "Create Workspace"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stores Grid */}
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white border-opacity-20"></div>
            </div>
          ) : !stores || stores.length === 0 ? (
            <div className="p-8 border border-white/10 rounded-lg bg-white/5 text-center">
              <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center mb-6 mx-auto">
                <Store className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">No workspaces yet</h3>
              <p className="text-gray-400 text-center max-w-md mb-6 mx-auto">
                Add your first workspace to start improving your ad strategy with AI.
              </p>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-black hover:bg-gray-100 inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Workspace
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <div key={store.id} className="p-6 border border-white/10 rounded-lg hover:border-white/20 transition-all bg-white/5 hover:bg-white/10 group cursor-pointer">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
                        <Store className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base leading-tight text-white">{store.name}</h3>
                        {store.niche && (
                          <p className="text-xs text-gray-400 mt-1">{store.niche}</p>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 py-3 border-y border-white/10">
                      {store.website && (
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-1">Website</p>
                          <a 
                            href={store.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-white hover:text-gray-300 transition-colors truncate block"
                          >
                            {store.website}
                          </a>
                        </div>
                      )}
                      {store.targetMarket && (
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-1">Target Market</p>
                          <p className="text-sm text-white">{store.targetMarket}</p>
                        </div>
                      )}
                      {store.monthlyBudget && (
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-1">Monthly Budget</p>
                          <p className="text-sm font-semibold text-white">{store.monthlyBudget} {store.currency}</p>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <Button
                      onClick={() => setLocation(`/stores/${store.id}`)}
                      className="w-full bg-white/10 text-white hover:bg-white/20 text-sm flex items-center justify-between group/btn"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
