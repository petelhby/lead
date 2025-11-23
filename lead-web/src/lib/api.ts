const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

type FetchOptions = Omit<RequestInit, "headers"> & { auth?: boolean };

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) localStorage.removeItem("token");
  else localStorage.setItem("token", token);
}


export async function api(path: string, opts: FetchOptions = {}) {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (opts.auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${API_BASE}${path}`,
    { ...opts, headers }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const ct = res.headers.get("content-type");
  return ct && ct.includes("application/json") ? res.json() : res.text();
}

export async function upload(path: string, form: FormData, auth = true) {
  const headers: HeadersInit = {};
  if (auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { method: "POST", body: form, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
