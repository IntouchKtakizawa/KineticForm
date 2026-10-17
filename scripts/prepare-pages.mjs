import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';

// gh-pages checks the deployment branch's .gitignore while staging files.
// An empty deployment-specific file ensures Expo's nested icon-font assets
// are published even though their output path contains "node_modules".
await writeFile(new URL('../dist/.gitignore', import.meta.url), '# Deployment output: include every generated asset.\n');

// Expo emits route.html files. GitHub Pages does not rewrite clean URLs to
// those files, so mirror each static route to route/index.html. This keeps
// bookmarks and refreshes working after Expo Router pushes a clean URL.
const dist = new URL('../dist/', import.meta.url);
const entries = await readdir(dist, { withFileTypes: true });
for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.html') || ['index.html', '+not-found.html', '_sitemap.html'].includes(entry.name)) continue;
  const route = entry.name.slice(0, -5);
  const directory = new URL(`${route}/`, dist);
  await mkdir(directory, { recursive: true });
  await copyFile(new URL(entry.name, dist), new URL('index.html', directory));
}
await copyFile(new URL('+not-found.html', dist), new URL('404.html', dist));
