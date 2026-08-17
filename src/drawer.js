import { getChannelEPG, isEpgReady } from './epg.js';

var allChannelsList = [];
var groupedChannelsMap = {};
var categoryKeys = [];

var currentCategoryIndex = 0;
var currentChannelIndex = 0;
var isSearchBoxActive = false;
var isSearchInputEditing = false;
var searchQuery = '';
var onPlayChannelCallback = null;
var lastFocusedItem = null;

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
  isSearchBoxActive = false;
  isSearchInputEditing = false;
  onPlayChannelCallback = playCallback || null;
  lastFocusedItem = null;

  setupSearchInputEvents();
}

function setupSearchInputEvents() {
  var input = document.getElementById('channel-search-input');
  var clearBtn = document.getElementById('search-clear-btn');
  if (input) {
    input.oninput = function() {
      setSearchQuery(input.value);
      if (clearBtn) {
        clearBtn.style.display = input.value.length > 0 ? 'flex' : 'none';
      }
    };
  }
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

  var timeStr = hours + ':' + minutes + ':' + seconds;
  var dateStr = day + '/' + month + '/' + year;

  timeEl.innerHTML = timeStr;
  dateEl.innerHTML = dateStr;
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
  isSearchBoxActive = false;
}

export function nextCategory() {
  if (categoryKeys.length === 0) return;
  currentCategoryIndex = (currentCategoryIndex + 1) % categoryKeys.length;
  currentChannelIndex = 0;
  isSearchBoxActive = false;
  renderCategories();
  renderChannels();
}

export function prevCategory() {
  if (categoryKeys.length === 0) return;
  currentCategoryIndex = (currentCategoryIndex - 1 + categoryKeys.length) % categoryKeys.length;
  currentChannelIndex = 0;
  isSearchBoxActive = false;
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
  isSearchBoxActive = false;
  updateChannelFocusVisual();
}

export function getCurrentSelectedChannel() {
  var chs = getCurrentChannels();
  if (chs.length === 0) return null;
  return chs[currentChannelIndex] || null;
}

export function nextChannel() {
  if (isSearchBoxActive) {
    // Từ ô tìm kiếm bấm xuống -> Nhảy vào kênh đầu tiên
    isSearchBoxActive = false;
    currentChannelIndex = 0;
    updateSearchBoxFocusVisual();
    updateChannelFocusVisual();
    return;
  }

  var chs = getCurrentChannels();
  if (chs.length === 0) return;
  if (currentChannelIndex < chs.length - 1) {
    currentChannelIndex++;
    updateChannelFocusVisual();
  }
}

export function prevChannel() {
  if (isSearchBoxActive) return;

  if (currentChannelIndex === 0) {
    // Đang ở kênh đầu tiên bấm lên -> Nhảy thẳng lên ô Tìm kiếm
    focusSearchBox();
    return;
  }

  if (currentChannelIndex > 0) {
    currentChannelIndex--;
    updateChannelFocusVisual();
  }
}

// Focus vào ô tìm kiếm (chỉ viền sáng, chưa mở bàn phím)
export function isSearchBoxFocused() {
  return isSearchBoxActive;
}

export function focusSearchBox() {
  isSearchBoxActive = true;
  isSearchInputEditing = false;
  updateSearchBoxFocusVisual();
  updateChannelFocusVisual();
}

export function blurSearchBox() {
  isSearchBoxActive = false;
  isSearchInputEditing = false;
  var input = document.getElementById('channel-search-input');
  if (input) input.blur();
  updateSearchBoxFocusVisual();
  updateChannelFocusVisual();
}

// Người dùng ấn OK trên ô tìm kiếm -> Mới mở bàn phím ảo
export function isSearchEditing() {
  return isSearchInputEditing;
}

export function startSearchEditing() {
  isSearchBoxActive = true;
  isSearchInputEditing = true;
  var input = document.getElementById('channel-search-input');
  if (input) {
    input.focus();
  }
  updateSearchBoxFocusVisual();
}

export function stopSearchEditing() {
  isSearchInputEditing = false;
  var input = document.getElementById('channel-search-input');
  if (input) input.blur();
  updateSearchBoxFocusVisual();
}

function updateSearchBoxFocusVisual() {
  var box = document.getElementById('drawer-search-box');
  if (!box) return;
  if (isSearchBoxActive) {
    box.classList.add('focused');
  } else {
    box.classList.remove('focused');
  }
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
  var clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) clearBtn.style.display = 'none';
  currentChannelIndex = 0;
  renderChannels();
}

function safeScrollIntoView(el) {
  if (!el) return;
  var container = document.getElementById('drawer-channel-list');
  if (container && container.contains(el)) {
    try {
      var cRect = container.getBoundingClientRect();
      var iRect = el.getBoundingClientRect();
      var diff = (iRect.top + iRect.height / 2) - (cRect.top + cRect.height / 2);
      container.scrollTop += diff;
    } catch (e) {
      var elTop = el.offsetTop;
      var elHeight = el.offsetHeight;
      var containerHeight = container.clientHeight;
      var targetScroll = elTop - (containerHeight / 2) + (elHeight / 2);
      if (targetScroll < 0) targetScroll = 0;
      container.scrollTop = targetScroll;
    }
  } else {
    try {
      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    } catch (e) {
      try { el.scrollIntoView(false); } catch(err) {}
    }
  }
}

