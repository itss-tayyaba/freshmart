import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('Customer Portal JSX Tags & Icon Imports Verification', () => {
  const portalFiles = [
    'src/components/CustomerPortal/CustomerPortal.jsx',
    'src/components/CustomerPortal/CustomerAuth.jsx',
    'src/components/CustomerPortal/views/OrdersView.jsx',
    'src/components/CustomerPortal/views/AddressesView.jsx',
    'src/components/CustomerPortal/views/WalletRewardsView.jsx',
    'src/components/CustomerPortal/views/ProfileSettingsView.jsx'
  ];

  portalFiles.forEach((file) => {
    it(`has 0 missing imports or undeclared JSX components in ${file}`, () => {
      const content = fs.readFileSync(file, 'utf8');

      // Extract all imports
      const imports = new Set(['React', 'Fragment']);
      const importRegex = /import\s+(?:\{([^}]+)\}|([A-Za-z0-9_]+))\s+from\s+['"][^'"]+['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        if (match[1]) {
          match[1].split(',').forEach((s) => {
            const item = s.trim().split(/\s+as\s+/).pop().trim();
            if (item) imports.add(item);
          });
        }
        if (match[2]) {
          imports.add(match[2].trim());
        }
      }

      // Extract all locally declared components/functions
      const declared = new Set(['React', 'Fragment', 'Image', 'Date']);
      const declRegex = /(?:const|let|var|function|class)\s+([A-Z][A-Za-z0-9_]*)/g;
      while ((match = declRegex.exec(content)) !== null) {
        declared.add(match[1]);
      }

      // Find all JSX tags
      const tags = new Set();
      const tagRegex = /<([A-Z][A-Za-z0-9_]*)/g;
      while ((match = tagRegex.exec(content)) !== null) {
        tags.add(match[1]);
      }

      const missing = [];
      for (const tag of tags) {
        if (!imports.has(tag) && !declared.has(tag)) {
          missing.push(tag);
        }
      }

      assert.deepStrictEqual(
        missing,
        [],
        `Found undeclared/unimported JSX components in ${file}: ${missing.join(', ')}`
      );
    });
  });
});
