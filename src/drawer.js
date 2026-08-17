import { getChannelEPG, isEpgReady } from './epg.js';

let allChannelsList = [];
let groupedChannelsMap = {};
let categoryKeys = [];

let currentCategoryIndex = 0;
let currentChannelIndex = 0;
let isSearchInputActive = false;
let searchQuery = '';

export const DEFAULT_TV_ICON_SVG = `
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
    <polyline points="17 2 12 7 7 2"></polyline>
  </svg>
`;

function padZero(num) {
  return num < 10 ? '0' + num : '' + num;
}

export function initDrawerState(data) {
  allChannelsList = data.allChannels || [];
  groupedChannelsMap = data.groupedChannels || {};
  categoryKeys = data.categoryList || [];
  currentCategoryIndex = 0;
  currentChannelIndex = 0;
  searchQuery = '';
  isSearchInputActive = false;
}

export function updateWindowsClock() {
  const timeEl = document.getElementById('win-time-display');
  const dateEl = document.getElementById('win-date-display');
  if (!timeEl || !dateEl) return;

  const now = new Date();
  const hours = padZero(now.getHours());
  const minutes = padZero(now.getMinutes());
  const seconds = padZero(now.getSeconds());

  const day = padZero(now.getDate());
  const month = padZero(now.getMonth() + 1);
  const year = now.getFullYear();

  timeEl.textContent = `${hours}:${minutes}:${seconds}`;
  dateEl.textContent = `${day}-${month}-${year}`;
}

export function getCurrentCategories() {
  return categoryKeys;
}

export function getCurrentCategoryIndex() {
  return currentCategoryIndex;
}

export function setCurrentCategoryIndex(idx) {
  if (categoryKeys.length === 0) return;
  currentCategoryIndex = Math.max(0, Math.min(idx, categoryKeys.length - 1));
  currentChannelIndex = 0;
}

export function nextCategory() {
  if (categoryKeys.length === 0) return;
  currentCategoryIndex = (currentCategoryIndex + 1) % categoryKeys.length;
  currentChannelIndex = 0;
  renderCategories();
  renderChannels();
}

export function prevCategory() {
  if (categoryKeys.length === 0) return;
  currentCategoryIndex = (currentCategoryIndex - 1 + categoryKeys.length) % categoryKeys.length;
  currentChannelIndex = 0;
  renderCategories();
  renderChannels();
}

export function getCurrentChannels() {
  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    return allChannelsList.filter(ch => ch.name.toLowerCase().includes(q));
  }
  const currentKey = categoryKeys[currentCategoryIndex];
  return groupedChannelsMap[currentKey] || [];
}

export function getCurrentChannelIndex() {
  return currentChannelIndex;
}

export function setCurrentChannelIndex(idx) {
  const chs = getCurrentChannels();
  if (chs.length === 0) {
    currentChannelIndex = 0;
    return;
  }
  currentChannelIndex = Math.max(0, Math.min(idx, chs.length - 1));
  updateChannelFocusVisual();
}

export function getCurrentSelectedChannel() {
  const chs = getCurrentChannels();
  if (chs.length === 0) return null;
  return chs[currentChannelIndex] || null;
}

export function nextChannel() {
  const chs = getCurrentChannels();
  if (chs.length === 0) return;
  if (currentChannelIndex < chs.length - 1) {
    currentChannelIndex++;
    updateChannelFocusVisual();
  }
}

export function prevChannel() {
  const chs = getCurrentChannels();
  if (chs.length === 0) return;
  if (currentChannelIndex > 0) {
    currentChannelIndex--;
    updateChannelFocusVisual();
  }
}

export function isSearchFocused() {
  return isSearchInputActive;
}

export function focusSearchInput() {
  isSearchInputActive = true;
  const input = document.getElementById('channel-search-input');
  const box = document.querySelector('.search-input-box');
  if (input) {
    input.focus();
  }
  if (box) {
    box.classList.add('focused');
  }
  updateChannelFocusVisual();
}

export function blurSearchInput() {
  isSearchInputActive = false;
  const input = document.getElementById('channel-search-input');
  const box = document.querySelector('.search-input-box');
  if (input) {
    input.blur();
  }
  if (box) {
    box.classList.remove('focused');
  }
  updateChannelFocusVisual();
}

export function getSearchQuery() {
  return searchQuery;
}

