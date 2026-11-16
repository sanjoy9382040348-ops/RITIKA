import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';
export const AUTH_TOKEN_KEY = 'ritika_id_token';

async function authHeaders() {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const apiClient = {
  async get<T>(path: string, options?: { params?: Record<string, string | number | undefined> }): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (options?.params) {
      Object.entries(options.params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
      });
    }
    const res = await fetch(url.toString(), { headers: await authHeaders() });
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  },
};
