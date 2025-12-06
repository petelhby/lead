const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

type FetchOptions = Omit<RequestInit, "headers"> & { auth?: boolean };

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (!token) {
      // очищаем localStorage и cookie
      localStorage.removeItem("token");
      document.cookie = "token=; Max-Age=0; Path=/; SameSite=Lax";
    } else {
      localStorage.setItem("token", token);
      // cookie видна middleware (не HttpOnly, но достаточно для клиентской охраны)
      const maxAge = 60 * 60 * 24 * 7; // 7 дней
      document.cookie = `token=${token}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
    }
  } catch {
    // игнорируем ошибки квоты/приватного режима
  }
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

