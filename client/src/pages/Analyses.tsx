import { useRequireAuth } from "@/_core/hooks/useRequireAuth";
import { useLocation } from "wouter";
import AdscoraPanelShell from "@/components/AdscoraPanelShell";
import { trpc } from "@/lib/trpc";
import type { Analysis } from "@shared/database.types";
import {
  Plus,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Upload,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const analysisSchema = z.object({
  campaignName: z.string().optional(),
  platform: z.enum(["meta", "google", "tiktok", "other"]),
  campaignObjective: z.string(),
  impressions: z.number().min(0),
  clicks: z.number().min(0),
  spend: z.number().min(0),
  conversions: z.number().optional(),
  revenue: z.number().optional(),
  notes: z.string().optional(),
});

type AnalysisFormData = z.infer<typeof analysisSchema>;

interface AnalysisResult {
  executiveSummary: string;
  mainProblems: Array<{
    issue: string;
    severity: "high" | "medium" | "low";
    confidence: "high" | "medium" | "low";
  }>;
  reasoning: string;
  recommendedActions: Array<{
    action: string;
    priority: "high" | "medium" | "low";
    impact: string;
  }>;
  metricsBreakdown: Record<string, string>;
  missingDataWarnings: string[];
  creativeAnalysis?: {
    quality: string;
    issues: string[];
    suggestions: string[];
  };
}

const getSeverityColor = (severity: "high" | "medium" | "low") => {
  switch (severity) {
    case "high":
      return "bg-red-900/20 border-red-800/50 text-red-300";
    case "medium":
      return "bg-yellow-900/20 border-yellow-800/50 text-yellow-300";
    case "low":
      return "bg-blue-900/20 border-blue-800/50 text-blue-300";
  }
};

const getSeverityIcon = (severity: "high" | "medium" | "low") => {
  switch (severity) {
    case "high":
      return <AlertCircle className="w-4 h-4" />;
    case "medium":
      return <AlertTriangle className="w-4 h-4" />;
    case "low":
      return <CheckCircle2 className="w-4 h-4" />;
  }
};

const getPriorityColor = (priority: "high" | "medium" | "low") => {
  switch (priority) {
    case "high":
      return "bg-red-900/20 border-red-800/50 text-red-300";
    case "medium":
      return "bg-yellow-900/20 border-yellow-800/50 text-yellow-300";
    case "low":
      return "bg-blue-900/20 border-blue-800/50 text-blue-300";
  }
};

const getConfidenceColor = (confidence: "high" | "medium" | "low") => {
  switch (confidence) {
    case "high":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "low":
      return "text-orange-400";
  }
};

function parseAnalysisForDisplay(a: Analysis): AnalysisResult {
  const mp = a.mainProblems;
  const ra = a.recommendedActions;
  const mb = a.metricsBreakdown;
  const mw = a.missingDataWarnings;
  const ca = a.creativeAnalysis;
  return {
    executiveSummary: a.executiveSummary ?? a.resultSummary ?? "No summary available yet.",
    mainProblems: Array.isArray(mp)
      ? (mp as AnalysisResult["mainProblems"])
      : [],
    reasoning: a.reasoning ?? "",
    recommendedActions: Array.isArray(ra)
      ? (ra as AnalysisResult["recommendedActions"])
      : [],
    metricsBreakdown:
      mb && typeof mb === "object" && !Array.isArray(mb)
        ? (mb as Record<string, string>)
        : {},
    missingDataWarnings: Array.isArray(mw) ? (mw as string[]) : [],
    creativeAnalysis:
      ca && typeof ca === "object"
        ? (ca as AnalysisResult["creativeAnalysis"])
        : undefined,
  };
}

export default function Analyses() {
  const { isAuthenticated, loading: authLoading } = useRequireAuth({
    redirectTo: "/login",
  });
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: analyses, isLoading } = trpc.analyses.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      platform: "meta",
      impressions: 0,
      clicks: 0,
      spend: 0,
    },
  });

  const onSubmit = async (data: AnalysisFormData) => {
    setIsAnalyzing(true);
    try {
      // TODO: Call analysis API
      // const result = await analyzeAd(data);
      // setSelectedAnalysis(result);
      console.log("Analysis data:", data);
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (authLoading) {
    return (
      <AdscoraPanelShell>
        <div className="flex min-h-[40vh] flex-1 items-center justify-center text-muted-foreground px-4">
          Loading...
        </div>
      </AdscoraPanelShell>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdscoraPanelShell>
      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="w-full max-w-5xl space-y-6 px-3 py-4 sm:space-y-8 sm:px-4 sm:py-6 lg:space-y-10 flex-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Ad Analyses
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              AI reports and cover visuals. In chat, send a message starting with{" "}
              <code className="text-xs bg-muted px-1 rounded">REPORT:</code> to create a new analysis.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="inline-flex items-center gap-2 whitespace-nowrap w-full sm:w-auto min-h-11 touch-manipulation">
                <Plus className="w-4 h-4 shrink-0" />
                New Analysis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Analyze Your Ad Campaign</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Campaign Name */}
                <div className="space-y-2">
                  <Label className="text-white text-sm font-medium">Campaign Name (Optional)</Label>
                  <Input 
                    {...register("campaignName")} 
                    placeholder="e.g. Summer Promo 2024" 
                    className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                  />
                </div>

                {/* Platform */}
                <div className="space-y-2">
                  <Label className="text-white text-sm font-medium">Platform *</Label>
                  <Select defaultValue="meta" onValueChange={(value) => setValue("platform", value as any)}>
                    <SelectTrigger className="bg-white/5 border border-white/10 text-white">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-white/10">
                      <SelectItem value="meta" className="text-white">Meta (Facebook/Instagram)</SelectItem>
                      <SelectItem value="google" className="text-white">Google Ads</SelectItem>
                      <SelectItem value="tiktok" className="text-white">TikTok</SelectItem>
                      <SelectItem value="other" className="text-white">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campaign Objective */}
                <div className="space-y-2">
                  <Label className="text-white text-sm font-medium">Campaign Objective *</Label>
                  <Input 
                    {...register("campaignObjective")} 
                    placeholder="e.g. Conversions, Traffic, Awareness" 
                    className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                  />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Impressions *</Label>
                    <Input
                      {...register("impressions", { valueAsNumber: true })}
                      type="number"
                      placeholder="0"
                      className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Clicks *</Label>
                    <Input
                      {...register("clicks", { valueAsNumber: true })}
                      type="number"
                      placeholder="0"
                      className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Spend ($) *</Label>
                    <Input
                      {...register("spend", { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Conversions (Optional)</Label>
                    <Input
                      {...register("conversions", { valueAsNumber: true })}
                      type="number"
                      placeholder="0"
                      className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Revenue ($) (Optional)</Label>
                    <Input
                      {...register("revenue", { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-white text-sm font-medium">Additional Notes (Optional)</Label>
                  <Textarea 
                    {...register("notes")} 
                    placeholder="Any useful campaign context..." 
                    className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isAnalyzing}
                  className="bg-white text-black hover:bg-gray-100 w-full disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analyze Campaign
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Analysis Result */}
        {selectedAnalysis && (
          <div className="space-y-6 p-4 sm:p-8 border border-border rounded-lg bg-card">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => { setSelectedAnalysis(null); setSelectedImageUrl(null); }}>
              ← Back to list
            </Button>
            {selectedImageUrl && (
              <div className="rounded-lg overflow-hidden border border-border max-h-[min(50vh,360px)] bg-muted">
                <img
                  src={selectedImageUrl}
                  alt="Report cover image"
                  className="w-full h-full object-cover object-center max-h-[min(50vh,360px)]"
                  loading="lazy"
                />
              </div>
            )}
            {/* Executive Summary */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Executive Summary</h2>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{selectedAnalysis.executiveSummary}</p>
            </div>

            {/* Main Problems */}
            {selectedAnalysis.mainProblems.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">Key Issues Detected</h3>
                <div className="space-y-3">
                  {selectedAnalysis.mainProblems.map((problem, idx) => (
                    <div key={idx} className={`border rounded-lg p-4 ${getSeverityColor(problem.severity)}`}>
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(problem.severity)}
                        <div className="flex-1">
                          <p className="font-semibold">{problem.issue}</p>
                          <p className={`text-sm mt-1 ${getConfidenceColor(problem.confidence)}`}>
                            Confidence: {problem.confidence}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reasoning */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">Why This Happens</h3>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{selectedAnalysis.reasoning}</p>
            </div>

            {/* Recommended Actions */}
            {selectedAnalysis.recommendedActions.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">Recommended Actions</h3>
                <div className="space-y-3">
                  {selectedAnalysis.recommendedActions.map((action, idx) => (
                    <div key={idx} className={`border rounded-lg p-4 ${getPriorityColor(action.priority)}`}>
                      <div className="flex items-start gap-3">
                        <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold">{action.action}</p>
                          <p className="text-sm mt-1 opacity-90">Expected Impact: {action.impact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Breakdown */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">Metric Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {Object.entries(selectedAnalysis.metricsBreakdown).map(([metric, explanation]) => (
                  <div key={metric} className="bg-muted/50 border border-border rounded-lg p-3 sm:p-4">
                    <p className="font-semibold text-foreground">{metric}</p>
                    <p className="text-sm text-muted-foreground mt-2">{explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            {selectedAnalysis.missingDataWarnings.length > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-300 mb-2">⚠️ Missing Data</h4>
                <ul className="space-y-1 text-sm text-yellow-200">
                  {selectedAnalysis.missingDataWarnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Analyses List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white border-opacity-20"></div>
          </div>
        ) : analyses && analyses.length > 0 ? (
          <div className="grid gap-3 sm:gap-4">
            {analyses.map((analysis) => (
              <button
                type="button"
                key={analysis.id}
                onClick={() => {
                  setSelectedAnalysis(parseAnalysisForDisplay(analysis as Analysis));
                  setSelectedImageUrl(analysis.creativeImageUrl ?? null);
                }}
                className="text-left p-4 sm:p-6 border border-border rounded-lg hover:bg-muted/40 transition-colors bg-card group touch-manipulation min-h-[4.5rem]"
              >
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-start">
                  {analysis.creativeImageUrl ? (
                    <div className="w-full sm:w-28 h-36 sm:h-20 shrink-0 rounded-md overflow-hidden bg-muted border border-border">
                      <img
                        src={analysis.creativeImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                        {analysis.campaignName || "AI report"}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {analysis.platform ?? "-"} • {new Date(analysis.createdAt).toLocaleDateString("en-US")}
                      </p>
                      {analysis.resultSummary ? (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">
                          {analysis.resultSummary}
                        </p>
                      ) : null}
                    </div>
                    <BarChart3 className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 sm:py-12 px-4 bg-muted/30 border border-border rounded-lg space-y-3">
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center mx-auto">
              <BarChart3 className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-foreground text-base sm:text-lg font-medium">No analyses yet</p>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Send a chat message starting with <span className="font-mono text-xs">REPORT:</span>; your generated
              report will appear here.
            </p>
          </div>
        )}
      </div>
      </div>
    </AdscoraPanelShell>
  );
}
