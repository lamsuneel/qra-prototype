import { spawn } from "node:child_process";

const BASE = "http://localhost:3100";

const reachable = async (): Promise<boolean> => {
  try {
    const response = await fetch(BASE, { signal: AbortSignal.timeout(2_000) });
    return response.ok;
  } catch {
    return false;
  }
};

const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Start the app if nothing is already serving on 3100.
 *
 * A server that is already up is reused as it stands — running a production
 * build against the suite is the more faithful check, and starting a second
 * one would only fight it for the port.
 */
export default async function globalSetup() {
  if (await reachable()) {
    console.log(`[qra] reusing the server already listening on ${BASE}`);
    return;
  }

  console.log(`[qra] nothing on ${BASE} — starting the dev server`);
  const server = spawn("npx", ["next", "dev", "-p", "3100"], {
    cwd: process.cwd(),
    stdio: "ignore",
    shell: true,
    detached: false,
  });
  server.unref();

  /* Next compiles the first route on demand, so this waits on a real
     response rather than on the port opening. */
  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (await reachable()) {
      console.log("[qra] dev server is up");
      return;
    }
    await settle(1_000);
  }

  throw new Error(`Could not reach ${BASE} — start the app before running the suite.`);
}
