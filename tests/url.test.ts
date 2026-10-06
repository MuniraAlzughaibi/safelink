import { describe, expect, it } from 'vitest';
import { analyzeUrl, editDistance, parseUrl } from '../src/analyzer/url';

const verdict = (u: string) => analyzeUrl(u)?.verdict;

describe('parseUrl', () => {
  it('resolves registrable domains with Saudi multi-part suffixes', () => {
    const p = parseUrl('https://online.alrajhibank.com.sa/login')!;
    expect(p.registrableDomain).toBe('alrajhibank.com.sa');
    expect(p.mainLabel).toBe('alrajhibank');
  });

  it('accepts links without a scheme', () => {
    expect(parseUrl('absher.sa')?.host).toBe('absher.sa');
  });

  it('rejects text that is not a link', () => {
    expect(parseUrl('hello world')).toBeNull();
    expect(parseUrl('')).toBeNull();
  });
});

describe('analyzeUrl', () => {
  it('marks official bank and government domains as safe', () => {
    expect(verdict('https://www.alrajhibank.com.sa')).toBe('safe');
    expect(verdict('https://www.absher.sa/portal')).toBe('safe');
    expect(verdict('https://www.my.gov.sa')).toBe('safe');
    expect(verdict('https://services.zatca.gov.sa')).toBe('safe');
  });

  it('flags typo-squatted bank domains as dangerous', () => {
    expect(verdict('https://alrajhlbank.com/login')).toBe('dangerous');
    expect(verdict('https://a1rajhibank.com.sa')).toBe('dangerous');
    expect(verdict('alrajhibank.com')).toBe('dangerous');
  });

  it('flags brand names on unofficial domains', () => {
    const r = analyzeUrl('https://absher-update.xyz/verify')!;
    expect(r.verdict).toBe('dangerous');
    expect(r.findings.some((f) => f.title.includes('أبشر'))).toBe(true);
  });

  it('flags the @ trick, IP hosts and punycode', () => {
    expect(verdict('https://www.alrajhibank.com.sa@evil.example.com')).toBe('dangerous');
    expect(verdict('http://185.12.4.9/bank/login')).not.toBe('safe');
    expect(verdict('https://xn--alnma-9ua.com')).not.toBe('safe');
  });

  it('treats URL shorteners as suspicious', () => {
    expect(verdict('https://bit.ly/3xYz')).toBe('suspicious');
  });

  it('does not flag ordinary sites', () => {
    expect(verdict('https://github.com/MuniraAlzughaibi')).toBe('safe');
    expect(verdict('https://www.wikipedia.org')).toBe('safe');
  });

  it('does not match short brand keywords inside unrelated words', () => {
    // "sama" (central bank) must not trigger on e.g. "osama".
    expect(verdict('https://osamablog.com')).toBe('safe');
  });
});

describe('editDistance', () => {
  it('counts single-character edits', () => {
    expect(editDistance('alrajhibank', 'alrajhlbank')).toBe(1);
    expect(editDistance('abc', 'abc')).toBe(0);
  });
});
