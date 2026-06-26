import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, 'assets', 'screens');
mkdirSync(outDir, { recursive: true });

const esc = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function frame({ title, subtitle, accent, accent2, bg, panels, content, id }) {
  const panelMarkup = panels
    .map(
      (panel, index) => `
        <rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}" rx="10" fill="${panel.fill || '#111a17'}" stroke="${panel.stroke || 'rgba(255,255,255,.14)'}" stroke-width="1"/>
        <text x="${panel.x + 18}" y="${panel.y + 30}" class="kicker">${esc(panel.label)}</text>
        ${(panel.lines || [])
          .map(
            (line, lineIndex) => `
              <rect x="${panel.x + 18}" y="${panel.y + 54 + lineIndex * 34}" width="${line.w}" height="9" rx="4.5" fill="${line.color || 'rgba(255,255,255,.28)'}"/>
              <rect x="${panel.x + 18}" y="${panel.y + 70 + lineIndex * 34}" width="${Math.max(36, line.w * 0.58)}" height="5" rx="2.5" fill="rgba(255,255,255,.12)"/>`
          )
          .join('')}
        ${(panel.badges || [])
          .map(
            (badge, badgeIndex) => `
              <rect x="${panel.x + 18 + badgeIndex * 94}" y="${panel.y + panel.h - 38}" width="78" height="22" rx="11" fill="${badge.fill || accent}" opacity=".92"/>
              <text x="${panel.x + 57 + badgeIndex * 94}" y="${panel.y + panel.h - 23}" class="badge">${esc(badge.text)}</text>`
          )
          .join('')}`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" role="img" aria-labelledby="${id}-title ${id}-desc">
  <title id="${id}-title">${esc(title)} public-safe interface mockup</title>
  <desc id="${id}-desc">A sanitized visual mockup with private data removed.</desc>
  <defs>
    <linearGradient id="${id}-bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${bg[0]}"/>
      <stop offset=".52" stop-color="${bg[1]}"/>
      <stop offset="1" stop-color="${bg[2]}"/>
    </linearGradient>
    <radialGradient id="${id}-glow" cx=".76" cy=".14" r=".9">
      <stop offset="0" stop-color="${accent}" stop-opacity=".5"/>
      <stop offset=".42" stop-color="${accent2}" stop-opacity=".18"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <filter id="${id}-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity=".32"/>
    </filter>
    <style>
      .title { font: 800 42px Inter, Arial, sans-serif; fill: #f7fff7; letter-spacing: 0; }
      .sub { font: 500 18px Inter, Arial, sans-serif; fill: rgba(247,255,247,.72); letter-spacing: 0; }
      .nav { font: 700 13px Inter, Arial, sans-serif; fill: rgba(247,255,247,.56); letter-spacing: .06em; }
      .kicker { font: 800 13px Inter, Arial, sans-serif; fill: rgba(247,255,247,.68); letter-spacing: .08em; text-transform: uppercase; }
      .badge { font: 800 10px Inter, Arial, sans-serif; fill: #07110d; text-anchor: middle; letter-spacing: .04em; }
      .tiny { font: 700 11px Inter, Arial, sans-serif; fill: rgba(247,255,247,.5); letter-spacing: .06em; }
      .label { font: 700 15px Inter, Arial, sans-serif; fill: rgba(247,255,247,.76); letter-spacing: 0; }
    </style>
  </defs>
  <rect width="1200" height="760" fill="url(#${id}-bg)"/>
  <rect width="1200" height="760" fill="url(#${id}-glow)"/>
  <path d="M-80 690 C170 560 266 738 487 601 C661 494 765 562 918 434 C1054 321 1135 360 1260 260" fill="none" stroke="${accent}" stroke-width="2" opacity=".32"/>
  <path d="M-40 118 C199 214 314 56 516 180 C699 292 813 152 1020 206 C1114 231 1161 272 1240 236" fill="none" stroke="${accent2}" stroke-width="2" opacity=".26"/>
  <g filter="url(#${id}-shadow)">
    <rect x="72" y="82" width="1056" height="596" rx="18" fill="rgba(4,10,8,.74)" stroke="rgba(255,255,255,.18)" stroke-width="1.2"/>
    <rect x="72" y="82" width="1056" height="58" rx="18" fill="rgba(255,255,255,.08)"/>
    <circle cx="104" cy="111" r="7" fill="#f06a5b"/>
    <circle cx="130" cy="111" r="7" fill="#f4c95d"/>
    <circle cx="156" cy="111" r="7" fill="#79d279"/>
    <text x="190" y="116" class="nav">PUBLIC MOCK / PRIVATE DATA REDACTED</text>
    <text x="990" y="116" class="tiny">STATIC PREVIEW</text>
    <text x="112" y="206" class="title">${esc(title)}</text>
    <text x="114" y="240" class="sub">${esc(subtitle)}</text>
    ${panelMarkup}
    ${content || ''}
  </g>
</svg>
`;
}

const screenshots = [
  {
    file: 'estimateengine.svg',
    id: 'estimateengine',
    title: 'EstimateEngine',
    subtitle: 'Human-reviewed operating workflow from messy inputs to ready packets.',
    accent: '#b7f36b',
    accent2: '#39c6ad',
    bg: ['#101510', '#182017', '#26311c'],
    panels: [
      {
        x: 112,
        y: 292,
        w: 278,
        h: 286,
        label: 'intake',
        lines: [
          { w: 190, color: '#b7f36b' },
          { w: 236 },
          { w: 164 },
          { w: 214 },
        ],
        badges: [{ text: 'review' }, { text: 'source' }],
      },
      {
        x: 424,
        y: 292,
        w: 304,
        h: 286,
        label: 'reasoning',
        lines: [
          { w: 210, color: '#39c6ad' },
          { w: 246 },
          { w: 188 },
          { w: 228 },
        ],
        badges: [{ text: 'options' }, { text: 'audit' }],
      },
      {
        x: 762,
        y: 292,
        w: 314,
        h: 286,
        label: 'ready packet',
        lines: [
          { w: 236, color: '#f2d35f' },
          { w: 204 },
          { w: 252 },
          { w: 186 },
        ],
        badges: [{ text: 'verify' }, { text: 'handoff' }],
      },
    ],
    content: `
      <path d="M390 430 C414 430 407 430 424 430" stroke="#b7f36b" stroke-width="4" stroke-linecap="round" opacity=".75"/>
      <path d="M728 430 C750 430 744 430 762 430" stroke="#39c6ad" stroke-width="4" stroke-linecap="round" opacity=".75"/>
      <text x="112" y="618" class="label">Built to preserve judgement, provenance, and review gates.</text>`,
  },
  {
    file: 'whalepasta.svg',
    id: 'whalepasta',
    title: 'WhalePasta',
    subtitle: 'Private decision-loop lab with risk gates, monitoring, and rollback habits.',
    accent: '#66e2ff',
    accent2: '#f58d42',
    bg: ['#071315', '#0d1c1c', '#1d2416'],
    panels: [
      {
        x: 112,
        y: 292,
        w: 286,
        h: 286,
        label: 'risk gates',
        lines: [
          { w: 210, color: '#66e2ff' },
          { w: 160 },
          { w: 230 },
        ],
        badges: [{ text: 'cap' }, { text: 'pause' }],
      },
      {
        x: 432,
        y: 292,
        w: 326,
        h: 286,
        label: 'signal watch',
        lines: [
          { w: 250, color: '#b7f36b' },
          { w: 206 },
          { w: 272 },
        ],
        badges: [{ text: 'paper' }, { text: 'canary' }],
      },
      {
        x: 792,
        y: 292,
        w: 284,
        h: 286,
        label: 'audit trail',
        lines: [
          { w: 198, color: '#f58d42' },
          { w: 230 },
          { w: 176 },
        ],
        badges: [{ text: 'trace' }, { text: 'exit' }],
      },
    ],
    content: `
      <polyline points="454,516 500,472 548,498 600,394 646,420 718,350" fill="none" stroke="#66e2ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="718" cy="350" r="8" fill="#b7f36b"/>
      <text x="112" y="618" class="label">Numbers, identifiers, addresses, and live strategy details are intentionally absent.</text>`,
  },
  {
    file: 'ctrl.svg',
    id: 'ctrl',
    title: 'CTRL',
    subtitle: 'Private operator cockpit for approvals, queues, maintenance, and review.',
    accent: '#b7f36b',
    accent2: '#e66a72',
    bg: ['#10120f', '#191d19', '#24271f'],
    panels: [
      {
        x: 112,
        y: 292,
        w: 220,
        h: 286,
        label: 'triage',
        lines: [
          { w: 146, color: '#e66a72' },
          { w: 170 },
          { w: 122 },
          { w: 154 },
        ],
        badges: [{ text: 'queue' }],
      },
      {
        x: 360,
        y: 292,
        w: 220,
        h: 286,
        label: 'approve',
        lines: [
          { w: 170, color: '#b7f36b' },
          { w: 136 },
          { w: 154 },
          { w: 118 },
        ],
        badges: [{ text: 'gate' }],
      },
      {
        x: 608,
        y: 292,
        w: 220,
        h: 286,
        label: 'verify',
        lines: [
          { w: 158, color: '#39c6ad' },
          { w: 130 },
          { w: 174 },
          { w: 142 },
        ],
        badges: [{ text: 'proof' }],
      },
      {
        x: 856,
        y: 292,
        w: 220,
        h: 286,
        label: 'archive',
        lines: [
          { w: 168, color: '#f2d35f' },
          { w: 148 },
          { w: 112 },
          { w: 162 },
        ],
        badges: [{ text: 'record' }],
      },
    ],
    content: `
      <text x="112" y="618" class="label">Operational work should be legible, reversible, and owned by a human.</text>`,
  },
  {
    file: 'telemetrybase.svg',
    id: 'telemetrybase',
    title: 'TelemetryBase',
    subtitle: 'Governed memory, documentation, permissions, and reusable operating context.',
    accent: '#39c6ad',
    accent2: '#b7f36b',
    bg: ['#0b1513', '#121f1c', '#202514'],
    panels: [
      {
        x: 112,
        y: 292,
        w: 284,
        h: 286,
        label: 'records',
        lines: [
          { w: 204, color: '#39c6ad' },
          { w: 238 },
          { w: 184 },
          { w: 216 },
        ],
        badges: [{ text: 'source' }, { text: 'scope' }],
      },
      {
        x: 452,
        y: 292,
        w: 294,
        h: 286,
        label: 'skills',
        lines: [
          { w: 220, color: '#b7f36b' },
          { w: 192 },
          { w: 250 },
          { w: 170 },
        ],
        badges: [{ text: 'reuse' }, { text: 'verify' }],
      },
      {
        x: 802,
        y: 292,
        w: 274,
        h: 286,
        label: 'context',
        lines: [
          { w: 206, color: '#f2d35f' },
          { w: 180 },
          { w: 230 },
          { w: 150 },
        ],
        badges: [{ text: 'access' }, { text: 'memory' }],
      },
    ],
    content: `
      <path d="M400 414 C428 382 438 382 452 414 M746 414 C778 382 790 382 802 414" stroke="#39c6ad" stroke-width="3" fill="none" opacity=".76"/>
      <text x="112" y="618" class="label">Built for continuity: fewer dropped threads, clearer provenance, better handoffs.</text>`,
  },
  {
    file: 'civdex.svg',
    id: 'civdex',
    title: 'CivDex',
    subtitle: 'Source-backed civic contact intelligence for public-interest infrastructure.',
    accent: '#f2d35f',
    accent2: '#39c6ad',
    bg: ['#13130d', '#1d1d15', '#1a241d'],
    panels: [
      {
        x: 112,
        y: 292,
        w: 304,
        h: 286,
        label: 'public source',
        lines: [
          { w: 226, color: '#f2d35f' },
          { w: 246 },
          { w: 194 },
          { w: 220 },
        ],
        badges: [{ text: 'html' }, { text: 'cite' }],
      },
      {
        x: 448,
        y: 292,
        w: 300,
        h: 286,
        label: 'graph',
        lines: [
          { w: 210, color: '#39c6ad' },
          { w: 174 },
          { w: 244 },
          { w: 186 },
        ],
        badges: [{ text: 'office' }, { text: 'route' }],
      },
      {
        x: 780,
        y: 292,
        w: 296,
        h: 286,
        label: 'review',
        lines: [
          { w: 218, color: '#b7f36b' },
          { w: 196 },
          { w: 236 },
          { w: 170 },
        ],
        badges: [{ text: 'human' }, { text: 'care' }],
      },
    ],
    content: `
      <circle cx="594" cy="410" r="18" fill="#f2d35f"/>
      <circle cx="656" cy="472" r="13" fill="#39c6ad"/>
      <circle cx="542" cy="500" r="11" fill="#b7f36b"/>
      <path d="M594 410 L656 472 L542 500 Z" fill="none" stroke="rgba(247,255,247,.5)" stroke-width="3"/>
      <text x="112" y="618" class="label">Civic systems should be source-backed, careful, and useful to ordinary people.</text>`,
  },
];

for (const screenshot of screenshots) {
  writeFileSync(join(outDir, screenshot.file), frame(screenshot));
}

console.log(`Generated ${screenshots.length} public-safe mockups in ${outDir}`);
