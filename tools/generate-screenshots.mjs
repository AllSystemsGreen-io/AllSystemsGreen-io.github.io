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

const textBlock = (lines, x, y, className, lineHeight = 19) =>
  lines
    .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" class="${className}">${esc(line)}</text>`)
    .join('\n');

function metricBars({ x, y, values, accent, accent2 }) {
  return values
    .map((value, index) => {
      const width = 58 + value.width;
      const color = value.hot ? accent : index % 2 ? accent2 : 'rgba(247,255,247,.26)';
      return `
        <text x="${x}" y="${y + index * 31}" class="metric-label">${esc(value.label)}</text>
        <rect class="bar bar-${index}" x="${x}" y="${y + 9 + index * 31}" width="${width}" height="8" rx="4" fill="${color}" opacity="${value.hot ? '.92' : '.58'}"/>
        <rect x="${x}" y="${y + 22 + index * 31}" width="${Math.max(42, Math.round(width * 0.52))}" height="4" rx="2" fill="rgba(247,255,247,.14)"/>`;
    })
    .join('\n');
}

function card({ card, index, x, y, w, h, accent, accent2 }) {
  return `
    <g class="vision-card vision-card-${index}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="rgba(3,8,6,.64)" stroke="rgba(247,255,247,.16)" stroke-width="1"/>
      <rect x="${x}" y="${y}" width="${w}" height="34" rx="12" fill="rgba(247,255,247,.06)"/>
      <text x="${x + 16}" y="${y + 23}" class="card-kicker">${esc(card.kicker)}</text>
      <text x="${x + 16}" y="${y + 62}" class="card-title">${esc(card.title)}</text>
      ${textBlock(card.lines, x + 16, y + 86, 'card-line', 19)}
      ${metricBars({ x: x + 16, y: y + h - 69, values: card.metrics, accent, accent2 })}
    </g>`;
}

function routeDiagram({ slide, accent, accent2 }) {
  const nodeMarkup = slide.nodes
    .map((node, index) => {
      const cx = 420 + index * 178;
      const cy = 570 + (index % 2 ? 16 : 0);
      const fill = node.hot ? accent : index % 2 ? accent2 : '#f2d35f';
      return `
        <circle class="route-node route-node-${index}" cx="${cx}" cy="${cy}" r="${node.hot ? 13 : 9}" fill="${fill}"/>
        <text x="${cx}" y="${cy + 34}" class="node-label">${esc(node.label)}</text>`;
    })
    .join('\n');

  return `
    <g class="route-diagram">
      <path class="route-line" d="M420 570 C500 532 564 624 598 586 S742 548 776 570 S920 618 954 586" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
      ${nodeMarkup}
      <text x="376" y="666" class="footer-line">${esc(slide.footer)}</text>
    </g>`;
}

function slideMarkup({ slide, index, accent, accent2 }) {
  const cardWidth = 216;
  const cardHeight = 176;
  const y = 304;
  const xs = [376, 622, 868];
  return `
    <g class="slide slide-${index}">
      <text x="376" y="216" class="slide-step">0${index + 1} / ${esc(slide.phase)}</text>
      <text x="376" y="254" class="slide-title">${esc(slide.title)}</text>
      ${textBlock(slide.caption, 378, 282, 'slide-copy', 18)}
      <text x="974" y="224" class="slide-status">${esc(slide.status)}</text>
      ${slide.cards
        .map((slideCard, cardIndex) =>
          card({
            card: slideCard,
            index: cardIndex,
            x: xs[cardIndex],
            y,
            w: cardWidth,
            h: cardHeight,
            accent,
            accent2,
          })
        )
        .join('\n')}
      ${routeDiagram({ slide, accent, accent2 })}
    </g>`;
}

function tabMarkup({ slides, accent }) {
  return slides
    .map(
      (slide, index) => `
      <g class="rail-tab rail-tab-${index}">
        <rect x="112" y="${286 + index * 74}" width="192" height="52" rx="8" fill="rgba(3,8,6,.5)" stroke="rgba(247,255,247,.14)"/>
        <rect class="tab-signal" x="112" y="${286 + index * 74}" width="4" height="52" rx="2" fill="${accent}"/>
        <text x="128" y="${307 + index * 74}" class="tab-index">0${index + 1}</text>
        <text x="166" y="${307 + index * 74}" class="tab-title">${esc(slide.phase)}</text>
        <text x="166" y="${328 + index * 74}" class="tab-note">${esc(slide.note)}</text>
      </g>`
    )
    .join('\n');
}

