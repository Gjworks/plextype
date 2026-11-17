import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const fallbacks = {
  'page.tsx': 'import { DefaultLayout, HomePage } from "@extensions";\n\nexport default function Page() {\n  return <DefaultLayout><HomePage /></DefaultLayout>;\n}\n',
  '(modules)/user/notifications/page.tsx': 'export { default } from "@/modules/notification/tpl/UserNotificationsPage";\n',
};

// Only run in the filtered distribution, never in the source checkout.
export function preparePlextype(root) {
  if (fs.existsSync(path.join(root, 'src/extensions'))) {
    throw new Error('Remove extensions in a distribution checkout before preparing Plextype.');
  }
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
