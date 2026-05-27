#!/usr/bin/env node
/**
 * sync-sc-tracks.js
 * ─────────────────
 * Validates every SoundCloud URL in src/data/sc-tracks.json via oEmbed,
 * updates thumbnail URLs, and flags any broken links.
 *
 * Run:  npm run sync-sc
 *
 * After uploading new tracks to SoundCloud:
 *  1. Add the track entry to src/data/sc-tracks.json (url + metadata)
 *  2. Run:  npm run sync-sc
 *  3. Commit + deploy
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../src/data/sc-tracks.json');

const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));

let ok = 0, failed = 0;

console.log('\n🎵 Syncing SoundCloud track data...\n');

for (const cat of data.categories) {
  console.log(`── ${cat.label}`);
  for (const track of cat.tracks) {
    const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(track.url)}&format=json`;
    try {
      const res = await fetch(oembedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      track.thumb = json.thumbnail_url ?? '';
      track.scTitle = json.title ?? track.title; // SC's canonical title
      console.log(`   ✅ ${track.title}`);
      ok++;
    } catch (e) {
      track.thumb = '';
      console.log(`   ❌ ${track.title}  ← ${e.message} — check URL: ${track.url}`);
      failed++;
    }
  }
}

writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

console.log(`\n Done. ${ok} OK · ${failed} failed`);
if (failed > 0) {
  console.log('\n⚠️  Fix the failed URLs in src/data/sc-tracks.json then re-run npm run sync-sc');
  process.exit(1);
}
