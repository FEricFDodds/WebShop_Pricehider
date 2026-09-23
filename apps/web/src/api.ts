export type Score = { value: number; confidence: number; rationale: string };
export type Decision = { outcome: "PASS" | "BLOCK"; reason: string; ruleId?: string };
export type Profile = {
  id: string;
  archetypeId: string;
  label: string;
  system: { platform: string; deviceClass: string };
  locale: { locale: string; currency: string; timezone: string };
  browser: { engine: string; viewport: { width: number; height: number } };
  behavioral: { sessionDepth: string };
  identity: { accountState: string };
};
export type Recommendation = {
  profile: Profile;
  score: Score;
  decision: Decision;
  rank?: number;
};
export type AuditEvent = {
  id: string;
  ts: string;
  type: string;
  message: string;
};
export type JobResult = {
  job: {
    id: string;
    status: string;
    targetUrl: string;
    objective: { text: string };
    userId?: string;
    createdAt: string;
    completedAt?: string;
  };
  signals?: {
    pageType?: string;
    commerce?: { currency?: string; priceVisible?: boolean };
    parseSource?: string;
  };
  recommendations: Recommendation[];
  blocked: Recommendation[];
  audit: AuditEvent[];
  error?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export async function createJob(input: {
  targetUrl: string;
  objective: string;
  userId?: string;
}): Promise<{ id: string; status: string; results: JobResult }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (input.userId) headers["X-User-Id"] = input.userId;
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      targetUrl: input.targetUrl,
      objective: input.objective,
      userId: input.userId,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}

export async function getJob(id: string): Promise<JobResult> {
  const res = await fetch(`${API_BASE}/jobs/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}
