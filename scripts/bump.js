#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const packageJsonPath = join(rootDir, 'package.json');
const manifestJsonPath = join(rootDir, 'public/manifest.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid bump type: ${type}. Use "major", "minor", or "patch".`);
  }
}

const type = process.argv[2];

if (!type) {
  console.error('Usage: node scripts/bump.js <major|minor|patch>');
  process.exit(1);
}

const packageJson = readJson(packageJsonPath);
const manifestJson = readJson(manifestJsonPath);

const currentVersion = packageJson.version;
const newVersion = bumpVersion(currentVersion, type);

packageJson.version = newVersion;
manifestJson.version = newVersion;

writeJson(packageJsonPath, packageJson);
writeJson(manifestJsonPath, manifestJson);

console.log(`Bumped version: ${currentVersion} → ${newVersion}`);
