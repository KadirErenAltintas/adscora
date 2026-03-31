import axios from "axios";

export class TikTokAdsService {
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly baseUrl: string;

  constructor(accessToken: string, apiVersion = "v1.3") {
    this.accessToken = accessToken;
    this.apiVersion = apiVersion;
    this.baseUrl = `https://business-api.tiktok.com/open_api/${this.apiVersion}`;
  }

  async getCampaigns(advertiserId: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/campaign/get/`, {
        params: {
          advertiser_id: advertiserId,
        },
        headers: {
          "Access-Token": this.accessToken,
        },
        timeout: 30_000,
      });
      const data = response.data?.data;
      if (data?.list && Array.isArray(data.list)) return data.list as unknown[];
      return [];
    } catch {
      return [];
    }
  }

  async getMetrics(advertiserId: string, dateRange: { start: string; end: string }) {
    try {
      const response = await axios.get(`${this.baseUrl}/report/integrated/get/`, {
        params: {
          advertiser_id: advertiserId,
          start_date: dateRange.start,
          end_date: dateRange.end,
          data_level: "AUCTION_CAMPAIGN",
        },
        headers: {
          "Access-Token": this.accessToken,
        },
        timeout: 30_000,
      });
      const data = response.data?.data;
      if (data?.list && Array.isArray(data.list)) return data.list as Record<string, unknown>[];
      return [];
    } catch {
      return [];
    }
  }

  async analyzePerformance(advertiserId: string) {
    const endDate = new Date().toISOString().split("T")[0]!;
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
    const metrics = await this.getMetrics(advertiserId, { start: startDate, end: endDate });

    let totalImpressions = 0;
    let totalClicks = 0;
    let totalSpend = 0;
    let totalConversions = 0;
    let convRateSum = 0;

    for (const m of metrics) {
      totalImpressions += Number(m.impressions ?? 0);
      totalClicks += Number(m.clicks ?? 0);
      totalSpend += parseFloat(String(m.spend ?? m.stat_cost ?? 0));
      totalConversions += Number(m.conversion ?? m.conversions ?? 0);
      convRateSum += Number(m.conversion_rate ?? 0);
    }

    const n = metrics.length || 1;
    const avgCPC = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : "0";
    return {
      totalImpressions,
      totalClicks,
      totalSpend,
      totalConversions,
      averageCPC: avgCPC,
      conversionRate: ((convRateSum / n) * 100).toFixed(2),
    };
  }
}
