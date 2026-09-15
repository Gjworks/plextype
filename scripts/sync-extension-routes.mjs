import fs from 'node:fs';
import path from 'node:path';
import { readExtensionRoutes, renderExtensionRoute } from './extension-files.mjs';

const write = process.argv.includes('--write');
const entries = readExtensionRoutes(process.cwd());
// Validate every destination before writing any file.
for (const entry of entries) {
  const expected = renderExtensionRoute(entry);
  const current = fs.existsSync(entry.routePath) ? fs.readFileSync(entry.routePath, 'utf8') : null;
  if (current === expected) continue;
  if (!write) throw new Error(`Route needs synchronization: ${entry.route}`);
  if (current !== null && !current.startsWith('// Implementation is owned by Store;') &&
      !current.startsWith('// Extension-owned implementation;')) {
    throw new Error(`Refusing to overwrite a hand-written route: ${entry.route}`);
  }
}
if (write) {
  for (const entry of entries) {
    const expected = renderExtensionRoute(entry);
    if (fs.existsSync(entry.routePath) && fs.readFileSync(entry.routePath, 'utf8') === expected) continue;
    fs.mkdirSync(path.dirname(entry.routePath), { recursive: true });
    fs.writeFileSync(entry.routePath, expected);
  }
}
console.log(`Verified ${entries.length} extension route connections${write ? ' (synchronized)' : ''}.`);
