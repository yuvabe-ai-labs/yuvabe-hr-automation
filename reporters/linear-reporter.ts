import type { Reporter, TestCase, TestResult, FullConfig, Suite } from "@playwright/test/reporter";
import { config } from "dotenv";
import path from "path";

// Load env vars directly in the reporter — dotenv from playwright.config.ts
// runs in the same process but loading here ensures they're always available.
config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

const LINEAR_API = "https://api.linear.app/graphql";

interface FailedTest {
  suite: string;
  testName: string;
  filePath: string;
  errorLine: string;
}

export default class LinearReporter implements Reporter {
  private disabled = false;
  private apiKey = "";
  private teamId = "";
  private projectId = "";
  private failures: FailedTest[] = [];

  onBegin(_config: FullConfig, _suite: Suite) {
    this.apiKey    = process.env.LINEAR_API_KEY    ?? "";
    this.teamId    = process.env.LINEAR_TEAM_ID    ?? "";
    this.projectId = process.env.LINEAR_PROJECT_ID ?? "";

    if (!this.apiKey || !this.teamId || !this.projectId) {
      console.warn(
        "[linear] Missing LINEAR_API_KEY / LINEAR_TEAM_ID / LINEAR_PROJECT_ID — issue creation disabled"
      );
      this.disabled = true;
      return;
    }

    console.log("[linear] Reporter ready — will file issues for any failures");
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (this.disabled) return;
    if (result.status !== "failed" && result.status !== "timedOut") return;
    // Skip intermediate retries — only file an issue on the final attempt
    if (result.retry < test.retries) return;

    const parts    = test.titlePath().filter(Boolean);
    const testName = parts.at(-1) ?? test.title;
    const suite    = parts.slice(1, -1).join(" › ") || (parts[0] ?? "");

    const errorLine =
      result.errors[0]?.message?.split("\n")[0]?.trim() ??
      `Timed out after ${result.duration}ms`;

    this.failures.push({ suite, testName, filePath: test.location.file, errorLine });
  }

  async onEnd() {
    if (this.disabled || this.failures.length === 0) return;

    console.log(`\n[linear] Filing ${this.failures.length} issue(s)...`);

    for (const f of this.failures) {
      const title = `[Test Failure] ${f.suite} › ${f.testName}`;
      const description = [
        `**Suite:** ${f.suite}`,
        `**Test:** ${f.testName}`,
        `**File:** \`${f.filePath}\``,
        "",
        "**Error:**",
        "```",
        f.errorLine,
        "```",
      ].join("\n");

      try {
        const id = await this.createIssue(title, description);
        console.log(`  ✓ ${id} — ${f.suite} › ${f.testName}`);
      } catch (err) {
        console.error(`  ✗ Could not create issue for "${f.testName}":`, (err as Error).message);
      }
    }
  }

  private async createIssue(title: string, description: string): Promise<string> {
    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { identifier url }
        }
      }
    `;

    const res = await fetch(LINEAR_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.apiKey,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            teamId: this.teamId,
            projectId: this.projectId,
            title,
            description,
          },
        },
      }),
    });

    const json = (await res.json()) as {
      data?: { issueCreate?: { success: boolean; issue?: { identifier: string } } };
      errors?: { message: string }[];
    };

    if (json.errors?.length) throw new Error(json.errors[0].message);
    if (!json.data?.issueCreate?.success) throw new Error("issueCreate returned success=false");

    return json.data.issueCreate.issue?.identifier ?? "?";
  }
}
