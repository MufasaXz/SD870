/**
 * device.js
 * Handles release data fetching, rendering, and tab switching
 * for all device pages (/pipa/, /lemonade/, etc.)
 */

// ─── Detect current device from URL ───────────────────────────────────────────
const DEVICE = (() => {
  const path = window.location.pathname;
  const match = path.match(/\/([a-z]+)\/index\.html$/) || path.match(/\/([a-z]+)\/$/);
  return match ? match[1] : null;
})();

// Resolve base path relative to current page location
const BASE_PATH = '../assets/';

// ─── Fetch JSON data ───────────────────────────────────────────────────────────
async function fetchReleases(type) {
  try {
    const res = await fetch(`${BASE_PATH}${DEVICE}/${type}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[device.js] Failed to load ${type}.json:`, err.message);
    return [];
  }
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────
function statusBadge(status) {
  const cls = status === 'Official' ? 'badge-official' : 'badge-unofficial';
  return `<span class="rel-badge ${cls}">${status}</span>`;
}

function typeBadge(type) {
  return `<span class="rel-badge badge-type">${type}</span>`;
}

function androidBadge(ver) {
  return `<span class="rel-android">A${ver}</span>`;
}

function dirtyFlashBadge(df) {
  if (df === null || df === undefined) {
    return ''; // N/A for recoveries — don't show anything
  }
  return df
    ? `<span class="rel-badge badge-ok">Dirty ✓</span>`
    : `<span class="rel-badge badge-warn">Clean only</span>`;
}

// ─── Date formatting ───────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Render single release row ─────────────────────────────────────────────────
function renderRow(entry) {
  const links = entry.links || {};
  const hasDownload = !!links.download;
  const hasMirror   = !!links.mirror;
  const hasSupport  = !!links.support;

  const downloadBtn = hasDownload
    ? `<a href="${links.download}" target="_blank" rel="noopener" class="rel-btn rel-btn-primary">
         <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
         </svg>
         Download
       </a>`
    : `<span class="rel-btn rel-btn-disabled">No link yet</span>`;

  const mirrorBtn = hasMirror
    ? `<a href="${links.mirror}" target="_blank" rel="noopener" class="rel-btn">Mirror</a>`
    : '';

  const supportBtn = hasSupport
    ? `<a href="${links.support}" target="_blank" rel="noopener" class="rel-btn">Support</a>`
    : '';

  const notes = entry.notes
    ? `<p class="rel-notes">${entry.notes}</p>`
    : '';

  return `
    <div class="rel-row">
      <div class="rel-main">

        <div class="rel-name-col">
          <span class="rel-name">${entry.name}</span>
          ${notes}
        </div>

        <div class="rel-meta-col">
          ${androidBadge(entry.android)}
          ${statusBadge(entry.status)}
          ${typeBadge(entry.type)}
          ${dirtyFlashBadge(entry.dirty_flash)}
        </div>

        <div class="rel-date-col">
          <span class="rel-date">${formatDate(entry.updated)}</span>
          <span class="rel-maintainer">by ${entry.maintainer?.name || '—'}</span>
        </div>

        <div class="rel-actions-col">
          ${downloadBtn}
          ${mirrorBtn}
          ${supportBtn}
        </div>

      </div>
    </div>
  `;
}

// ─── Render empty state ────────────────────────────────────────────────────────
function renderEmpty(type) {
  return `
    <div class="rel-empty">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.3;margin-bottom:12px">
        <rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/>
      </svg>
      <p>No ${type} listed yet</p>
    </div>
  `;
}

// ─── Render loading skeleton ───────────────────────────────────────────────────
function renderSkeleton() {
  return `
    <div class="rel-list rel-skeleton">
      ${[1,2].map(() => `
        <div class="rel-row">
          <div class="rel-main">
            <div class="rel-name-col"><div class="skel-line skel-name"></div><div class="skel-line skel-note"></div></div>
            <div class="rel-meta-col"><div class="skel-pill"></div><div class="skel-pill"></div><div class="skel-pill"></div></div>
            <div class="rel-date-col"><div class="skel-line skel-date"></div><div class="skel-line skel-maint"></div></div>
            <div class="rel-actions-col"><div class="skel-btn"></div></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── Render list ───────────────────────────────────────────────────────────────
function renderList(entries, type) {
  if (!entries.length) return renderEmpty(type);
  return `<div class="rel-list">${entries.map(renderRow).join('')}</div>`;
}

// ─── Tab management ────────────────────────────────────────────────────────────
const cache = {};

async function activateTab(tabName) {
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.releases-placeholder');

  tabBtns.forEach(b => b.classList.remove('active'));
  tabPanels.forEach(p => p.classList.remove('active'));

  const activeBtn   = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  const activePanel = document.getElementById(`tab-${tabName}`);
  if (!activeBtn || !activePanel) return;

  activeBtn.classList.add('active');
  activePanel.classList.add('active');

  // Show skeleton while loading
  if (!cache[tabName]) {
    activePanel.innerHTML = renderSkeleton();
    cache[tabName] = await fetchReleases(tabName);
  }

  activePanel.innerHTML = renderList(cache[tabName], tabName);
}

// ─── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  if (!DEVICE) return;

  // Wire up tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  // Load default tab (roms)
  await activateTab('roms');
}

document.addEventListener('DOMContentLoaded', init);