function updateChannelFocusVisual() {
  var list = document.getElementById('drawer-channel-list');
  if (!list) return;
  var items = list.children;

  if (lastFocusedItem) {
    lastFocusedItem.classList.remove('focused');
  }

  if (isSearchBoxActive) {
    return; // Khi ô tìm kiếm đang focus thì danh sách kênh không sáng
  }

  if (currentChannelIndex >= 0 && currentChannelIndex < items.length) {
    var cur = items[currentChannelIndex];
    if (cur) {
      cur.classList.add('focused');
      safeScrollIntoView(cur);
      lastFocusedItem = cur;
    }
  }
}

export function renderCategories() {
  var nav = document.getElementById('category-nav-bar');
  if (!nav) return;

  var chips = nav.querySelectorAll('.cat-chip');
  if (chips.length === categoryKeys.length && chips.length > 0) {
    for (var k = 0; k < chips.length; k++) {
      if (k === currentCategoryIndex) {
        chips[k].classList.add('active');
        safeScrollIntoView(chips[k]);
      } else {
        chips[k].classList.remove('active');
      }
    }
    return;
  }

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
        isSearchBoxActive = false;
        renderCategories();
        renderChannels();
      };
      nav.appendChild(chip);
    })(i);
  }

  var activeChip = nav.querySelector('.cat-chip.active');
  if (activeChip) safeScrollIntoView(activeChip);
}

/**
 * Tự động làm mới EPG và tiến độ phát sóng trên danh sách kênh theo thời gian thực (Real-time)
 */
export function updateDrawerEpgProgress() {
  var list = document.getElementById('drawer-channel-list');
  if (!list) return;
  var items = list.querySelectorAll('.channel-row-item');
  var channels = getCurrentChannels();
  var epgReady = isEpgReady();
  if (!epgReady || items.length === 0) return;

  for (var i = 0; i < items.length; i++) {
    var ch = channels[i];
    if (!ch) continue;
    var epg = getChannelEPG(ch.name);
    var contentCol = items[i].querySelector('.ch-content-col');
    if (!contentCol) continue;

    if (epg && epg.current && epg.current.title) {
      var progEl = contentCol.querySelector('.ch-program-gray');
      var timeStartEl = contentCol.querySelector('.ch-timeline-row .ch-time-text:first-child');
      var timeStopEl = contentCol.querySelector('.ch-timeline-row .ch-time-text:last-child');
      var fillEl = contentCol.querySelector('.ch-timeline-bar-fill');
      var timelineRow = contentCol.querySelector('.ch-timeline-row');

      if (progEl && timelineRow) {
        if (progEl.innerText !== epg.current.title) {
          progEl.innerText = epg.current.title;
        }
        if (fillEl) {
          fillEl.style.width = epg.current.progressPercent + '%';
        }
        if (timeStartEl) timeStartEl.innerText = epg.current.startTimeStr;
        if (timeStopEl) timeStopEl.innerText = epg.current.stopTimeStr;
      } else {
        contentCol.innerHTML = 
          '<div class="ch-name-orange">' + ch.name + '</div>' +
          '<div class="ch-program-gray">' + epg.current.title + '</div>' +
          '<div class="ch-timeline-row">' +
            '<span class="ch-time-text">' + epg.current.startTimeStr + '</span>' +
            '<div class="ch-timeline-bar-bg"><div class="ch-timeline-bar-fill" style="width:' + epg.current.progressPercent + '%;"></div></div>' +
            '<span class="ch-time-text">' + epg.current.stopTimeStr + '</span>' +
          '</div>';
      }
    }
  }
}

export function renderChannels() {
  var list = document.getElementById('drawer-channel-list');
  if (!list) return;

  var channels = getCurrentChannels();
  list.innerHTML = '';
  lastFocusedItem = null;

  if (channels.length === 0) {
    list.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: #64748b; font-size: 18px; font-weight: 600;">Không tìm thấy kênh phù hợp</div>';
    return;
  }

  var epgReady = isEpgReady();
  var htmlBuffer = '';

  for (var i = 0; i < channels.length; i++) {
    var ch = channels[i];
    var isFoc = (i === currentChannelIndex && !isSearchBoxActive);
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

    htmlBuffer += '<div class="channel-row-item' + (isFoc ? ' focused' : '') + '" data-index="' + i + '">' +
      '<div class="ch-logo-container">' +
        logoImgHtml +
        '<div class="ch-logo-fallback" style="' + fallbackStyle + '">' + DEFAULT_TV_ICON_SVG + '</div>' +
      '</div>' +
      '<div class="ch-content-col">' + contentHtml + '</div>' +
    '</div>';
  }

  list.innerHTML = htmlBuffer;

  // Gán sự kiện click nhanh
  var children = list.children;
  for (var j = 0; j < children.length; j++) {
    (function(itemIdx) {
      children[itemIdx].onclick = function(e) {
        e.stopPropagation();
        currentChannelIndex = itemIdx;
        isSearchBoxActive = false;
        updateSearchBoxFocusVisual();
        updateChannelFocusVisual();
        if (onPlayChannelCallback && channels[itemIdx]) {
          onPlayChannelCallback(channels[itemIdx]);
        }
      };
    })(j);
  }

  if (!isSearchBoxActive && children[currentChannelIndex]) {
    lastFocusedItem = children[currentChannelIndex];
    safeScrollIntoView(lastFocusedItem);
  }
}
