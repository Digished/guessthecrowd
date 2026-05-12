const KEY = "gtc.sid";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem(KEY);
  if (!sid) {
    const fresh: string =
      (crypto as any).randomUUID?.() ??
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, fresh);
    sid = fresh;
  }
  return sid;
}

export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gtc.username");
}

export function setUsername(name: string) {
  localStorage.setItem("gtc.username", name);
}
