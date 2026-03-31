/** Minimal declarations when node_modules is not fully linked (CI / partial install). */
declare module "google-ads-api" {
  export class GoogleAdsApi {
    constructor(opts: {
      client_id?: string;
      client_secret?: string;
      developer_token?: string;
    });
    Customer(opts: {
      customer_id: string;
      refresh_token: string;
      login_customer_id?: string;
    }): { query: (gaql: string) => Promise<unknown> };
  }
}

declare module "node-cron" {
  const cron: {
    schedule: (expression: string, callback: () => void) => unknown;
  };
  export default cron;
}
