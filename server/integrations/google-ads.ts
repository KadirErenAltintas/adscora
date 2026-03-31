import { GoogleAdsApi } from "google-ads-api";
import { ENV } from "../_core/env";

function normalizeCid(id: string): string {
  return id.replace(/\D/g, "");
}

export class GoogleAdsService {
  private readonly client: GoogleAdsApi | null;

  constructor() {
    const { googleAdsClientId, googleAdsClientSecret, googleAdsDeveloperToken } = ENV;
    if (!googleAdsClientId || !googleAdsClientSecret || !googleAdsDeveloperToken) {
      this.client = null;
      return;
    }
    this.client = new GoogleAdsApi({
      client_id: googleAdsClientId,
      client_secret: googleAdsClientSecret,
      developer_token: googleAdsDeveloperToken,
    });
  }

  isConfigured(): boolean {
    return this.client != null;
  }

  private customer(customerId: string, refreshToken: string) {
    if (!this.client) {
      throw new Error(
        "Google Ads API yapılandırılmadı: GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_DEVELOPER_TOKEN gerekli."
      );
    }
    const cid = normalizeCid(customerId);
    const login = ENV.googleAdsLoginCustomerId ? normalizeCid(ENV.googleAdsLoginCustomerId) : undefined;
    return this.client.Customer({
      customer_id: cid,
      refresh_token: refreshToken,
      ...(login ? { login_customer_id: login } : {}),
    });
  }

  async getCampaignById(customerId: string, refreshToken: string, campaignId: string) {
    const id = campaignId.replace(/\D/g, "");
    if (!id) throw new Error("Geçersiz kampanya kimliği");
    const c = this.customer(customerId, refreshToken);
    const rows = await c.query(`
      SELECT campaign.id, campaign.name, campaign.status
      FROM campaign
      WHERE campaign.id = ${id}
      LIMIT 1
    `);
    const list = Array.isArray(rows) ? rows : [];
    return list[0] as
      | {
          campaign?: { id?: string | number; name?: string; status?: string | number };
        }
      | undefined;
  }

  async getCampaigns(customerId: string, refreshToken: string) {
    const c = this.customer(customerId, refreshToken);
    const rows = await c.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE campaign.status = 'ENABLED'
      LIMIT 100
    `);
    return rows;
  }

  async getMetrics(
    customerId: string,
    refreshToken: string,
    dateRange: { start: string; end: string }
  ) {
    const c = this.customer(customerId, refreshToken);
    const rows = await c.query(`
      SELECT
        campaign.name,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions_value_per_cost
      FROM campaign
      WHERE segments.date BETWEEN '${dateRange.start}' AND '${dateRange.end}'
    `);
    return rows;
  }

  async analyzePerformance(customerId: string, refreshToken: string) {
    const endDate = new Date().toISOString().split("T")[0]!;
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
    const metrics = await this.getMetrics(customerId, refreshToken, { start, end: endDate });

    type Row = Record<string, unknown>;
    const list = Array.isArray(metrics) ? (metrics as Row[]) : [];
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalCost = 0;
    let totalConversions = 0;
    let roasSum = 0;
    let roasN = 0;
    let ctrSum = 0;
    let ctrN = 0;

    for (const raw of list) {
      const row = raw as {
        metrics?: {
          impressions?: number | string;
          clicks?: number | string;
          cost_micros?: number | string;
          conversions?: number | string;
          conversions_value_per_cost?: number | string;
          ctr?: number | string;
        };
      };
      const met = row.metrics ?? {};
      const imp = Number(met.impressions ?? 0);
      const clk = Number(met.clicks ?? 0);
      const costMicros = Number(met.cost_micros ?? 0);
      const conv = Number(met.conversions ?? 0);
      totalImpressions += imp;
      totalClicks += clk;
      totalCost += costMicros / 1_000_000;
      totalConversions += conv;
      const roas = Number(met.conversions_value_per_cost ?? 0);
      if (!Number.isNaN(roas) && roas > 0) {
        roasSum += roas;
        roasN += 1;
      }
      const ctr = Number(met.ctr ?? 0);
      if (!Number.isNaN(ctr)) {
        ctrSum += ctr;
        ctrN += 1;
      }
    }

    return {
      totalImpressions,
      totalClicks,
      totalCost,
      totalConversions,
      averageROAS: roasN ? (roasSum / roasN).toFixed(2) : "0",
      averageCTR: ctrN ? ((ctrSum / ctrN) * 100).toFixed(2) : "0",
      rowCount: list.length,
    };
  }
}

export const googleAdsService = new GoogleAdsService();
