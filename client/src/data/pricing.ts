export type PricingPlan = {
  id: string;
  name: string;
  line: string;
  price: string;
  period: string;
  items: string[];
  featured: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    line: "Try it out",
    price: "$0",
    period: "/month",
    items: ["A few analyses per month", "Ask questions in chat", "Single workspace"],
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    line: "Growing business",
    price: "$29",
    period: "/month",
    items: ["More analyses", "Creative suggestions", "Multiple workspaces"],
    featured: true,
  },
  {
    id: "team",
    name: "Team",
    line: "Larger teams",
    price: "$99",
    period: "/month",
    items: ["Everything in Pro + API", "Priority support", "Unlimited workspaces"],
    featured: false,
  },
];
