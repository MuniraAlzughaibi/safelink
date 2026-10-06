export type Verdict = 'safe' | 'suspicious' | 'dangerous';

export type Severity = 'good' | 'info' | 'warn' | 'danger';

export interface Finding {
  severity: Severity;
  title: string;
  detail: string;
  /** How much this finding adds to the risk score (0 for informational ones). */
  weight: number;
}

export interface Report {
  verdict: Verdict;
  /** 0 (no risk signals) to 100 (many strong signals). */
  score: number;
  findings: Finding[];
}

/** Score thresholds shared by the link and message analyzers. */
export const THRESHOLDS = { suspicious: 25, dangerous: 60 } as const;

export function verdictFor(score: number): Verdict {
  if (score >= THRESHOLDS.dangerous) return 'dangerous';
  if (score >= THRESHOLDS.suspicious) return 'suspicious';
  return 'safe';
}

export function buildReport(findings: Finding[], forceSafe = false): Report {
  const score = Math.min(100, findings.reduce((sum, f) => sum + f.weight, 0));
  const sorted = [...findings].sort((a, b) => b.weight - a.weight);
  return { verdict: forceSafe ? 'safe' : verdictFor(score), score, findings: sorted };
}
