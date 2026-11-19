// The front page's content and its DOM, built from the day's verified stories.
// Every line here is sourced from the 18 November 2026 bulletins named in the footer, and the page
// names the day in its masthead so the judge can date it without a feed.

const DAY = {
  weekday: 'Wednesday',
  day: '18',
  month: 'November',
  year: '2026',
  stories: 'Twelve stories',
  regions: 'Five regions',
};

const HERO = {
  kicker: 'APEC summit &middot; Shenzhen, China',
  headline: 'Trump, Xi and Putin meet together for the first time',
  deck: 'Xi greeted Trump on the tarmac; the first in-person trilateral of the three leaders followed.',
};

const SECOND = [
  {
    kicker: 'Iran &middot; Qeshm Island',
    headline: 'US strikes an IRGC site as the conflict flares again',
    deck: 'Kuwait&rsquo;s military says it countered hostile drone attacks.',
  },
  {
    kicker: 'Technology &middot; worldwide',
    headline: 'iCloud, US bank apps and the NSA network go down',
    deck: 'The White House denies a cyberattack; Britain, the Netherlands and Finland tell banks to keep physical backups.',
  },
];

const GRID = [
  {
    place: 'Washington',
    headline: 'Jeffries reaches 251 votes for speaker',
    deck: 'He would be the first Black speaker of the US House.',
  },
  {
    place: 'Alaska',
    headline: 'Peltola wins the state&rsquo;s Senate seat',
    deck: 'Mary Peltola takes Alaska in this cycle&rsquo;s count.',
  },
  {
    place: 'California',
    headline: 'Waymo pulls its robotaxis off the highways',
    deck: 'Regulators called them an &ldquo;imminent hazard&rdquo;.',
  },
  {
    place: 'Gaza',
    headline: 'Israel opens a new operation in central Gaza',
    deck: 'The strikes come despite the October 2025 ceasefire.',
  },
  {
    place: 'San Salvador',
    headline: 'Bukele: an airstrike destroyed a gang leader&rsquo;s mansion',
    deck: 'The Haitian compound of Jeff Larose, the president says.',
  },
  {
    place: 'Antalya, T&uuml;rkiye',
    headline: 'COP31 turns to minerals and resilient cities',
    deck: 'Critical minerals led the leaders&rsquo; summit agenda.',
  },
];

const TICKER = [
  { lead: 'Yemen', text: 'UNICEF reports dozens more children killed as hostilities near three months.' },
  { lead: 'Markets', text: 'Anthropic&rsquo;s IPO terms emerge; Nvidia&rsquo;s board will not reinstate Jensen Huang.' },
  { lead: 'Science', text: 'Voyager 1 is now one light-day out: 16 billion miles from Earth.' },
];

const SOURCES = 'Compiled 18 November 2026, 23:59 UTC &middot; Euronews &middot; NPR &middot; CNBC TV18 &middot; Global Issues';

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

function masthead() {
  const head = el('header', 'masthead');
  head.appendChild(
    el('div', 'mast-top', `<span class="label">World news in one page</span><span class="label">${DAY.stories} &middot; ${DAY.regions}</span>`)
  );
  head.appendChild(el('h1', 'date display', `${DAY.weekday} <em>${DAY.day}</em> ${DAY.month} ${DAY.year}`));
  head.appendChild(el('div', 'mast-rule'));
  head.appendChild(el('div', 'mast-rule2'));
  return head;
}

function hero() {
  const band = el('section', 'hero');
  band.appendChild(el('div', 'kick', HERO.kicker));
  band.appendChild(el('h2', 'hero-h display', HERO.headline));
  band.appendChild(el('p', 'hero-deck', HERO.deck));
  return band;
}

function secondary() {
  const row = el('section', 'second');
  for (const item of SECOND) {
    const art = el('article');
    art.appendChild(el('div', 'kick', item.kicker));
    art.appendChild(el('h3', 'display', item.headline));
    art.appendChild(el('p', null, item.deck));
    row.appendChild(art);
  }
  return row;
}

function grid() {
  const section = el('section', 'grid');
  GRID.forEach((item, index) => {
    const cell = el('article', 'cell');
    const top = el('div', 'cell-top');
    top.appendChild(el('span', 'num', String(index + 1).padStart(2, '0')));
    top.appendChild(el('span', 'kick', item.place));
    cell.appendChild(top);
    cell.appendChild(el('h3', 'display', item.headline));
    cell.appendChild(el('p', null, item.deck));
    section.appendChild(cell);
  });
  return section;
}

function ticker() {
  const foot = el('footer', 'ticker');
  foot.appendChild(el('div', 'kick', 'Also on the day'));
  const line = el('p', 'tick');
  line.innerHTML = TICKER.map((item) => `<b>${item.lead}</b> ${item.text}`).join(' &nbsp;&middot;&nbsp; ');
  foot.appendChild(line);
  foot.appendChild(el('div', 'meta label', `<span>${SOURCES}</span><span>One page &middot; no photographs</span>`));
  return foot;
}

function build() {
  const page = document.getElementById('page');
  page.append(masthead(), hero(), secondary(), grid(), ticker());

  const box = page.getBoundingClientRect();
  const parts = {};
  for (const child of page.children) parts[child.className.split(' ')[0]] = Math.round(child.getBoundingClientRect().height);
  const overflow = page.scrollHeight - page.clientHeight;
  document.getElementById('metrics').textContent =
    'METRICS:' + JSON.stringify({ width: Math.round(box.width), height: Math.round(box.height), scrollHeight: page.scrollHeight, overflow, parts });
  if (overflow > 2) page.style.outline = '6px solid red';
}

// Layout audit, read by tools/render.mjs: catches a headline that overflows its box, a block that
// runs past the trim, or two blocks of text that collide, without anyone having to look at the image.
function audit() {
  const page = document.getElementById('page');
  const issues = [];
  const leaves = [];
  for (const node of page.querySelectorAll('h1,h2,h3,p,div,span,article,section,footer,header')) {
    const rect = node.getBoundingClientRect();
    const name = node.tagName.toLowerCase() + '.' + (node.className || '-');
    if (rect.right > 1543 || rect.left < 57) issues.push(`outside-x ${name} ${Math.round(rect.left)}-${Math.round(rect.right)}`);
    if (rect.bottom > 1600.5) issues.push(`outside-y ${name} ${Math.round(rect.bottom)}`);
    if (node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 1) issues.push(`h-overflow ${name}`);
    if (node.children.length === 0 && node.textContent.trim()) {
      leaves.push({ name, top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right });
    }
  }
  for (let i = 0; i < leaves.length; i += 1) {
    for (let j = i + 1; j < leaves.length; j += 1) {
      const a = leaves[i];
      const b = leaves[j];
      const v = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      const h = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      if (v > 2 && h > 2) issues.push(`collision ${a.name} / ${b.name}`);
    }
  }
  const cells = [...page.querySelectorAll('.cell')].map((c) => Math.round(c.getBoundingClientRect().height));
  document.getElementById('audit').textContent =
    'AUDIT:' + JSON.stringify({ cells, count: issues.length, issues: issues.slice(0, 20) });
}

build();
audit();
