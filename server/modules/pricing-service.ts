/**
 * Pricing and monetization service
 * Manages subscription plans, usage limits, and feature access
 */

export type PlanType = "free" | "pro" | "advanced";

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  billingPeriod: "monthly" | "annual";
  features: string[];
  limits: {
    analysesPerMonth: number;
    chatsPerMonth: number;
    imagesPerMonth: number;
    storesAllowed: number;
    teamMembers: number;
    apiAccess: boolean;
    customIntegrations: boolean;
  };
}

export const PLANS: Record<PlanType, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    billingPeriod: "monthly",
    features: [
      "Up to 3 analyses per month",
      "Basic chat support",
      "1 store",
      "Email support",
      "Community access",
    ],
    limits: {
      analysesPerMonth: 3,
      chatsPerMonth: 10,
      imagesPerMonth: 0,
      storesAllowed: 1,
      teamMembers: 1,
      apiAccess: false,
      customIntegrations: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 29,
    billingPeriod: "monthly",
    features: [
      "Unlimited analyses",
      "Unlimited chat",
      "Image analysis (20/month)",
      "Up to 5 stores",
      "Priority support",
      "Export reports as PDF",
      "Advanced insights",
    ],
    limits: {
      analysesPerMonth: 999,
      chatsPerMonth: 999,
      imagesPerMonth: 20,
      storesAllowed: 5,
      teamMembers: 1,
      apiAccess: false,
      customIntegrations: false,
    },
  },
  advanced: {
    id: "advanced",
    name: "Advanced",
    price: 99,
    billingPeriod: "monthly",
    features: [
      "Everything in Pro",
      "Team collaboration (up to 5 members)",
      "Unlimited image analysis",
      "Unlimited stores",
      "API access",
      "Custom integrations",
      "Dedicated support",
      "Priority feature requests",
      "Monthly strategy calls",
    ],
    limits: {
      analysesPerMonth: 999,
      chatsPerMonth: 999,
      imagesPerMonth: 999,
      storesAllowed: 999,
      teamMembers: 5,
      apiAccess: true,
      customIntegrations: true,
    },
  },
};

/**
 * Check if user has access to a feature
 */
export function hasFeatureAccess(plan: PlanType, feature: keyof Plan["limits"]): boolean {
  const planDetails = PLANS[plan];
  const limit = planDetails.limits[feature];

  // If it's a number, check if it's > 0
  if (typeof limit === "number") {
    return limit > 0;
  }

  // If it's a boolean, return it directly
  return limit as boolean;
}

/**
 * Check if user has reached usage limit
 */
export function hasReachedLimit(
  plan: PlanType,
  feature: "analysesPerMonth" | "chatsPerMonth" | "imagesPerMonth",
  currentUsage: number
): boolean {
  const limit = PLANS[plan].limits[feature];
  return currentUsage >= limit;
}

/**
 * Get remaining usage for a feature
 */
export function getRemainingUsage(
  plan: PlanType,
  feature: "analysesPerMonth" | "chatsPerMonth" | "imagesPerMonth",
  currentUsage: number
): number {
  const limit = PLANS[plan].limits[feature];
  return Math.max(0, limit - currentUsage);
}

/**
 * Get upgrade recommendation
 */
export function getUpgradeRecommendation(
  currentPlan: PlanType,
  feature: keyof Plan["limits"]
): PlanType | null {
  if (currentPlan === "advanced") {
    return null; // Already on highest plan
  }

  if (currentPlan === "free") {
    return "pro"; // Free users should upgrade to Pro
  }

  if (currentPlan === "pro") {
    return "advanced"; // Pro users should upgrade to Advanced
  }

  return null;
}

/**
 * Calculate annual savings
 */
export function getAnnualSavings(plan: PlanType): number {
  const monthlyPrice = PLANS[plan].price;
  const annualPrice = monthlyPrice * 12;
  const discountedAnnualPrice = annualPrice * 0.8; // 20% discount for annual
  return annualPrice - discountedAnnualPrice;
}

/**
 * Get plan comparison
 */
export function getPlanComparison(): Array<{
  feature: string;
  free: string;
  pro: string;
  advanced: string;
}> {
  return [
    {
      feature: "Analyses per month",
      free: "3",
      pro: "Unlimited",
      advanced: "Unlimited",
    },
    {
      feature: "Chat messages",
      free: "10",
      pro: "Unlimited",
      advanced: "Unlimited",
    },
    {
      feature: "Image analysis",
      free: "None",
      pro: "20/month",
      advanced: "Unlimited",
    },
    {
      feature: "Stores",
      free: "1",
      pro: "5",
      advanced: "Unlimited",
    },
    {
      feature: "Team members",
      free: "1",
      pro: "1",
      advanced: "Up to 5",
    },
    {
      feature: "API access",
      free: "No",
      pro: "No",
      advanced: "Yes",
    },
    {
      feature: "Support",
      free: "Email",
      pro: "Priority",
      advanced: "Dedicated",
    },
  ];
}