function visionMockup({ id, title, subtitle, accent, accent2, bg, slides }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" role="img" aria-labelledby="${id}-title ${id}-desc">
  <title id="${id}-title">${esc(title)} future-vision public mockup</title>
  <desc id="${id}-desc">A public-safe animated future-vision mockup. Private data, credentials, addresses, customer details, and live operating strategy are omitted.</desc>
  <defs>
    <linearGradient id="${id}-bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${bg[0]}"/>
      <stop offset=".56" stop-color="${bg[1]}"/>
      <stop offset="1" stop-color="${bg[2]}"/>
    </linearGradient>
    <radialGradient id="${id}-glow" cx=".74" cy=".2" r=".86">
      <stop offset="0" stop-color="${accent}" stop-opacity=".42"/>
      <stop offset=".38" stop-color="${accent2}" stop-opacity=".16"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-scan" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".5" stop-color="${accent}" stop-opacity=".2"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <filter id="${id}-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#000" flood-opacity=".34"/>
    </filter>
    <clipPath id="${id}-clip">
      <rect x="64" y="74" width="1072" height="612" rx="20"/>
    </clipPath>
    <style>
      .title { font: 900 31px Arial, sans-serif; fill: #f7fff7; letter-spacing: 0; }
      .sub { font: 600 15px Arial, sans-serif; fill: rgba(247,255,247,.7); letter-spacing: 0; }
      .nav { font: 800 12px Arial, sans-serif; fill: rgba(247,255,247,.58); letter-spacing: .08em; }
      .rail-label, .slide-step, .card-kicker, .slide-status { font: 900 12px Arial, sans-serif; letter-spacing: .1em; text-transform: uppercase; }
      .rail-label, .slide-step, .slide-status { fill: ${accent}; }
      .rail-copy, .tab-note, .slide-copy, .card-line, .metric-label, .footer-line { font: 600 12px Arial, sans-serif; fill: rgba(247,255,247,.68); letter-spacing: 0; }
      .tab-index { font: 900 13px Arial, sans-serif; fill: ${accent}; }
      .tab-title { font: 900 13px Arial, sans-serif; fill: #f7fff7; letter-spacing: 0; }
      .slide-title { font: 900 25px Arial, sans-serif; fill: #f7fff7; letter-spacing: 0; }
      .card-kicker { fill: ${accent2}; }
      .card-title { font: 900 16px Arial, sans-serif; fill: #f7fff7; letter-spacing: 0; }
      .node-label { font: 800 11px Arial, sans-serif; fill: rgba(247,255,247,.72); text-anchor: middle; letter-spacing: 0; }
      .slide { opacity: 0; transform: translateX(18px); animation-duration: 18s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
      .slide-0 { animation-name: showSlide0; }
      .slide-1 { animation-name: showSlide1; }
      .slide-2 { animation-name: showSlide2; }
      .rail-tab { opacity: .54; animation-duration: 18s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
      .rail-tab-0 { animation-name: activeTab0; }
      .rail-tab-1 { animation-name: activeTab1; }
      .rail-tab-2 { animation-name: activeTab2; }
      .tab-signal { opacity: .36; animation-duration: 18s; animation-iteration-count: infinite; }
      .rail-tab-0 .tab-signal { animation-name: activeTab0; }
      .rail-tab-1 .tab-signal { animation-name: activeTab1; }
      .rail-tab-2 .tab-signal { animation-name: activeTab2; }
      .vision-card { animation: cardLift 5.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      .vision-card-1 { animation-delay: -.8s; }
      .vision-card-2 { animation-delay: -1.6s; }
      .bar { animation: barPulse 4.6s ease-in-out infinite; transform-box: fill-box; transform-origin: left center; }
      .bar-1 { animation-delay: -.7s; }
      .bar-2 { animation-delay: -1.4s; }
      .route-line { stroke-dasharray: 26 18; animation: routeFlow 7.6s linear infinite; }
      .route-node { animation: nodePulse 3.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      .route-node-1 { animation-delay: -.8s; }
      .route-node-2 { animation-delay: -1.6s; }
      .route-node-3 { animation-delay: -2.4s; }
      .ambient { stroke-dasharray: 18 26; animation: routeFlow 22s linear infinite; }
      .scan { animation: scanPass 10s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      @keyframes showSlide0 {
        0%, 27% { opacity: 1; transform: translateX(0); }
        31%, 100% { opacity: 0; transform: translateX(-18px); }
      }
      @keyframes showSlide1 {
        0%, 30% { opacity: 0; transform: translateX(18px); }
        34%, 60% { opacity: 1; transform: translateX(0); }
        64%, 100% { opacity: 0; transform: translateX(-18px); }
      }
      @keyframes showSlide2 {
        0%, 63% { opacity: 0; transform: translateX(18px); }
        67%, 94% { opacity: 1; transform: translateX(0); }
        98%, 100% { opacity: 0; transform: translateX(-18px); }
      }
      @keyframes activeTab0 {
        0%, 27% { opacity: 1; }
        31%, 100% { opacity: .42; }
      }
      @keyframes activeTab1 {
        0%, 30% { opacity: .42; }
        34%, 60% { opacity: 1; }
        64%, 100% { opacity: .42; }
      }
      @keyframes activeTab2 {
        0%, 63% { opacity: .42; }
        67%, 94% { opacity: 1; }
        98%, 100% { opacity: .42; }
      }
      @keyframes cardLift {
        0%, 100% { transform: translateY(0); opacity: .9; }
        50% { transform: translateY(-3px); opacity: 1; }
      }
      @keyframes barPulse {
        0%, 100% { transform: scaleX(.78); opacity: .58; }
        46% { transform: scaleX(1); opacity: .98; }
      }
      @keyframes routeFlow { to { stroke-dashoffset: -240; } }
      @keyframes nodePulse {
        0%, 100% { transform: scale(1); opacity: .78; }
        50% { transform: scale(1.24); opacity: 1; }
      }
      @keyframes scanPass {
        0%, 14% { transform: translateX(-1240px) skewX(-12deg); opacity: 0; }
        28% { opacity: .74; }
        48%, 100% { transform: translateX(1240px) skewX(-12deg); opacity: 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; }
        .slide { opacity: 0 !important; transform: none !important; }
        .slide-0 { opacity: 1 !important; }
        .rail-tab { opacity: .54 !important; }
        .rail-tab-0 { opacity: 1 !important; }
      }
    </style>
  </defs>
  <rect width="1200" height="760" fill="url(#${id}-bg)"/>
  <rect width="1200" height="760" fill="url(#${id}-glow)"/>
  <path class="ambient" d="M-60 624 C210 496 314 700 530 548 C722 414 808 536 980 384 C1116 264 1172 296 1260 218" fill="none" stroke="${accent}" stroke-width="2" opacity=".3"/>
  <path class="ambient" d="M-42 160 C180 242 302 96 492 188 C708 292 818 118 1052 198 C1130 224 1168 270 1250 232" fill="none" stroke="${accent2}" stroke-width="2" opacity=".24"/>
  <g filter="url(#${id}-shadow)">
    <rect x="64" y="74" width="1072" height="612" rx="20" fill="rgba(3,7,5,.78)" stroke="rgba(247,255,247,.18)" stroke-width="1.2"/>
    <rect x="64" y="74" width="1072" height="60" rx="20" fill="rgba(247,255,247,.07)"/>
    <circle cx="96" cy="104" r="7" fill="#e66a72"/>
    <circle cx="122" cy="104" r="7" fill="#f2d35f"/>
    <circle cx="148" cy="104" r="7" fill="${accent}"/>
    <text x="184" y="109" class="nav">PUBLIC FUTURE MOCK / PRIVATE DETAILS OMITTED</text>
    <text x="930" y="109" class="nav">VISION SEQUENCE</text>
    <line x1="326" y1="156" x2="326" y2="654" stroke="rgba(247,255,247,.14)" stroke-width="1"/>
    <text x="112" y="202" class="title">${esc(title)}</text>
    ${textBlock(subtitle, 114, 238, 'sub', 18)}
    <text x="112" y="270" class="rail-label">Future path</text>
    ${tabMarkup({ slides, accent })}
    <text x="112" y="574" class="rail-label">Public boundary</text>
    ${textBlock(['Sanitized UI direction.', 'No PII, credentials, addresses,', 'live strategy, or client data.'], 114, 602, 'rail-copy', 18)}
    ${slides.map((slide, index) => slideMarkup({ slide, index, accent, accent2 })).join('\n')}
    <g clip-path="url(#${id}-clip)" pointer-events="none">
      <rect class="scan" x="-150" y="74" width="176" height="612" fill="url(#${id}-scan)" opacity=".7"/>
    </g>
  </g>
</svg>
`;
}

const common = {
  short: [
    { label: 'Signal', width: 92, hot: true },
    { label: 'Review', width: 128 },
  ],
  medium: [
    { label: 'Source', width: 116, hot: true },
    { label: 'Risk', width: 86 },
  ],
  long: [
    { label: 'Ready', width: 142, hot: true },
    { label: 'Trace', width: 100 },
  ],
};

const screenshots = [
  {
    file: 'estimateengine.svg',
    id: 'estimateengine',
    title: 'EstimateEngine',
    subtitle: ['Future estimator cockpit.', 'Rough context to ready packets.'],
    accent: '#35ff4f',
    accent2: '#49d7c6',
    bg: ['#08100b', '#111b13', '#202a16'],
    slides: [
      {
        phase: 'Capture',
        note: 'field chaos in',
        title: 'Field intake becomes structured scope.',
        caption: ['Notes, photos, missing dimensions, and assumptions are pulled into one review lane.'],
        status: 'INTAKE CLEANUP',
        footer: 'Nothing leaves the system until assumptions are visible.',
        nodes: [
          { label: 'notes', hot: true },
          { label: 'photos' },
          { label: 'dimensions' },
          { label: 'flags' },
        ],
        cards: [
          { kicker: 'raw inputs', title: 'Job context', lines: ['Voice notes, sketches,', 'site photos, quantities.'], metrics: common.medium },
          { kicker: 'exceptions', title: 'Missing facts', lines: ['Dimensions, access,', 'materials, exclusions.'], metrics: common.short },
          { kicker: 'source stack', title: 'Evidence lane', lines: ['Every claim points', 'back to origin.'], metrics: common.long },
        ],
      },
      {
        phase: 'Price',
        note: 'logic checked',
        title: 'Pricing logic stays reviewable.',
        caption: ['Assemblies, vendor quotes, margin, and risk notes are normalized before approval.'],
        status: 'HUMAN REVIEW',
        footer: 'The goal is a proposal that can be checked, not a magic number.',
        nodes: [
          { label: 'assembly' },
          { label: 'quote', hot: true },
          { label: 'risk' },
          { label: 'margin' },
        ],
        cards: [
          { kicker: 'assemblies', title: 'Line logic', lines: ['Labor, materials,', 'conditions, options.'], metrics: common.short },
          { kicker: 'vendor lane', title: 'Quote compare', lines: ['Supplier drift and', 'substitution notes.'], metrics: common.long },
          { kicker: 'review', title: 'Approval queue', lines: ['Owner judgement before', 'client handoff.'], metrics: common.medium },
        ],
      },
      {
        phase: 'Handoff',
        note: 'packet out',
        title: 'Ready packets make the next step obvious.',
        caption: ['The future state is an auditable packet: estimate, assumptions, options, and change trail.'],
        status: 'READY PACKET',
        footer: 'The handoff carries context, source notes, and the reason for each decision.',
        nodes: [
          { label: 'estimate' },
          { label: 'options' },
          { label: 'approval', hot: true },
          { label: 'handoff' },
        ],
        cards: [
          { kicker: 'client view', title: 'Proposal', lines: ['Clean enough to send,', 'still honest inside.'], metrics: common.long },
          { kicker: 'operator view', title: 'Change log', lines: ['What moved, why,', 'and who approved.'], metrics: common.medium },
          { kicker: 'field view', title: 'Build packet', lines: ['Scope boundaries and', 'next actions.'], metrics: common.short },
        ],
      },
    ],
  },
  {
    file: 'whalepasta.svg',
    id: 'whalepasta',
    title: 'WhalePasta',
    subtitle: ['Monitoring lab.', 'Signals, limits, stop rules.'],
    accent: '#66e2ff',
    accent2: '#f58d42',
    bg: ['#061114', '#0c1a1c', '#1e2417'],
    slides: [
      {
        phase: 'Signal',
        note: 'watch first',
        title: 'Signals earn trust before scale.',
        caption: ['Future screens separate candidate signal, market context, and canary behavior.'],
        status: 'SHADOW LANE',
        footer: 'Research, paper, canary, and live lanes stay visually distinct.',
        nodes: [
          { label: 'cohort', hot: true },
          { label: 'market' },
          { label: 'canary' },
          { label: 'live' },
        ],
        cards: [
          { kicker: 'candidate', title: 'Cohort view', lines: ['Ranked signals with', 'cooldown context.'], metrics: common.short },
          { kicker: 'market', title: 'Depth check', lines: ['Liquidity, spread,', 'and noise flags.'], metrics: common.medium },
          { kicker: 'canary', title: 'Tiny proof', lines: ['Behavior observed', 'before commitment.'], metrics: common.long },
        ],
      },
      {
        phase: 'Risk',
        note: 'limits visible',
        title: 'The stop controls are first-class.',
        caption: ['The vision is less auto-pilot, more instrumented lab with clear brakes.'],
        status: 'CAPS ACTIVE',
        footer: 'Caps, reconciliation, redemption, and rollback are part of the product surface.',
        nodes: [
          { label: 'cap' },
          { label: 'reconcile', hot: true },
          { label: 'redeem' },
          { label: 'stop' },
        ],
        cards: [
          { kicker: 'exposure', title: 'Limit stack', lines: ['Per market, cohort,', 'and operator caps.'], metrics: common.medium },
          { kicker: 'ledger', title: 'Reconcile', lines: ['Position truth vs', 'expected state.'], metrics: common.long },
          { kicker: 'halt', title: 'Stop rules', lines: ['Bad data, thin books,', 'or stale heartbeat.'], metrics: common.short },
        ],
      },
      {
        phase: 'Explain',
        note: 'why visible',
        title: 'Every automated action needs a reason trail.',
        caption: ['The future view makes attribution, confidence, and operator override legible.'],
        status: 'AUDIT TRAIL',
        footer: 'No identifiers, balances, live strategy, or wallet details belong in the public mock.',
        nodes: [
          { label: 'decision' },
          { label: 'fill' },
          { label: 'result', hot: true },
          { label: 'learn' },
        ],
        cards: [
          { kicker: 'why', title: 'Decision record', lines: ['Trigger, data age,', 'confidence, override.'], metrics: common.long },
          { kicker: 'what', title: 'Outcome map', lines: ['PnL attribution and', 'failure mode notes.'], metrics: common.short },
          { kicker: 'next', title: 'Research loop', lines: ['What to demote, test,', 'or watch again.'], metrics: common.medium },
        ],
      },
    ],
  },
  {
    file: 'ctrl.svg',
    id: 'ctrl',
    title: 'CTRL',
    subtitle: ['Operator cockpit.', 'Queues, gates, proof bundles.'],
    accent: '#35ff4f',
    accent2: '#e66a72',
    bg: ['#0b0d09', '#151914', '#24261d'],
    slides: [
      {
        phase: 'Triage',
        note: 'attention routed',
        title: 'CTRL routes work to the right human moment.',
        caption: ['The future surface turns noisy project state into a prioritized action table.'],
        status: 'QUEUE LIVE',
        footer: 'The operator sees what matters, why it matters, and what can wait.',
        nodes: [
          { label: 'event' },
          { label: 'priority', hot: true },
          { label: 'owner' },
          { label: 'next' },
        ],
        cards: [
          { kicker: 'single actions', title: 'Review table', lines: ['One row per action,', 'with proof context.'], metrics: common.long },
          { kicker: 'priority', title: 'Attention lane', lines: ['Severity, freshness,', 'and blocked status.'], metrics: common.short },
          { kicker: 'ownership', title: 'Human owner', lines: ['Who decides and', 'who executes.'], metrics: common.medium },
        ],
      },
      {
        phase: 'Act',
        note: 'gated commands',
        title: 'Commands carry runbooks and approval gates.',
        caption: ['A useful control panel makes the safe path faster than improvising.'],
        status: 'GATED ACTION',
        footer: 'High-consequence changes should be deliberate, logged, and reversible where possible.',
        nodes: [
          { label: 'runbook' },
          { label: 'approve', hot: true },
          { label: 'execute' },
          { label: 'verify' },
        ],
        cards: [
          { kicker: 'runbook', title: 'Procedure pane', lines: ['Steps, prerequisites,', 'rollback notes.'], metrics: common.medium },
          { kicker: 'approval', title: 'Gate state', lines: ['Who approved, when,', 'and under what scope.'], metrics: common.long },
          { kicker: 'verify', title: 'Result check', lines: ['Command output and', 'browser-visible proof.'], metrics: common.short },
        ],
      },
      {
        phase: 'Record',
        note: 'memory kept',
        title: 'The work leaves a durable operating record.',
        caption: ['Future CTRL keeps decisions, evidence, and maintenance notes attached to the project.'],
        status: 'PROOF BUNDLE',
        footer: 'The next operator should inherit context instead of rediscovering it.',
        nodes: [
          { label: 'proof' },
          { label: 'notes' },
          { label: 'status', hot: true },
          { label: 'memory' },
        ],
        cards: [
          { kicker: 'evidence', title: 'Proof bundle', lines: ['Screens, logs, links,', 'and changed files.'], metrics: common.short },
          { kicker: 'status', title: 'Current truth', lines: ['What is live, stale,', 'blocked, or risky.'], metrics: common.medium },
          { kicker: 'handoff', title: 'Next operator', lines: ['Concise context for', 'the next session.'], metrics: common.long },
        ],
      },
    ],
  },
  {
    file: 'telemetrybase.svg',
    id: 'telemetrybase',
    title: 'TelemetryBase',
    subtitle: ['Governed memory layer.', 'Sources, skills, freshness.'],
    accent: '#49d7c6',
    accent2: '#35ff4f',
    bg: ['#071311', '#101d1a', '#1d2516'],
    slides: [
      {
        phase: 'Ingest',
        note: 'sources in',
        title: 'Useful memory starts with source-backed intake.',
        caption: ['Docs, repo state, live checks, and conversations enter with provenance attached.'],
        status: 'SOURCE GRAPH',
        footer: 'Memory should know where it came from and when it might expire.',
        nodes: [
          { label: 'docs' },
          { label: 'repo', hot: true },
          { label: 'runtime' },
          { label: 'notes' },
        ],
        cards: [
          { kicker: 'documents', title: 'Source files', lines: ['Specs, docs, PDFs,', 'and project notes.'], metrics: common.long },
          { kicker: 'runtime', title: 'Live facts', lines: ['Deploys, checks,', 'status outputs.'], metrics: common.short },
          { kicker: 'conversation', title: 'Human context', lines: ['Decisions and', 'preference signals.'], metrics: common.medium },
        ],
      },
      {
        phase: 'Govern',
        note: 'trust scored',
        title: 'Freshness and permissions are product features.',
        caption: ['The future vision keeps access, stale facts, source confidence, and scope visible.'],
        status: 'ACCESS AWARE',
        footer: 'The system should distinguish known, guessed, stale, restricted, and verified.',
        nodes: [
          { label: 'scope' },
          { label: 'freshness', hot: true },
          { label: 'access' },
          { label: 'trust' },
        ],
        cards: [
          { kicker: 'freshness', title: 'Stale fact guard', lines: ['Dates, drift risk,', 'refresh prompts.'], metrics: common.medium },
          { kicker: 'permission', title: 'Access map', lines: ['Who can read, use,', 'or export context.'], metrics: common.long },
          { kicker: 'confidence', title: 'Truth state', lines: ['Verified, inferred,', 'or needs checking.'], metrics: common.short },
        ],
      },
      {
        phase: 'Reuse',
        note: 'work carries',
        title: 'Context becomes repeatable operating capability.',
        caption: ['Skills, handoff briefs, project memory, and retrieval paths are reusable assets.'],
        status: 'SKILL READY',
        footer: 'The point is less re-explaining, more continuity across real work.',
        nodes: [
          { label: 'retrieve' },
          { label: 'skill' },
          { label: 'brief', hot: true },
          { label: 'handoff' },
        ],
        cards: [
          { kicker: 'skills', title: 'Operating patterns', lines: ['Reusable workflows', 'with local standards.'], metrics: common.short },
          { kicker: 'briefs', title: 'Context packets', lines: ['Current state and', 'next best action.'], metrics: common.medium },
          { kicker: 'agents', title: 'Shared memory', lines: ['Enough context to', 'continue safely.'], metrics: common.long },
        ],
      },
    ],
  },
  {
    file: 'civdex.svg',
    id: 'civdex',
    title: 'CivDex',
    subtitle: ['Civic routing surface.', 'Sources, roles, careful exposure.'],
    accent: '#f2d35f',
    accent2: '#49d7c6',
    bg: ['#111109', '#1a1a12', '#17251f'],
    slides: [
      {
        phase: 'Source',
        note: 'official first',
        title: 'Civic data starts with cited public sources.',
        caption: ['The future view favors official pages, meeting records, notices, and clear freshness.'],
        status: 'CITED SOURCE',
        footer: 'Source links, dates, and jurisdiction boundaries matter more than volume.',
        nodes: [
          { label: 'page', hot: true },
          { label: 'record' },
          { label: 'date' },
          { label: 'scope' },
        ],
        cards: [
          { kicker: 'crawl', title: 'Official pages', lines: ['City, county, agency,', 'and board records.'], metrics: common.long },
          { kicker: 'meeting', title: 'Public context', lines: ['Agendas, minutes,', 'notices, packets.'], metrics: common.medium },
          { kicker: 'freshness', title: 'Date checks', lines: ['What changed and', 'when it changed.'], metrics: common.short },
        ],
      },
      {
        phase: 'Resolve',
        note: 'people to offices',
        title: 'Entity resolution must be careful, not creepy.',
        caption: ['The future product resolves offices, roles, districts, and routing without reckless exposure.'],
        status: 'CARE LAYER',
        footer: 'The line between navigation and targeting needs to stay visible.',
        nodes: [
          { label: 'office' },
          { label: 'role', hot: true },
          { label: 'district' },
          { label: 'route' },
        ],
        cards: [
          { kicker: 'offices', title: 'Role graph', lines: ['Office, term, scope,', 'and public channel.'], metrics: common.short },
          { kicker: 'routing', title: 'Jurisdiction path', lines: ['Which office is', 'actually responsible.'], metrics: common.long },
          { kicker: 'privacy', title: 'Exposure rules', lines: ['Suppress sensitive', 'or risky detail.'], metrics: common.medium },
        ],
      },
      {
        phase: 'Use',
        note: 'citizen useful',
        title: 'The output should help ordinary people act.',
        caption: ['Future CivDex turns public records into understandable paths, not raw dumps.'],
        status: 'PUBLIC GOOD',
        footer: 'A useful civic layer should be source-backed, humble, and hard to abuse.',
        nodes: [
          { label: 'question' },
          { label: 'office' },
          { label: 'message', hot: true },
          { label: 'followup' },
        ],
        cards: [
          { kicker: 'citizen path', title: 'Who to contact', lines: ['Plain-language route', 'with source citations.'], metrics: common.medium },
          { kicker: 'issue map', title: 'What to ask', lines: ['Known responsibilities', 'and open questions.'], metrics: common.short },
          { kicker: 'followup', title: 'Track response', lines: ['Dates, outcomes,', 'and next steps.'], metrics: common.long },
        ],
      },
    ],
  },
];

for (const screenshot of screenshots) {
  const svg = visionMockup(screenshot)
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trimEnd();
  writeFileSync(join(outDir, screenshot.file), `${svg}\n`);
}

console.log(`Generated ${screenshots.length} future-vision mockups in ${outDir}`);
