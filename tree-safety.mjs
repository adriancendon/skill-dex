import fs from 'node:fs';
import path from 'node:path';

const outside = (root, target) => { const rel = path.relative(root, target); return rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel); };
// lstat/readdir never traverse links, including directory links and dangling links.
export function symlinkFindings(root, { remove = false, all = false } = {}) {
  root = fs.realpathSync(root);
  const findings = [], links = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) {
        const target = fs.readlinkSync(file), relative = path.relative(root, file);
        let resolved = path.resolve(dir, target);
        try { resolved = fs.realpathSync(file); } catch { /* A dangling link still has a lexical target. */ }
        const escapes = outside(root, resolved);
        if (remove) links.push(file);
        if (all || escapes) findings.push({ severity: escapes ? 'HIGH' : 'MEDIUM', category: 'symlink', pattern: 'repository-symlink', finding: `symlink ${remove ? 'removed' : 'not followed'}: ${relative} -> ${target}`, explanation: escapes ? 'The link points outside the skill folder; its target was not read.' : 'The link was removed before scanning or reading.', location: { file: relative } });
      } else if (entry.isDirectory()) walk(file);
    }
  };
  walk(root);
  for (const file of links) fs.unlinkSync(file);
  return findings;
}
export const removeSymlinks = root => symlinkFindings(root, { remove: true, all: true });
export function copyWithoutSymlinks(source, dest) {
  fs.mkdirSync(dest, { recursive: true, mode: 0o700 });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const src = path.join(source, entry.name), dst = path.join(dest, entry.name);
    if (entry.isDirectory()) copyWithoutSymlinks(src, dst);
    else if (entry.isFile()) fs.copyFileSync(src, dst);
  }
}
export function safeTreePath(root, file) {
  const full = path.resolve(root, file);
  if (outside(path.resolve(root), full)) return null;
  let current = path.resolve(root);
  try {
    for (const part of path.relative(current, full).split(path.sep).filter(Boolean)) {
      current = path.join(current, part);
      if (fs.lstatSync(current).isSymbolicLink()) return null;
    }
    return full;
  } catch { return null; }
}
