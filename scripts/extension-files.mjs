import fs from 'node:fs';
import path from 'node:path';

// Inspect source folders only; never follow symlinks or dependency directories.
export function walkExtensionDirectories(directory, visit) {
  if (!fs.existsSync(directory)) return;
  visit(directory);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && !['node_modules', 'build', 'dist', 'storage'].includes(entry.name)) {
      walkExtensionDirectories(path.join(directory, entry.name), visit);
    }
  }
}

export function findExtensionPrismaSources(rootDir) {
  const sources = [];
  const extensions = path.join(rootDir, 'src', 'extensions');
  walkExtensionDirectories(extensions, directory => {
    if (path.basename(directory) !== 'prisma') return;
    sources.push({
      name: 'Extension',
      singleSchemaPath: path.join(directory, 'schema.prisma'),
      schemaDir: path.join(directory, 'schema'),
    });
  });
  return sources;
}

export function readExtensionRoutes(rootDir) {
  const routes = [];
  const owners = new Set();
  walkExtensionDirectories(path.join(rootDir, 'src', 'extensions'), directory => {
    const manifest = path.join(directory, 'routes.json');
    if (!fs.existsSync(manifest)) return;
    for (const entry of JSON.parse(fs.readFileSync(manifest, 'utf8'))) {
      const route = path.resolve(rootDir, entry.route);
      const implementation = path.resolve(rootDir, entry.implementation);
      if (!route.startsWith(path.join(rootDir, 'src', 'app') + path.sep) ||
          !implementation.startsWith(directory + path.sep)) {
        throw new Error(`Route outside its owner: ${manifest}`);
      }
      if (owners.has(route)) throw new Error(`Duplicate route: ${entry.route}`);
      owners.add(route);
      if (!fs.statSync(implementation).isFile()) throw new Error(`Missing implementation: ${implementation}`);
      routes.push({ ...entry, routePath: route });
    }
  });
  return routes;
}

export function renderExtensionRoute(entry) {
  const legacyStore = entry.implementation.startsWith('src/extensions/store/');
  const exports = entry.exports ?? [entry.route.endsWith('/route.ts') ? 'GET' : 'default'];
  const modulePath = '@/' + entry.implementation.slice(4).replace(/\.(tsx|ts)$/, '');
  return [
    legacyStore
      ? '// Implementation is owned by Store; route configuration stays statically visible.'
      : '// Extension-owned implementation; keep route configuration statically visible.',
    ...entry.configs,
    `export { ${exports.join(', ')} } from "${modulePath}";`,
    '',
  ].join('\n');
}
