// LinkedIn Recruiter & Outsourcing Identifier - Content Script

// Tag categories: checked in order, first match wins
const TAG_CATEGORIES = [
  {
    id: 'recruiter',
    label: 'Recruiter',
    cssClass: 'lri-badge-recruiter',
    cardClass: 'lri-card-recruiter',
    keywords: [
      'recruiter', 'recruiting', 'recruitment',
      'talent acquisition', 'talent partner', 'talent scout', 'talent sourcer',
      'headhunter', 'head hunter',
      'staffing',
      'sourcer', 'sourcing specialist',
      'executive search',
      'human resources', 'hr director', 'hr manager', 'hr business partner', 'hr generalist',
      'people operations', 'people partner',
      'campus recruiter', 'technical recruiter', 'senior recruiter', 'lead recruiter',
      'hiring',
      'we\'re looking for', 'i\'m looking for',
      'open role', 'open position', 'job opportunity',
    ],
  },
  {
    id: 'outsourcing',
    label: 'Outsourcing',
    cssClass: 'lri-badge-outsourcing',
    cardClass: 'lri-card-outsourcing',
    keywords: [
      'outsourcing', 'outstaffing',
      'remote services', 'remote team', 'remote developers',
      'dedicated team', 'dedicated developers',
      'staff augmentation',
      'offshore', 'nearshore',
      'developers for hire',
      'development services',
      'it teams', 'it staff',
      'cloud solutions',
      'scale with',
      'scale smarter',
      'helping businesses scale',
      'helping startups scale',
      'helping enterprises scale',
      'helping companies scale',
      'solutions consultant',
      'web, mobile',
      'ai/ml',
      'llm development',
    ],
  },
];

/**
 * Finds the headline/title <p> inside a card whose class names are hashed.
 *
 * Rules (derived from inspecting the actual LinkedIn DOM):
 *   1. Skip <p> elements that contain <a> or <button> — those are names/CTAs.
 *   2. Skip <p> elements that contain [data-testid] descendants — those are message bodies.
 *   3. Require 5–300 chars of text — filters stubs and walls of text.
 *
 * Returns the first <p> that passes all three checks.
 */
function findTitleParagraph(card) {
  for (const p of card.querySelectorAll('p')) {
    if (p.querySelector('a, button')) continue;
    if (p.querySelector('[data-testid]')) continue;
    const text = p.textContent.trim();
    if (text.length >= 5 && text.length <= 300) return p;
  }
  return null;
}

/**
 * Collects ALL searchable text from a card: title + invitation message.
 * This catches people whose title doesn't signal clearly but whose
 * message reveals their intent.
 */
function getAllCardText(card) {
  const parts = [];
  for (const p of card.querySelectorAll('p')) {
    parts.push(p.textContent);
  }
  return parts.join(' ');
}

// Page configs: each entry drives one type of LinkedIn surface.
// getTitleEl(card) takes priority over titleSelector when class names are hashed.
const PAGE_CONFIGS = [
  // ── My Network ── invitation cards  (/mynetwork/)
  {
    cardSelector: '[role="listitem"][componentkey^="urn:li:invitation"]',
    getTitleEl: findTitleParagraph,
  },
  // ── My Network ── People You May Know / connection suggestion cards
  {
    cardSelector: '[role="listitem"][componentkey^="urn:li:member"]',
    getTitleEl: findTitleParagraph,
  },
  // ── My Network ── any other componentkey listitem (catch-all)
  {
    cardSelector: '[role="listitem"][componentkey]',
    getTitleEl: findTitleParagraph,
  },
  // ── Search results ── data-view-name is more stable than hashed class names
  {
    cardSelector: '[data-view-name="search-entity-result-universal-template"]',
    getTitleEl: findTitleParagraph,
  },
  // ── Search results ── older selector (fallback)
  {
    cardSelector: '.entity-result',
    titleSelector: '.entity-result__primary-subtitle',
  },
  // ── Feed ── post author block
  {
    cardSelector: '.update-components-actor',
    titleSelector: '.update-components-actor__description',
  },
  // ── Profile page ── top card
  {
    cardSelector: '.pv-top-card',
    titleSelector: '.text-body-medium.break-words',
  },
  // ── Profile page ── newer UI
  {
    cardSelector: '[data-view-name="profile-component-entity"]',
    getTitleEl: findTitleParagraph,
  },
  // ── Connections list ──
  {
    cardSelector: '.mn-connection-card',
    titleSelector: '.mn-connection-card__occupation',
  },
];

let isEnabled = true;

/**
 * Detect which category (if any) a piece of text matches.
 * Returns the first matching category object, or null.
 */
function detectCategory(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const cat of TAG_CATEGORIES) {
    if (cat.keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return null;
}

function createBadge(category) {
  const badge = document.createElement('span');
  badge.className = 'lri-badge ' + category.cssClass;
  badge.setAttribute('aria-label', category.label);
  badge.textContent = category.label;
  return badge;
}

function tagCard(card, titleEl) {
  if (card.dataset.lriTagged) return;
  card.dataset.lriTagged = 'true';

  // Check title first, then fall back to all card text
  const titleText = titleEl ? titleEl.textContent : '';
  const allText = getAllCardText(card);
  const category = detectCategory(titleText) || detectCategory(allText);

  if (!category) return;

  card.classList.add(category.cardClass);
  const target = titleEl || card;
  target.insertAdjacentElement('afterend', createBadge(category));
}

function processPage() {
  if (!isEnabled) return;

  // Disconnect while making DOM changes to prevent observer loop
  observer.disconnect();

  try {
    for (const config of PAGE_CONFIGS) {
      for (const card of document.querySelectorAll(config.cardSelector)) {
        if (card.dataset.lriTagged) continue;
        const titleEl = config.getTitleEl
          ? config.getTitleEl(card)
          : card.querySelector(config.titleSelector);
        tagCard(card, titleEl);
      }
    }
  } finally {
    if (isEnabled) startObserver();
  }
}

function removeAllTags() {
  document.querySelectorAll('.lri-badge').forEach((el) => el.remove());
  for (const cat of TAG_CATEGORIES) {
    document.querySelectorAll('.' + cat.cardClass).forEach((el) =>
      el.classList.remove(cat.cardClass)
    );
  }
  document.querySelectorAll('[data-lri-tagged]').forEach((el) => {
    delete el.dataset.lriTagged;
  });
}

// Debounced observer
let debounceTimer = null;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(processPage, 250);
});

function startObserver() {
  observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver() {
  observer.disconnect();
}

// Listen for toggle messages from the popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SET_ENABLED') {
    isEnabled = message.enabled;
    if (isEnabled) {
      processPage();
      startObserver();
    } else {
      stopObserver();
      removeAllTags();
    }
  }
});

// Initialize
chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  isEnabled = enabled;
  if (isEnabled) {
    processPage();
    startObserver();
  }
});
