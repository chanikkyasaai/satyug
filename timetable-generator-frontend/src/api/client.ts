// Lightweight API client for the FastAPI backend

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

const BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });

  if (!res.ok) {
    let detail: any = undefined;
    try {
      detail = await res.json();
    } catch (_) {
      // ignore
    }
    const message = detail?.detail || detail?.message || res.statusText;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  if (res.status === 204) {
    // no content
    return undefined as unknown as T;
  }

  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>("GET", path, undefined, init),
  post: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>("POST", path, body, init),
  put: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>("PUT", path, body, init),
  delete: <T>(path: string, init?: RequestInit) => request<T>("DELETE", path, undefined, init),
};

export { BASE_URL };