export function setSearchQuery(q) {
  searchQuery = q || '';
  currentChannelIndex = 0;
  renderChannels();
}

export function clearSearch() {
  searchQuery = '';
  const input = document.getElementById('channel-search-input');
  if (input) input.value = '';
  currentChannelIndex = 0;
  renderChannels();
}

function safeScrollIntoView(el) {
  if (!el) return;
  try {
    if (typeof el.scrollIntoViewIfNeeded === 'function') {
      el.scrollIntoViewIfNeeded(false);
    } else {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  } catch (e) {
    try {
      el.scrollIntoView(false);
    } catch (err) {}
  }
}

function updateChannelFocusVisual() {
  const items = document.querySelectorAll('.channel-row-item');
  items.forEach((it, idx) => {
    if (idx === currentChannelIndex && !isSearchInputActive) {
      it.classList.add('focused');
      safeScrollIntoView(it);
    } else {
      it.classList.remove('focused');
    }
  });
}

export function renderCategories() {
  const nav = document.getElementById('category-nav-bar');
  if (!nav) return;

  nav.innerHTML = '';
  categoryKeys.forEach((catName, idx) => {
    const chip = document.createElement('div');
    chip.className = `cat-chip ${idx === currentCategoryIndex ? 'active' : ''}`;
    chip.textContent = catName;
    chip.onclick = (e) => {
      e.stopPropagation();
      currentCategoryIndex = idx;
      currentChannelIndex = 0;
      renderCategories();
      renderChannels();
    };
    nav.appendChild(chip);
  });

  const activeChip = nav.querySelector('.cat-chip.active');
  if (activeChip) {
    safeScrollIntoView(activeChip);
  }
}

export function renderChannels() {
  const list = document.getElementById('drawer-channel-list');
  if (!list) return;

  const channels = getCurrentChannels();
  list.innerHTML = '';

  if (channels.length === 0) {
    list.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: #64748b; font-size: 14px; font-weight: 600;">
        Không tìm thấy kênh phù hợp
      </div>
    `;
    return;
  }

  const epgReady = isEpgReady();

  channels.forEach((ch, idx) => {
    const row = document.createElement('div');
    const isFoc = (idx === currentChannelIndex && !isSearchInputActive);
    row.className = `channel-row-item ${isFoc ? 'focused' : ''}`;

    const hasLogo = (ch.logo && typeof ch.logo === 'string' && ch.logo.trim().length > 0);
    const logoImgHtml = hasLogo
      ? `<img class="ch-logo-img" src="${ch.logo}" alt="" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';" />`
      : '';
    const fallbackStyle = hasLogo ? 'display:none;' : 'display:flex;';

    const epg = getChannelEPG(ch.name);
    let contentHtml = '';

    if (epg && epg.current && epg.current.title) {
      contentHtml = `
        <div class="ch-name-orange">${ch.name}</div>
        <div class="ch-program-gray">${epg.current.title}</div>
        <div class="ch-timeline-row">
          <span class="ch-time-text">${epg.current.startTimeStr}</span>
          <div class="ch-timeline-bar-bg">
            <div class="ch-timeline-bar-fill" style="width: ${epg.current.progressPercent}%;"></div>
          </div>
          <span class="ch-time-text">${epg.current.stopTimeStr}</span>
        </div>
      `;
    } else if (!epgReady) {
      contentHtml = `
        <div class="ch-name-orange">${ch.name}</div>
        <div class="skeleton-box skeleton-title"></div>
        <div class="skeleton-box skeleton-timeline"></div>
      `;
    } else {
      contentHtml = `
        <div class="ch-name-plain">${ch.name}</div>
      `;
    }

    row.innerHTML = `
      <div class="ch-logo-container">
        ${logoImgHtml}
        <div class="ch-logo-fallback" style="${fallbackStyle}">
          ${DEFAULT_TV_ICON_SVG}
        </div>
      </div>
      <div class="ch-content-col">
        ${contentHtml}
      </div>
    `;

    row.onclick = (e) => {
      e.stopPropagation();
      currentChannelIndex = idx;
      updateChannelFocusVisual();
      if (window._onPlayChannelDirect) {
        window._onPlayChannelDirect(ch);
      }
    };

    list.appendChild(row);
  });

  const focusedRow = list.querySelector('.channel-row-item.focused');
  if (focusedRow) {
    safeScrollIntoView(focusedRow);
  }
}
