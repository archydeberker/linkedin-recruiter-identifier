// LinkedIn Recruiter & Outsourcing Identifier - Popup Script
// NOTE: Keep these keyword lists in sync with TAG_CATEGORIES in content.js

const TAG_CATEGORIES = [
  {
    label: 'Recruiter',
    color: '#FF6B00',
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
      "we're looking for", "i'm looking for",
      'open role', 'open position', 'job opportunity',
    ],
  },
  {
    label: 'Outsourcing',
    color: '#8E44AD',
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

const toggle = document.getElementById('enableToggle');
const keywordsList = document.getElementById('keywordsList');

// Populate keywords grouped by category
TAG_CATEGORIES.forEach((cat) => {
  const header = document.createElement('div');
  header.style.cssText = `
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; color: ${cat.color}; margin-top: 6px; margin-bottom: 4px;
    width: 100%;
  `;
  header.textContent = cat.label;
  keywordsList.appendChild(header);

  cat.keywords.forEach((kw) => {
    const pill = document.createElement('span');
    pill.className = 'keyword-pill';
    pill.textContent = kw;
    keywordsList.appendChild(pill);
  });
});

// Load current state
chrome.storage.local.get({ enabled: true }, ({ enabled }) => {
  toggle.checked = enabled;
});

// Handle toggle
toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.local.set({ enabled });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'SET_ENABLED', enabled }).catch(() => {});
    }
  });
});
