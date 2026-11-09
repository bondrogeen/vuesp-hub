import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

/**
 * alisa-npm@1.2.0 talks to quasar.yandex.net, which currently answers
 * 429 "limited" for the Glagol endpoints used here. The .ru host works with
 * the same token. The package also crashes on a non-JSON error body, so the
 * response parser is hardened. The patch is idempotent and safe to rerun.
 */
const files = ['node_modules/alisa-npm/build/service.js', 'node_modules/alisa-npm/src/service.js'];
const replacements = [
  ['return resolve(JSON.parse(data));', 'try { return resolve(JSON.parse(data)); } catch { return resolve({ status: "error", error: String(data).slice(0, 200) }); }'],
  ['res.on(\'end\', () => resolve(JSON.parse(data)));', 'res.on(\'end\', () => { try { resolve(JSON.parse(data)); } catch { resolve({ status: "error", error: String(data).slice(0, 200) }); } });'],
];

let changed = 0;
for (const file of files) {
  if (!existsSync(file)) continue;
  const before = await readFile(file, 'utf8');
  let after = before.replaceAll('https://quasar.yandex.net', 'https://quasar.yandex.ru');
  for (const [oldText, newText] of replacements) after = after.replaceAll(oldText, newText);
  if (after !== before) {
    await writeFile(file, after);
    changed += 1;
  }
}

if (changed) console.log(`[patch-alisa-npm] patched ${changed} file(s)`);
