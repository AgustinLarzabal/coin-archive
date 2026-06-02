import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("../", import.meta.url));
const webDir = fileURLToPath(new URL("../apps/web", import.meta.url));
const defaultDatabaseUrl = "postgresql://coin_archive:coin_archive@localhost:5432/coin_archive";
const databaseUrl = process.env.DATABASE_URL
  ?? defaultDatabaseUrl;
const smokeRouteUrl = "http://127.0.0.1:3000/";
const routePollIntervalMs = 500;
const gracefulShutdownTimeoutMs = 5_000;
const expectedCoinTitles = [
  "Seed Coin 10",
  "Seed Coin 09",
  "Seed Coin 08",
  "Seed Coin 07",
  "Seed Coin 06",
  "Seed Coin 05",
  "Seed Coin 04",
  "Seed Coin 03",
  "Seed Coin 02",
  "Seed Coin 01",
];
const smokeSetupScripts = [
  "db:reset",
  "db:start",
  "db:migrate",
  "db:seed",
  "build",
];

function getSmokeEnv() {
  return {
    ...process.env,
    DATABASE_URL: databaseUrl,
  };
}

function formatCommand(command, args) {
  return `${command} ${args.join(" ")}`;
}

function decodeHtmlEntities(html) {
  return html
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function extractPreJson(html) {
  const match = html.match(/<pre>([\s\S]*?)<\/pre>/);

  assert.ok(match, "expected the root route to render a <pre> with Coin JSON");

  return JSON.parse(decodeHtmlEntities(match[1]));
}

async function runCommand(command, args, { cwd = rootDir, env = getSmokeEnv(), timeoutMs = 120_000 } = {}) {
  const commandLabel = formatCommand(command, args);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "inherit",
    });

    let settled = false;

    const timer = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill("SIGKILL");
      reject(new Error(`Command timed out: ${commandLabel}`));
    }, timeoutMs);

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
        resolve();
        return;
      }

      reject(new Error(`Command failed: ${commandLabel}`));
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

function delay(timeoutMs) {
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}

async function waitForRoute(url, { timeoutMs = 60_000 } = {}) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return response.text();
      }
    } catch {}

    await delay(routePollIntervalMs);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null) {
    return;
  }

  await new Promise((resolve) => {
    const killTimer = setTimeout(() => {
      child.kill("SIGKILL");
    }, gracefulShutdownTimeoutMs);

    child.once("exit", () => {
      clearTimeout(killTimer);
      resolve();
    });

    child.kill("SIGTERM");
  });
}

async function runSmokeSetup() {
  for (const scriptName of smokeSetupScripts) {
    await runCommand("npm", ["run", scriptName]);
  }
}

function startWebServer() {
  return spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1"], {
    cwd: webDir,
    env: getSmokeEnv(),
    stdio: "inherit",
  });
}

function assertExpectedCoins(coins) {
  assert.equal(coins.length, expectedCoinTitles.length);
  assert.deepEqual(
    coins.map(({ title }) => title),
    expectedCoinTitles,
  );
}

async function runSmoke() {
  if (!await hasDocker()) {
    throw new Error("docker with docker compose is required for npm run db:smoke");
  }

  let appProcess;

  try {
    await runSmokeSetup();

    appProcess = startWebServer();

    const html = await waitForRoute(smokeRouteUrl);
    assertExpectedCoins(extractPreJson(html));
  } finally {
    await stopProcess(appProcess);
    await runCommand("npm", ["run", "db:reset"]).catch(() => {});
  }
}

await runSmoke();
