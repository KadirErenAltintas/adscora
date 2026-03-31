/**
 * Plain language, beginner-friendly product copy
 * Used throughout the app to explain features and concepts
 */

export const productCopy = {
  // Feature descriptions
  features: {
    analysis: {
      title: "Smart Ad Analysis",
      description: "Upload your ad metrics and get AI-powered insights about what's working and what isn't.",
      benefit: "Stop guessing. Get clear, actionable recommendations backed by data.",
    },
    chat: {
      title: "Your AI Marketing Strategist",
      description: "Chat with an expert who understands your business and gives personalized advice.",
      benefit: "Get answers to your marketing questions anytime, without hiring an agency.",
    },
    stores: {
      title: "Manage Your Campaigns",
      description: "Keep all your stores and campaigns organized in one place.",
      benefit: "Never lose track of what you're testing and what's working.",
    },
  },

  // Onboarding copy
  onboarding: {
    welcome: "Welcome to Adscora",
    subtitle: "Chart your ads toward the stars — clear data, clear next steps",
    step1: {
      title: "Tell us about your store",
      description: "Help us understand your business so we can give better advice.",
    },
    step2: {
      title: "Upload your first ad metrics",
      description: "Share your ad performance data (impressions, clicks, spend, etc.)",
    },
    step3: {
      title: "Get your analysis",
      description: "We'll analyze your ads and give you specific recommendations.",
    },
  },

  // Pricing copy
  pricing: {
    free: {
      title: "Free",
      description: "Perfect for getting started",
      features: ["Up to 3 analyses per month", "Basic chat support", "Email support"],
    },
    pro: {
      title: "Pro",
      description: "For serious marketers",
      features: ["Unlimited analyses", "Priority chat support", "Image analysis", "Export reports"],
    },
    advanced: {
      title: "Advanced",
      description: "For agencies and teams",
      features: ["Everything in Pro", "Team collaboration", "API access", "Custom integrations"],
    },
  },

  // Metrics explanations
  metrics: {
    ctr: {
      name: "Click-Through Rate (CTR)",
      explanation: "The percentage of people who saw your ad and clicked it.",
      benchmark: "Typical CTR: 1-5% depending on platform",
      improvement: "Higher CTR usually means your ad is relevant to your audience.",
    },
    cpc: {
      name: "Cost Per Click (CPC)",
      explanation: "How much you pay for each person who clicks your ad.",
      benchmark: "Typical CPC: $0.50-$3 depending on industry",
      improvement: "Lower CPC means you're getting clicks more efficiently.",
    },
    cpa: {
      name: "Cost Per Acquisition (CPA)",
      explanation: "How much you pay for each customer who completes a purchase.",
      benchmark: "Typical CPA: depends on your product price",
      improvement: "Lower CPA means you're converting more efficiently.",
    },
    roas: {
      name: "Return on Ad Spend (ROAS)",
      explanation: "For every $1 you spend on ads, how much revenue you make.",
      benchmark: "Typical ROAS: 2-4x for profitable campaigns",
      improvement: "Higher ROAS means your ads are more profitable.",
    },
  },

  // Common questions
  faq: {
    q1: "How often should I analyze my ads?",
    a1: "We recommend analyzing your ads weekly or when you make significant changes. This helps you catch problems early.",

    q2: "What data do I need to provide?",
    a2: "At minimum: impressions, clicks, and spend. Optional but helpful: conversions, revenue, and campaign notes.",

    q3: "Can I connect my Meta/Google Ads account?",
    a3: "Coming soon! For now, you can manually upload your metrics.",

    q4: "How accurate are the recommendations?",
    a4: "Our AI analyzes your data against industry benchmarks. Accuracy improves when you provide more data.",

    q5: "Can I export my analyses?",
    a5: "Yes, with the Pro plan. You can download reports as PDF.",
  },

  // Error messages (plain language)
  errors: {
    invalidMetrics: "Hmm, those numbers don't look right. Make sure impressions and clicks are whole numbers.",
    missingData: "We need at least impressions, clicks, and spend to analyze your ad.",
    analysisError: "Something went wrong. Please try again or contact support.",
    uploadError: "We couldn't upload your image. Try a different format (JPG, PNG).",
  },

  // Success messages
  success: {
    analysisComplete: "Analysis complete! Check out your recommendations below.",
    storeCreated: "Your store is ready. Let's analyze your first campaign.",
    profileUpdated: "Your profile has been updated.",
  },
};

/**
 * Get beginner-friendly explanation for a metric
 */
export function getMetricExplanation(metric: "ctr" | "cpc" | "cpa" | "roas"): string {
  return productCopy.metrics[metric].explanation;
}

/**
 * Get improvement tip for a metric
 */
export function getMetricTip(metric: "ctr" | "cpc" | "cpa" | "roas"): string {
  return productCopy.metrics[metric].improvement;
}
