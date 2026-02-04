#!/usr/bin/env node

import { readFileSync, createWriteStream, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

const manifestPath = join(distDir, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const version = manifest.version;

const zipFilename = `tab-cluster-v${version}.zip`;
const zipPath = join(rootDir, zipFilename);

// Use system zip command
execSync(`zip -r "${zipPath}" . -x "*.DS_Store"`, { cwd: distDir, stdio: 'inherit' });

const stats = statSync(zipPath);
const sizeKB = (stats.size / 1024).toFixed(1);

console.log(`\nCreated ${zipFilename} (${sizeKB} KB)`);
