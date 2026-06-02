import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("../", import.meta.url));
const verificationNotesPath = "docs/verification/issue-7-full-database-smoke.md";
const requiredVerificationCommands = [
  /npm run db:reset/,
  /npm run db:start/,
  /npm run db:migrate/,
  /npm run db:seed/,
  /npm run build/,
  /npm run dev -- --host 127\.0\.0\.1/,
  /npm run db:smoke/,
];

async function readTextFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

async function runCommand(command, args, { cwd = rootDir, timeoutMs = 240_000 } = {}) {
  const commandLabel = `${command} ${args.join(" ")}`;

  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill("SIGKILL");
      reject(new Error(`Command timed out: ${commandLabel}\n${stdout}\n${stderr}`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on("exit", (code) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);

      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`Command failed: ${commandLabel}\n${stdout}\n${stderr}`));
    });
  });
}

async function hasDocker() {
  try {
    await runCommand("docker", ["--version"], { timeoutMs: 10_000 });
    return true;
  } catch {
    return false;
  }
}

test("workspace exposes a full local database smoke script and verification notes", async (t) => {
  const [packageJsonText, verificationNotesText] = await Promise.all([
    readTextFile("package.json"),
    readTextFile(verificationNotesPath),
  ]);

  const packageJson = JSON.parse(packageJsonText);

  assert.equal(packageJson.scripts["db:smoke"], "node ./scripts/db-smoke.mjs");
  for (const commandPattern of requiredVerificationCommands) {
    assert.match(verificationNotesText, commandPattern);
  }

  if (!await hasDocker()) {
    t.skip("docker is required to execute the full database smoke script");
    return;
  }

  await runCommand("npm", ["run", "db:smoke"]);
});
