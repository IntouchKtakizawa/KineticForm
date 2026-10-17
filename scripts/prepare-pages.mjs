import { writeFile } from 'node:fs/promises';

// gh-pages checks the deployment branch's .gitignore while staging files.
// An empty deployment-specific file ensures Expo's nested icon-font assets
// are published even though their output path contains "node_modules".
await writeFile(new URL('../dist/.gitignore', import.meta.url), '# Deployment output: include every generated asset.\n');
