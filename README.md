# LinkedIn Recruiter & Outsourcing Identifier

A Chrome extension that adds colored badges to LinkedIn profiles, making it easy to spot recruiters and outsourcing pitches at a glance.

## Why

I get an enormous amount of inbound connections & messages from recruiters and outsourcing companies. These are always a waste of time, and increasingly crafty. This is an attempt to help spot and handle them efficiently!

## What it does

The extension scans LinkedIn pages for keywords in job titles and invitation messages, then tags matching profiles with a visible badge:

- **Recruiter** (orange) — people actively recruiting: recruiters, talent acquisition, hiring managers, and anyone with "hiring" in their headline or message
- **Outsourcing** (purple) — dev shops and agencies pitching services: staff augmentation, remote teams, "helping you scale", etc.

It works across:
- **My Network** — invitation cards and "People You May Know"
- **Search results** — people search
- **Feed** — post authors
- **Profile pages** — individual profiles
- **Connections list** — your existing connections

## Install from source

1. Clone this repo:
   ```
   git clone https://github.com/archydeberker/linkedin-recruiter-identifier.git
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **Load unpacked** and select the cloned directory

5. Navigate to LinkedIn — badges will appear automatically

## How it works

The extension injects a content script on `linkedin.com` that:

1. Uses a `MutationObserver` to watch for DOM changes (LinkedIn is a single-page app, so content loads dynamically)
2. Finds profile cards using stable DOM attributes (`role="listitem"`, `componentkey`, `data-view-name`) rather than LinkedIn's hashed CSS class names, which change frequently
3. Extracts the person's headline from `<p>` elements using structural heuristics (skipping names, CTAs, and message bodies)
4. Checks the headline and full card text against keyword lists for each category
5. Inserts a styled badge after the headline and adds a colored left border to the card

The observer is disconnected while badges are being inserted to prevent infinite mutation loops.

## Configuration

Click the extension icon in Chrome's toolbar to toggle highlighting on/off. The popup also shows the keyword lists for each category.

## Customizing keywords

Edit the `TAG_CATEGORIES` array at the top of `content.js` to add or remove keywords:

```javascript
const TAG_CATEGORIES = [
  {
    id: 'recruiter',
    label: 'Recruiter',
    cssClass: 'lri-badge-recruiter',
    cardClass: 'lri-card-recruiter',
    keywords: ['recruiter', 'hiring', ...],
  },
  {
    id: 'outsourcing',
    label: 'Outsourcing',
    cssClass: 'lri-badge-outsourcing',
    cardClass: 'lri-card-outsourcing',
    keywords: ['outsourcing', 'staff augmentation', ...],
  },
];
```

To add a new category, add another entry with a unique `id`, `cssClass`, and `cardClass`, then add matching styles in `styles.css`.

## Known limitations

- LinkedIn occasionally changes their DOM structure. The extension uses resilient selectors (ARIA roles, `componentkey` attributes) but may need updates if LinkedIn does a major redesign.
- Keyword matching is substring-based — "hiring" will match "hiring manager" but also "admiring". This is generally fine for LinkedIn headlines but could produce occasional false positives.
- The extension only runs on `linkedin.com`. It does not collect, store, or transmit any data.

## License

MIT
