import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("../", import.meta.url));
const webDir = fileURLToPath(new URL("../apps/web", import.meta.url));
const databaseUrl = process.env.DATABASE_URL
  ?? "postgresql://coin_archive:coin_archive@localhost:5432/coin_archive";
const smokeRouteUrl = "http://127.0.0.1:3000/";

function getSmokeEnv() {
  return {
    ...process.env,
    DATABASE_URL: databaseUrl,
  };
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
      reject(new Error(`Command timed out: ${command} ${args.join(" ")}`));
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

      reject(new Error(`Command failed: ${command} ${args.join(" ")}`));
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

async function waitForRoute(url, { timeoutMs = 60_000 } = {}) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return response.text();
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 500));
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
    }, 5_000);

    child.once("exit", () => {
      clearTimeout(killTimer);
      resolve();
    });

    child.kill("SIGTERM");
  });
}

async function runSmoke() {
  if (!await hasDocker()) {
    throw new Error("docker with docker compose is required for npm run db:smoke");
  }

  let appProcess;

  try {
    await runCommand("npm", ["run", "db:reset"]);
    await runCommand("npm", ["run", "db:start"]);
    await runCommand("npm", ["run", "db:migrate"]);
    await runCommand("npm", ["run", "db:seed"]);
    await runCommand("npm", ["run", "build"]);

    appProcess = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1"], {
      cwd: webDir,
      env: getSmokeEnv(),
      stdio: "inherit",
    });

    const html = await waitForRoute(smokeRouteUrl);
    const coins = extractPreJson(html);

    assert.equal(coins.length, 10);
    assert.deepEqual(
      coins.map(({ title }) => title),
      [
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
      ],
    );
  } finally {
    await stopProcess(appProcess);
    await runCommand("npm", ["run", "db:reset"]).catch(() => {});
  }
}

await runSmoke();
