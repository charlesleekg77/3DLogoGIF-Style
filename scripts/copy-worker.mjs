// Copy third-party runtime assets that live inside node_modules into /public so
// that Next.js can serve them at a stable, cacheable URL.
//
// gif.js needs its worker script to be fetchable by `new Worker(url)`; bundlers
// cannot inline a worker that is instantiated from inside a library file.
import { copyFile, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const assets = [
  {
    from: resolve(root, "node_modules/gif.js/dist/gif.worker.js"),
    to: resolve(root, "public/vendor/gif.worker.js"),
  },
];

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

for (const asset of assets) {
  if (!(await exists(asset.from))) {
    console.warn(`[copy-worker] skipped missing source: ${asset.from}`);
    continue;
  }
  await mkdir(dirname(asset.to), { recursive: true });
  await copyFile(asset.from, asset.to);
  console.log(`[copy-worker] ${asset.from} -> ${asset.to}`);
}
