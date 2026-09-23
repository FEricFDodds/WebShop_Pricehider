import { FormEvent, useState } from "react";
import { createJob, type JobResult } from "./api";

export function App() {
  const [targetUrl, setTargetUrl] = useState(
    "https://shop.example.com/product/adaptive-widget"
  );
  const [objective, setObjective] = useState(
    "Estimate best transaction profile for price visibility and shipping for a US shopper"
  );
  const [userId, setUserId] = useState("tester-1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobResult | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createJob({ targetUrl, objective, userId: userId || undefined });
      setResult(res.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header>
        <h1>Adaptive Transaction Profile</h1>
        <p>
          Recommendation-only. Generates coherent multi-layer profiles, scores predicted
          value, applies a fail-closed policy gate, and ranks PASS results. No purchase
          execution.
        </p>
      </header>

      <section className="card">
        <form onSubmit={onSubmit}>
          <label htmlFor="url">Target URL</label>
          <input
            id="url"
            type="url"
            required
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
          />

          <label htmlFor="objective">Objective</label>
          <textarea
            id="objective"
            required
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
          />

          <div className="row">
            <div>
              <label htmlFor="user">User id (M0 stub via X-User-Id)</label>
              <input
                id="user"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="tester-1"
              />
            </div>
            <div style={{ display: "flex", alignItems: "end", paddingBottom: "0.85rem" }}>
              <button type="submit" disabled={loading} style={{ width: "100%" }}>
                {loading ? "Running…" : "Run pipeline"}
              </button>
            </div>
          </div>
          <p className="note">
            Parser is mocked in M0. Playwright replaces mockParse in M1. Auth is a header
            stub only.
          </p>
        </form>
      </section>

      {error && <div className="error">{error}</div>}

      {result && (
        <>
          <section className="card">
            <h2>Job</h2>
            <div className="meta">
              id={result.job.id} · status={result.job.status} · user=
              {result.job.userId ?? "anon"}
              {result.signals && (
                <>
                  {" "}
                  · page={result.signals.pageType} · currency=
                  {result.signals.commerce?.currency ?? "?"} · parse=
                  {result.signals.parseSource}
                </>
              )}
            </div>
          </section>

          <section className="card">
            <h2>Ranked recommendations ({result.recommendations.length})</h2>
            {result.recommendations.length === 0 ? (
              <p className="note">No PASS profiles. See gate failures below.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Profile</th>
                    <th>Value</th>
                    <th>Conf.</th>
                    <th>Device / locale</th>
                    <th>Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {result.recommendations.map((r) => (
                    <tr key={r.profile.id}>
                      <td>{r.rank}</td>
                      <td>
                        {r.profile.label}
                        <div className="rationale">{r.profile.archetypeId}</div>
                      </td>
                      <td>{r.score.value.toFixed(1)}</td>
                      <td>{(r.score.confidence * 100).toFixed(0)}%</td>
                      <td>
                        {r.profile.system.deviceClass}/{r.profile.system.platform}
                        <br />
                        {r.profile.locale.locale} · {r.profile.locale.currency}
                      </td>
                      <td className="rationale">{r.score.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card">
            <h2>Gate failures ({result.blocked.length})</h2>
            {result.blocked.length === 0 ? (
              <p className="note">None blocked.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Profile</th>
                    <th>Decision</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {result.blocked.map((r) => (
                    <tr key={r.profile.id}>
                      <td>{r.profile.label}</td>
                      <td>
                        <span className="badge block">{r.decision.outcome}</span>
                      </td>
                      <td>
                        {r.decision.reason}
                        {r.decision.ruleId && (
                          <div className="rationale">{r.decision.ruleId}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card">
            <h2>Audit timeline</h2>
            <ul className="timeline">
              {result.audit.map((e) => (
                <li key={e.id}>
                  <div className="ts">
                    {e.ts} · {e.type}
                  </div>
                  <div>{e.message}</div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
