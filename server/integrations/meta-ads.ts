import axios from "axios";

const DEFAULT_VERSION = "v21.0";

export class MetaAdsService {
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly baseUrl: string;

  constructor(accessToken: string, apiVersion: string = DEFAULT_VERSION) {
    this.accessToken = accessToken;
    this.apiVersion = apiVersion;
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  private actId(adAccountId: string): string {
    return adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  }

  async getCampaignById(campaignId: string) {
    const response = await axios.get(`${this.baseUrl}/${campaignId}`, {
      params: {
        fields: "id,name,status",
        access_token: this.accessToken,
      },
      timeout: 30_000,
    });
    return response.data as { id?: string; name?: string; status?: string };
  }

  async updateCampaignStatus(campaignId: string, status: "PAUSED" | "ACTIVE") {
    const response = await axios.post(
      `${this.baseUrl}/${campaignId}`,
      null,
      {
        params: {
          status,
          access_token: this.accessToken,
        },
        timeout: 30_000,
      }
    );
    return response.data as { success?: boolean };
  }

  async getCampaigns(adAccountId: string) {
    const id = this.actId(adAccountId);
    const response = await axios.get(`${this.baseUrl}/${id}/campaigns`, {
      params: {
        fields: "id,name,status,objective,daily_budget,lifetime_budget,created_time",
        access_token: this.accessToken,
      },
      timeout: 30_000,
    });
    return (response.data?.data ?? []) as unknown[];
  }

  async getAdSets(adAccountId: string) {
    const id = this.actId(adAccountId);
    const response = await axios.get(`${this.baseUrl}/${id}/adsets`, {
      params: {
        fields: "id,name,campaign_id,status,daily_budget",
        access_token: this.accessToken,
      },
      timeout: 30_000,
    });
    return (response.data?.data ?? []) as unknown[];
  }

  async getMetrics(adAccountId: string, dateRange: { start: string; end: string }) {
    const id = this.actId(adAccountId);
    const response = await axios.get(`${this.baseUrl}/${id}/insights`, {
      params: {
        fields: "campaign_id,campaign_name,impressions,clicks,spend,actions,action_values",
        time_range: JSON.stringify({
          since: dateRange.start,
          until: dateRange.end,
        }),
        level: "campaign",
        access_token: this.accessToken,
      },
      timeout: 30_000,
    });
    return (response.data?.data ?? []) as Record<string, unknown>[];
  }

  async analyzePerformance(adAccountId: string) {
    const endDate = new Date().toISOString().split("T")[0]!;
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
    const metrics = await this.getMetrics(adAccountId, { start: startDate, end: endDate });

    let totalImpressions = 0;
    let totalClicks = 0;
    let totalSpend = 0;
    let totalConversions = 0;

    for (const m of metrics) {
      totalImpressions += Number(m.impressions ?? 0);
      totalClicks += Number(m.clicks ?? 0);
      totalSpend += parseFloat(String(m.spend ?? 0));
      const actions = m.actions;
      if (Array.isArray(actions)) {
        for (const a of actions) {
          if (a && typeof a === "object" && "value" in a) {
            totalConversions += Number((a as { value?: string }).value ?? 0);
          }
        }
      }
    }

    const avgCPC =
      totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : "0";
    const avgCTR =
      totalImpressions > 0
        ? ((totalClicks / totalImpressions) * 100).toFixed(2)
        : "0";

    return {
      totalImpressions,
      totalClicks,
      totalSpend,
      totalConversions,
      averageCPC: avgCPC,
      averageCTR: avgCTR,
    };
  }
}
