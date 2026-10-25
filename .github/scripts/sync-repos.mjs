// Fetches all repos (public+private) and rewrites the automated section in README.md
import fs from 'node:fs';

const H = {
  Authorization: `Bearer ${process.env.PROFILE_PAT}`,
  Accept: 'application/vnd.github+json'
};

const repos = await (await fetch('https://api.github.com/user/repos?visibility=all&per_page=100&sort=pushed&affiliation=owner', { headers: H })).json();
if (!Array.isArray(repos)) throw new Error('repos fetch failed: ' + JSON.stringify(repos).slice(0, 120));

const owned = repos.filter(r => r.owner.login === 'Munnabhai63' && r.name !== 'Munnabhai63');

const lines = ['| System | Description | Language | Status |', '| :--- | :--- | :--- | :--- |'];
for (const r of owned) {
  const desc = (r.description || '—').replace(/\|/g, '/').replace(/\n/g, ' ').slice(0, 110);
  const lang = r.language || '—';
  if (r.private) {
    lines.push(`| **${r.name}** | ${desc} | ${lang} | 🔒 Private |`);
  } else {
    lines.push(`| **[${r.name}](${r.html_url})** | ${desc} | ${lang} | 🔓 Public |`);
  }
}
const section = [
  '<!-- AUTOMATED:REPOS:START -->',
  '<!-- This section is auto-updated by GitHub Actions. Do not edit manually. -->',
  '',
  ...lines,
  '',
  '<sub>Auto-synced from the GitHub API every 6 hours.</sub>',
  '<!-- AUTOMATED:REPOS:END -->'
].join('\n');

let readme = fs.readFileSync('README.md', 'utf8');
const start = readme.indexOf('<!-- AUTOMATED:REPOS:START -->');
const end = readme.indexOf('<!-- AUTOMATED:REPOS:END -->');
if (start === -1 || end === -1) throw new Error('automation markers missing in README');
readme = readme.slice(0, start) + section + readme.slice(end + '<!-- AUTOMATED:REPOS:END -->'.length);

fs.writeFileSync('README.md', readme);
console.log('README updated with ' + owned.length + ' repositories (' + owned.filter(r => r.private).length + ' private)');
