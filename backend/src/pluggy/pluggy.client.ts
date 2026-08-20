import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

const API_KEY_TTL_MS = 110 * 60 * 1000;

type AuthResponse = { apiKey: string };

export type PluggyItemPayload = {
  id: string;
  status?: string;
  executionStatus?: string;
  error?: { code?: string; message?: string } | null;
  connector?: { id?: number; name?: string };
};

export type PluggyAccountPayload = {
  id: string;
  itemId?: string;
  type?: string;
  subtype?: string;
  name?: string;
  number?: string;
  balance?: number;
  creditData?: {
    creditLimit?: number;
    balanceDueDate?: string;
    availableCreditLimit?: number;
  } | null;
};

export type PluggyTransactionPayload = {
  id: string;
  accountId?: string;
  date?: string;
  description?: string;
  amount?: number;
  type?: string;
  status?: string;
  category?: string;
};

type PageResponse<T> = {
  results?: T[];
  next?: string | null;
};

function resolveNextPage(next: string | null | undefined): string | null {
  if (!next) return null;
  if (next.startsWith('http://') || next.startsWith('https://')) return next;
  if (next.startsWith('/')) return next;
  return `/v2/transactions${next.startsWith('?') ? next : `?${next}`}`;
}

@Injectable()
export class PluggyClient {
  private readonly logger = new Logger(PluggyClient.name);
  private readonly baseUrl = (process.env.PLUGGY_API_URL || 'https://api.pluggy.ai').replace(/\/$/, '');
  private apiKey: string | null = null;
  private apiKeyExpiresAt = 0;

  private clientId() {
    return process.env.PLUGGY_CLIENT_ID?.trim() ?? '';
  }

  private clientSecret() {
    return process.env.PLUGGY_CLIENT_SECRET?.trim() ?? '';
  }

  assertConfigured() {
    if (!this.clientId() || !this.clientSecret()) {
      throw new ServiceUnavailableException('Credenciais da Pluggy não configuradas.');
    }
  }

  private async getApiKey(): Promise<string> {
    this.assertConfigured();
    if (this.apiKey && Date.now() < this.apiKeyExpiresAt) return this.apiKey;

    const res = await fetch(`${this.baseUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: this.clientId(),
        clientSecret: this.clientSecret(),
      }),
    });
    if (!res.ok) {
      this.logger.error(`Falha ao autenticar na Pluggy (${res.status})`);
      throw new ServiceUnavailableException('Não foi possível autenticar na Pluggy.');
    }
    const data = (await res.json()) as AuthResponse;
    if (!data.apiKey) {
      throw new ServiceUnavailableException('Não foi possível autenticar na Pluggy.');
    }
    this.apiKey = data.apiKey;
    this.apiKeyExpiresAt = Date.now() + API_KEY_TTL_MS;
    return this.apiKey;
  }

  private async request<T>(pathOrUrl: string, init?: RequestInit): Promise<T> {
    const apiKey = await this.getApiKey();
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${this.baseUrl}${pathOrUrl}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        ...(init?.headers as Record<string, string> | undefined),
      },
    });
    if (!res.ok) {
      this.logger.error(`Pluggy ${init?.method ?? 'GET'} ${res.status}`);
      const err = new Error(`Pluggy HTTP ${res.status}`);
      (err as Error & { status?: number }).status = res.status;
      throw err;
    }
    return res.json() as Promise<T>;
  }

  fetchItem(itemId: string) {
    return this.request<PluggyItemPayload>(`/items/${itemId}`);
  }

  async listAccounts(itemId: string): Promise<PluggyAccountPayload[]> {
    const data = await this.request<PageResponse<PluggyAccountPayload> | PluggyAccountPayload[]>(
      `/accounts?itemId=${encodeURIComponent(itemId)}`,
    );
    if (Array.isArray(data)) return data;
    return data.results ?? [];
  }

  async listTransactions(accountId: string): Promise<PluggyTransactionPayload[]> {
    return this.paginateTransactions(`/v2/transactions?accountId=${encodeURIComponent(accountId)}`);
  }

  async listTransactionsByIds(ids: string[]): Promise<PluggyTransactionPayload[]> {
    if (ids.length === 0) return [];
    const collected: PluggyTransactionPayload[] = [];
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400);
      const qs = `ids=${encodeURIComponent(chunk.join(','))}`;
      collected.push(...(await this.paginateTransactions(`/v2/transactions?${qs}`)));
    }
    return collected;
  }

  async fetchTransactionPage(url: string): Promise<PluggyTransactionPayload[]> {
    const start = url.startsWith('http') || url.startsWith('/') ? url : `/v2/transactions?${url.replace(/^\?/, '')}`;
    return this.paginateTransactions(start);
  }

  private async paginateTransactions(firstPath: string): Promise<PluggyTransactionPayload[]> {
    const collected: PluggyTransactionPayload[] = [];
    let path: string | null = firstPath;
    let guard = 0;
    while (path && guard < 50) {
      const data = await this.request<PageResponse<PluggyTransactionPayload>>(path);
      collected.push(...(data.results ?? []));
      path = resolveNextPage(data.next);
      guard += 1;
    }
    return collected;
  }
}
