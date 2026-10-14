import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const fallbacks = {
  'page.tsx': 'import { DefaultLayout, HomePage } from "@extensions";\n\nexport default function Page() {\n  return <DefaultLayout><HomePage /></DefaultLayout>;\n}\n',
  '(modules)/user/notifications/page.tsx': 'export { default } from "@/modules/notification/tpl/UserNotificationsPage";\n',
};

const dependencySections = ['dependencies', 'devDependencies'];
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const packageNamePattern = /^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*$/;

function prepareDistributionPackage(root) {
  const configFile = path.join(root, 'scripts/plextype-distribution.json');
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  if (!isObject(config) || Object.keys(config).some(key => key !== 'gjworksOnly') || !isObject(config.gjworksOnly)) {
    throw new Error('plextype-distribution.json must contain a gjworksOnly object.');
  }
  const exclusions = Object.fromEntries(dependencySections.map(section => [section, new Set()]));
  for (const [feature, sections] of Object.entries(config.gjworksOnly)) {
    if (!isObject(sections) || Object.keys(sections).some(section => !dependencySections.includes(section))) {
      throw new Error(`Invalid exclusion group: ${feature}. Use dependencies and devDependencies arrays.`);
    }
    for (const section of dependencySections) {
      if (sections[section] === undefined) continue;
      if (!Array.isArray(sections[section]) || sections[section].some(name => typeof name !== 'string' || !packageNamePattern.test(name))) {
        throw new Error(`Invalid package names in ${feature}.${section}.`);
      }
      sections[section].forEach(name => exclusions[section].add(name));
    }
  }

  const packageFile = path.join(root, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  const removed = [];
  for (const section of dependencySections) {
    for (const name of exclusions[section]) {
      if (Object.hasOwn(pkg[section] || {}, name)) {
        delete pkg[section][name];
        removed.push(`${section}:${name}`);
      }
    }
  }
  // Keep the source manifest byte-for-byte intact when the exclusion list is empty.
  if (removed.length) fs.writeFileSync(packageFile, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`Prepared Plextype dependencies: excluded ${removed.length} entries${removed.length ? ` (${removed.join(', ')})` : ''}.`);
}

// Only run in the filtered distribution, never in the source checkout.
export function preparePlextype(root) {
  if (fs.existsSync(path.join(root, 'src/extensions'))) {
    throw new Error('Remove extensions in a distribution checkout before preparing Plextype.');
  }
  prepareDistributionPackage(root);
  const app = path.join(root, 'src/app');
  const removed = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        const content = fs.readFileSync(file, 'utf8');
        if ((content.startsWith('// Extension-owned implementation;') ||
             content.startsWith('// Implementation is owned by Store;')) &&
            content.includes('from "@/extensions/')) {
          fs.unlinkSync(file);
          removed.push(path.relative(app, file));
        }
      }
    }
  }
  visit(app);
  for (const [route, content] of Object.entries(fallbacks)) {
    const file = path.join(app, route);
    if (fs.existsSync(file)) continue;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  console.log(`Prepared Plextype: removed ${removed.length} extension route adapters.`);
  return removed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  preparePlextype(process.cwd());
}
