/**
 * Reads test-results/results.json (written by Playwright's JSON reporter)
 * and writes a human-readable test-report.md to the project root.
 *
 * Run via: pnpm test:report
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RESULTS_FILE = join(process.cwd(), "test-results", "results.json");
const OUTPUT_FILE = join(process.cwd(), "test-report.md");

interface TestResult {
  status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
  duration: number;
}

interface PlaywrightTest {
  status: "expected" | "unexpected" | "skipped" | "flaky";
  results: TestResult[];
}

interface PlaywrightSpec {
  title: string;
  tests: PlaywrightTest[];
}

interface PlaywrightSuite {
  title: string;
  file?: string;
  specs: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
}

interface PlaywrightReport {
  stats: {
    startTime: string;
    duration: number;
    expected: number;
    unexpected: number;
    skipped: number;
    flaky: number;
  };
  suites: PlaywrightSuite[];
}

interface Row {
  suite: string;
  title: string;
  status: "expected" | "unexpected" | "skipped" | "flaky";
  durationMs: number;
}

function collectRows(suite: PlaywrightSuite, suiteName: string, rows: Row[]) {
  for (const spec of suite.specs ?? []) {
    const test = spec.tests[0];
    if (!test) continue;
    rows.push({
      suite: suiteName,
      title: spec.title,
      status: test.status,
      durationMs: test.results[0]?.duration ?? 0,
    });
  }
  for (const child of suite.suites ?? []) {
    const childName = suiteName ? `${suiteName} › ${child.title}` : child.title;
    collectRows(child, childName, rows);
  }
}

function statusIcon(status: Row["status"]): string {
  switch (status) {
    case "expected":   return "✅";
    case "unexpected": return "❌";
    case "flaky":      return "⚠️";
    case "skipped":    return "⏭️";
  }
}

function statusLabel(status: Row["status"]): string {
  switch (status) {
    case "expected":   return "passed";
    case "unexpected": return "failed";
    case "flaky":      return "flaky";
    case "skipped":    return "skipped";
  }
}

function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const raw = readFileSync(RESULTS_FILE, "utf-8");
const report: PlaywrightReport = JSON.parse(raw);
const { stats } = report;

const rows: Row[] = [];
for (const fileSuite of report.suites) {
  if ((fileSuite.suites ?? []).length > 0) {
    // Has describe blocks — start from each describe suite
    for (const describeSuite of fileSuite.suites!) {
      collectRows(describeSuite, describeSuite.title, rows);
    }
  } else {
    // Top-level specs with no describe block
    collectRows(fileSuite, fileSuite.title, rows);
  }
}

const totalDuration = fmtDuration(stats.duration);
const timestamp = fmtTimestamp(stats.startTime);

const summaryParts: string[] = [];
if (stats.unexpected > 0) summaryParts.push(`❌ ${stats.unexpected} failed`);
if (stats.expected > 0)   summaryParts.push(`✅ ${stats.expected} passed`);
if (stats.flaky > 0)      summaryParts.push(`⚠️ ${stats.flaky} flaky`);
if (stats.skipped > 0)    summaryParts.push(`⏭️ ${stats.skipped} skipped`);
summaryParts.push(`⏱ ${totalDuration}`);

const summaryLine = summaryParts.join(" · ");

const tableHeader = [
  "| # | Suite | Test | Status | Duration |",
  "|---|-------|------|--------|----------|",
];

const tableRows = rows.map((r, i) =>
  `| ${i + 1} | ${r.suite} | ${r.title} | ${statusIcon(r.status)} ${statusLabel(r.status)} | ${fmtDuration(r.durationMs)} |`
);

const md = [
  `# Test Report — ${timestamp}`,
  "",
  summaryLine,
  "",
  ...tableHeader,
  ...tableRows,
  "",
].join("\n");

writeFileSync(OUTPUT_FILE, md, "utf-8");
console.log(`[report] Written to test-report.md — ${rows.length} tests, ${summaryLine}`);
