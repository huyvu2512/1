import { getChannelEPG, isEpgReady } from './epg.js';

let categoryList = [];
let groupedChannels = {};
let allChannelsList = [];
let currentCategoryIndex = 0;
let currentChannelIndex = 0;
let onSelectChannelCallback = null;
let searchQuery = '';
let isSearchInputActive = false;

const DEFAULT_TV_ICON_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`;

function padZero(num) {
  return num < 10 ? '0' + num : '' + num;
}

function removeVietnameseTones(str) {
  if (!str) return '';
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|Ỵ|Ỷ|Ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str;
}

function safeScrollIntoView(el, alignBottom) {
  if (!el) return;
  try {
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView(alignBottom !== undefined ? alignBottom : false);
    }
  } catch (e) {}
}

export function initDrawerState(data, onSelect) {
  categoryList = data.categoryList || [];
  groupedChannels = data.groupedChannels || {};
  allChannelsList = data.allChannels || [];
  onSelectChannelCallback = onSelect;

  setupSearchBoxListeners();
}

function setupSearchBoxListeners() {
  const searchInput = document.getElementById('channel-search-input');
  const searchBox = document.getElementById('drawer-search-box');
  const clearBtn = document.getElementById('search-clear-btn');

  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    searchQuery = (e.target.value || '').trim();
    if (clearBtn) {
      clearBtn.style.display = searchQuery.length > 0 ? 'flex' : 'none';
    }
    currentChannelIndex = 0;
    renderCategories();
    renderChannels();
  });

  searchInput.addEventListener('focus', () => {
    isSearchInputActive = true;
    if (searchBox) searchBox.classList.add('focused');
    updateFocus();
  });

  searchInput.addEventListener('blur', () => {
    isSearchInputActive = false;
    if (searchBox) searchBox.classList.remove('focused');
    updateFocus();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearSearch();
    });
  }
}

export function isSearchFocused() {
  return isSearchInputActive;
}

export function focusSearchInput() {
  const searchInput = document.getElementById('channel-search-input');
  if (searchInput) {
    searchInput.focus();
  }
}

export function blurSearchInput() {
  const searchInput = document.getElementById('channel-search-input');
  if (searchInput) {
    searchInput.blur();
  }
  isSearchInputActive = false;
  const searchBox = document.getElementById('drawer-search-box');
  if (searchBox) searchBox.classList.remove('focused');
}

export function clearSearch() {
  searchQuery = '';
  const searchInput = document.getElementById('channel-search-input');
  if (searchInput) {
    searchInput.value = '';
    searchInput.blur();
  }
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) clearBtn.style.display = 'none';

  isSearchInputActive = false;
  const searchBox = document.getElementById('drawer-search-box');
  if (searchBox) searchBox.classList.remove('focused');

  currentCategoryIndex = 0;
  currentChannelIndex = 0;
  renderCategories();
  renderChannels();
}

export function getSearchQuery() {
  return searchQuery;
}

export function getCurrentCategoryIndex() {
  return currentCategoryIndex;
}

export function getCurrentChannelIndex() {
  return currentChannelIndex;
}

export function setCurrentChannelIndex(idx) {
  currentChannelIndex = idx;
}

export function getCurrentChannels() {
  if (searchQuery) {
    const q = removeVietnameseTones(searchQuery.toLowerCase());
    return allChannelsList.filter(ch => {
      const name = removeVietnameseTones((ch.name || '').toLowerCase());
      const grp = removeVietnameseTones((ch.group || '').toLowerCase());
      return name.includes(q) || grp.includes(q);
    });
  }
  if (categoryList.length === 0) return [];
  const curCat = categoryList[currentCategoryIndex];
  return groupedChannels[curCat] || [];
}

export function getCurrentSelectedChannel() {
  const channels = getCurrentChannels();
  return channels[currentChannelIndex] || null;
}

export function nextCategory() {
  if (searchQuery) return;
  if (currentCategoryIndex < categoryList.length - 1) {
    currentCategoryIndex++;
    currentChannelIndex = 0;
    renderCategories();
    renderChannels();
  }
}

export function prevCategory() {
  if (searchQuery) return;
  if (currentCategoryIndex > 0) {
    currentCategoryIndex--;
    currentChannelIndex = 0;
    renderCategories();
    renderChannels();
  }
}

export function nextChannel() {
  const channels = getCurrentChannels();
  if (currentChannelIndex < channels.length - 1) {
    currentChannelIndex++;
    updateFocus();
  }
}

export function prevChannel() {
  if (currentChannelIndex > 0) {
    currentChannelIndex--;
    updateFocus();
  } else if (currentChannelIndex === 0) {
    focusSearchInput();
  }
}

export function renderCategories() {
  const nav = document.getElementById('category-nav-bar');
  if (!nav) return;
  nav.innerHTML = '';

  if (searchQuery) {
    const channels = getCurrentChannels();
    const chip = document.createElement('div');
    chip.className = 'cat-chip active';
    chip.textContent = `Kết quả: ${channels.length} kênh`;
    nav.appendChild(chip);
    return;
  }

  categoryList.forEach((cat, idx) => {
    const chip = document.createElement('div');
    chip.className = `cat-chip ${idx === currentCategoryIndex ? 'active' : ''}`;
    chip.textContent = cat;

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
      <div style="padding: 40px 20px; text-align: center; color: #64748b; font-size: 13.5px; font-weight: 600;">
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

    if (!epgReady) {
      contentHtml = `
        <div class="ch-name-orange">${ch.name}</div>
        <div class="skeleton-box skeleton-title"></div>
        <div class="skeleton-box skeleton-timeline"></div>
      `;
    } else if (epg && epg.current && epg.current.title) {
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
      blurSearchInput();
      currentChannelIndex = idx;
      updateFocus();
      if (onSelectChannelCallback) onSelectChannelCallback(ch);
    };

    list.appendChild(row);
  });

  updateFocus();
}

export function updateFocus() {
  const items = document.querySelectorAll('.channel-row-item');
  items.forEach((it, idx) => {
    const isFoc = (idx === currentChannelIndex && !isSearchInputActive);
    it.classList.toggle('focused', isFoc);
    if (isFoc) {
      safeScrollIntoView(it);
    }
  });
}

export function updateWindowsClock() {
  try {
    const now = new Date();
    const timeEl = document.getElementById('drawer-time');
    const dateEl = document.getElementById('drawer-date');
    if (timeEl && dateEl) {
      const hh = padZero(now.getHours());
      const mm = padZero(now.getMinutes());
      const ss = padZero(now.getSeconds());
      timeEl.innerText = `${hh}:${mm}:${ss}`;

      const dd = padZero(now.getDate());
      const month = padZero(now.getMonth() + 1);
      const yyyy = now.getFullYear();
      dateEl.innerText = `${dd}-${month}-${yyyy}`;
    }
  } catch (e) {}
}
