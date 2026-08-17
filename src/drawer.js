import { getChannelEPG, isEpgReady } from './epg.js';

var allChannelsList = [];
var groupedChannelsMap = {};
var categoryKeys = [];

var currentCategoryIndex = 0;
var currentChannelIndex = 0;
var isSearchInputActive = false;
var searchQuery = '';
var onPlayChannelCallback = null;

var DEFAULT_TV_ICON_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>';

function padZero(num) {
  return num < 10 ? '0' + num : '' + num;
}

export function initDrawerState(data, playCallback) {
  allChannelsList = data.allChannels || [];
  groupedChannelsMap = data.groupedChannels || {};
  categoryKeys = data.categoryList || [];
  currentCategoryIndex = 0;
  currentChannelIndex = 0;
  searchQuery = '';
  isSearchInputActive = false;
  onPlayChannelCallback = playCallback || null;
}

export function updateWindowsClock() {
  var timeEl = document.getElementById('drawer-time');
  var dateEl = document.getElementById('drawer-date');
  if (!timeEl || !dateEl) return;

  var now = new Date();
  var hours = padZero(now.getHours());
  var minutes = padZero(now.getMinutes());
  var seconds = padZero(now.getSeconds());

  var day = padZero(now.getDate());
  var month = padZero(now.getMonth() + 1);
  var year = now.getFullYear();

  timeEl.textContent = hours + ':' + minutes + ':' + seconds;
  dateEl.textContent = day + '-' + month + '-' + year;
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
    var q = searchQuery.toLowerCase().trim();
    return allChannelsList.filter(function(ch) { return ch.name.toLowerCase().indexOf(q) !== -1; });
  }
  var currentKey = categoryKeys[currentCategoryIndex];
  return groupedChannelsMap[currentKey] || [];
}

export function getCurrentChannelIndex() {
  return currentChannelIndex;
}

export function setCurrentChannelIndex(idx) {
  var chs = getCurrentChannels();
  if (chs.length === 0) {
    currentChannelIndex = 0;
    return;
  }
  currentChannelIndex = Math.max(0, Math.min(idx, chs.length - 1));
  updateChannelFocusVisual();
}

export function getCurrentSelectedChannel() {
  var chs = getCurrentChannels();
  if (chs.length === 0) return null;
  return chs[currentChannelIndex] || null;
}

export function nextChannel() {
  var chs = getCurrentChannels();
  if (chs.length === 0) return;
  if (currentChannelIndex < chs.length - 1) {
    currentChannelIndex++;
    updateChannelFocusVisual();
  }
}

export function prevChannel() {
  var chs = getCurrentChannels();
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
  var input = document.getElementById('channel-search-input');
  var box = document.querySelector('.search-input-box');
  if (input) input.focus();
  if (box) box.classList.add('focused');
  updateChannelFocusVisual();
}

export function blurSearchInput() {
  isSearchInputActive = false;
  var input = document.getElementById('channel-search-input');
  var box = document.querySelector('.search-input-box');
  if (input) input.blur();
  if (box) box.classList.remove('focused');
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
  var input = document.getElementById('channel-search-input');
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
      el.scrollIntoView(false);
    }
  } catch (e) {}
}

function updateChannelFocusVisual() {
  var items = document.querySelectorAll('.channel-row-item');
  for (var i = 0; i < items.length; i++) {
    if (i === currentChannelIndex && !isSearchInputActive) {
      items[i].classList.add('focused');
      safeScrollIntoView(items[i]);
    } else {
      items[i].classList.remove('focused');
    }
  }
}

export function renderCategories() {
  var nav = document.getElementById('category-nav-bar');
  if (!nav) return;

  nav.innerHTML = '';
  for (var i = 0; i < categoryKeys.length; i++) {
    (function(idx) {
      var catName = categoryKeys[idx];
      var chip = document.createElement('div');
      chip.className = 'cat-chip' + (idx === currentCategoryIndex ? ' active' : '');
      chip.textContent = catName;
      chip.onclick = function(e) {
        e.stopPropagation();
        currentCategoryIndex = idx;
        currentChannelIndex = 0;
        renderCategories();
        renderChannels();
      };
      nav.appendChild(chip);
    })(i);
  }

  var activeChip = nav.querySelector('.cat-chip.active');
  if (activeChip) safeScrollIntoView(activeChip);
}

export function renderChannels() {
  var list = document.getElementById('drawer-channel-list');
  if (!list) return;

  var channels = getCurrentChannels();
  list.innerHTML = '';

  if (channels.length === 0) {
    list.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: #64748b; font-size: 16px; font-weight: 600;">Không tìm thấy kênh phù hợp</div>';
    return;
  }

  var epgReady = isEpgReady();

  for (var i = 0; i < channels.length; i++) {
    (function(idx) {
      var ch = channels[idx];
      var row = document.createElement('div');
      var isFoc = (idx === currentChannelIndex && !isSearchInputActive);
      row.className = 'channel-row-item' + (isFoc ? ' focused' : '');

      var hasLogo = (ch.logo && typeof ch.logo === 'string' && ch.logo.trim().length > 0);
      var logoImgHtml = hasLogo
        ? '<img class="ch-logo-img" src="' + ch.logo + '" alt="" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\';" />'
        : '';
      var fallbackStyle = hasLogo ? 'display:none;' : 'display:flex;';

      var epg = getChannelEPG(ch.name);
      var contentHtml = '';

      if (epg && epg.current && epg.current.title) {
        contentHtml = '<div class="ch-name-orange">' + ch.name + '</div>' +
          '<div class="ch-program-gray">' + epg.current.title + '</div>' +
          '<div class="ch-timeline-row">' +
            '<span class="ch-time-text">' + epg.current.startTimeStr + '</span>' +
            '<div class="ch-timeline-bar-bg"><div class="ch-timeline-bar-fill" style="width:' + epg.current.progressPercent + '%;"></div></div>' +
            '<span class="ch-time-text">' + epg.current.stopTimeStr + '</span>' +
          '</div>';
      } else if (!epgReady) {
        contentHtml = '<div class="ch-name-orange">' + ch.name + '</div>' +
          '<div class="skeleton-box skeleton-title"></div>' +
          '<div class="skeleton-box skeleton-timeline"></div>';
      } else {
        contentHtml = '<div class="ch-name-plain">' + ch.name + '</div>';
      }

      row.innerHTML = '<div class="ch-logo-container">' +
          logoImgHtml +
          '<div class="ch-logo-fallback" style="' + fallbackStyle + '">' + DEFAULT_TV_ICON_SVG + '</div>' +
        '</div>' +
        '<div class="ch-content-col">' + contentHtml + '</div>';

      row.onclick = function(e) {
        e.stopPropagation();
        currentChannelIndex = idx;
        updateChannelFocusVisual();
        if (onPlayChannelCallback) {
          onPlayChannelCallback(ch);
        }
      };

      list.appendChild(row);
    })(i);
  }

  var focusedRow = list.querySelector('.channel-row-item.focused');
  if (focusedRow) safeScrollIntoView(focusedRow);
}
