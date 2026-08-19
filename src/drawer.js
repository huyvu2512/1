import { getChannelEPG, isEpgReady } from './epg.js';
import { SOURCE_CONFIGS } from './sources.js';

var allChannelsList = [];
var groupedChannelsMap = {};
var categoryKeys = [];

var currentSourceIndex = 0;
var currentCategoryIndex = 0;
var currentChannelIndex = 0;
var focusArea = 'channel'; // 'search' | 'source_switch' | 'source_refresh' | 'category' | 'channel' | 'source_modal'
var isSearchInputEditing = false;
var searchQuery = '';
var onPlayChannelCallback = null;
var onSwitchSourceCallback = null;
var onRefreshSourceCallback = null;
var lastFocusedItem = null;
var modalFocusedIndex = 0;

var DEFAULT_TV_ICON_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>';

function padZero(num) {
  return num < 10 ? '0' + num : '' + num;
}

export function initDrawerState(data, playCallback, switchCallback, refreshCallback) {
  allChannelsList = data.allChannels || [];
  groupedChannelsMap = data.groupedChannels || {};
  categoryKeys = data.categoryList || [];
  currentSourceIndex = (typeof data.sourceIndex === 'number') ? data.sourceIndex : 0;
  currentCategoryIndex = 0;
  currentChannelIndex = 0;
  focusArea = 'channel';
  searchQuery = '';
  isSearchInputEditing = false;
  onPlayChannelCallback = playCallback || null;
  onSwitchSourceCallback = switchCallback || null;
  onRefreshSourceCallback = refreshCallback || null;
  lastFocusedItem = null;

  setupSearchInputEvents();
  setupSourceControlEvents();
  renderSourceControl();
  renderCategories();
  renderChannels();
  updateVisualFocus();
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

function setupSourceControlEvents() {
  var btnSwitch = document.getElementById('btn-change-source');
  var btnRefresh = document.getElementById('btn-refresh-source');
  var modalOverlay = document.getElementById('source-modal-overlay');

  if (btnSwitch) {
    btnSwitch.onclick = function(e) {
      e.stopPropagation();
      openSourceModal();
    };
  }

  if (btnRefresh) {
    btnRefresh.onclick = function(e) {
      e.stopPropagation();
      if (onRefreshSourceCallback) {
        onRefreshSourceCallback();
      }
    };
  }

  if (modalOverlay) {
    modalOverlay.onclick = function(e) {
      if (e.target === modalOverlay) {
        closeSourceModal();
      }
    };
  }
}

export function renderSourceControl() {
  var label = document.getElementById('current-source-name-label');
  if (label && SOURCE_CONFIGS[currentSourceIndex]) {
    label.innerText = 'Đổi nguồn: ' + SOURCE_CONFIGS[currentSourceIndex].name;
  }
}

export function isSourceModalOpen() {
  return focusArea === 'source_modal';
}

export function openSourceModal() {
  focusArea = 'source_modal';
  modalFocusedIndex = currentSourceIndex;
  var overlay = document.getElementById('source-modal-overlay');
  var list = document.getElementById('source-modal-list');
  var osd = document.getElementById('dl-osd-banner');
  if (!overlay || !list) return;

  // Ẩn thanh OSD phía dưới khi mở modal chọn nguồn
  if (osd) {
    osd.classList.remove('active');
  }

  overlay.classList.add('active');
  overlay.style.display = 'flex';

  list.innerHTML = '';
  for (var i = 0; i < SOURCE_CONFIGS.length; i++) {
    (function(idx) {
      var item = document.createElement('div');
      item.className = 'source-dialog-item' + (idx === currentSourceIndex ? ' active' : '') + (idx === modalFocusedIndex ? ' focused' : '');
      item.innerHTML = '<span>' + (idx + 1) + '. ' + SOURCE_CONFIGS[idx].name + '</span>' + (idx === currentSourceIndex ? '<span class="source-badge" style="font-size:14px; font-weight:800;">ĐANG CHỌN</span>' : '');
      item.onclick = function(e) {
        e.stopPropagation();
        selectSourceItem(idx);
      };
      list.appendChild(item);
    })(i);
  }

  updateSourceModalFocusVisual();
}

export function closeSourceModal() {
  var overlay = document.getElementById('source-modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.style.display = 'none';
  }
  focusArea = 'source_switch';
  updateVisualFocus();
}

function selectSourceItem(idx) {
  currentSourceIndex = idx;
  closeSourceModal();
  renderSourceControl();
  if (onSwitchSourceCallback) {
    onSwitchSourceCallback(idx);
  }
}

function updateSourceModalFocusVisual() {
  var list = document.getElementById('source-modal-list');
  if (!list) return;
  var items = list.querySelectorAll('.source-dialog-item');
  for (var i = 0; i < items.length; i++) {
    if (i === modalFocusedIndex) {
      items[i].classList.add('focused');
      safeScrollIntoView(items[i]);
    } else {
      items[i].classList.remove('focused');
    }
  }
}

export function navigateSourceModal(direction) {
  if (direction === 'up' && modalFocusedIndex > 0) {
    modalFocusedIndex--;
    updateSourceModalFocusVisual();
  } else if (direction === 'down' && modalFocusedIndex < SOURCE_CONFIGS.length - 1) {
    modalFocusedIndex++;
    updateSourceModalFocusVisual();
  }
}

export function selectSourceModalCurrent() {
  selectSourceItem(modalFocusedIndex);
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

  timeEl.innerHTML = hours + ':' + minutes + ':' + seconds;
  dateEl.innerHTML = day + '/' + month + '/' + year;
}

export function getFocusArea() {
  return focusArea;
}

export function setFocusArea(area) {
  focusArea = area;
  updateVisualFocus();
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
  focusArea = 'category';
  renderCategories();
  renderChannels();
  updateVisualFocus();
}

export function nextCategory() {
  if (categoryKeys.length === 0) return;
  if (currentCategoryIndex < categoryKeys.length - 1) {
    currentCategoryIndex++;
    currentChannelIndex = 0;
    renderCategories();
    renderChannels();
  }
}

export function prevCategory() {
  if (categoryKeys.length === 0) return;
  if (currentCategoryIndex > 0) {
    currentCategoryIndex--;
    currentChannelIndex = 0;
    renderCategories();
    renderChannels();
  }
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
  focusArea = 'channel';
  updateVisualFocus();
}

export function getCurrentSelectedChannel() {
  var chs = getCurrentChannels();
  if (chs.length === 0) return null;
  return chs[currentChannelIndex] || null;
}

export function nextChannel() {
  if (focusArea === 'search') {
    focusArea = 'source_switch';
    updateVisualFocus();
    return;
  }
  if (focusArea === 'source_switch' || focusArea === 'source_refresh') {
    focusArea = 'channel';
    currentChannelIndex = 0;
    updateVisualFocus();
    return;
  }

  var chs = getCurrentChannels();
  if (chs.length === 0) return;
  if (currentChannelIndex < chs.length - 1) {
    currentChannelIndex++;
    updateVisualFocus();
  }
}

export function prevChannel() {
  if (focusArea === 'search') return;

  if (focusArea === 'source_switch' || focusArea === 'source_refresh') {
    focusArea = 'search';
    updateVisualFocus();
    return;
  }

  if (focusArea === 'channel') {
    if (currentChannelIndex === 0) {
      focusArea = 'source_switch';
      updateVisualFocus();
      return;
    }
    if (currentChannelIndex > 0) {
      currentChannelIndex--;
      updateVisualFocus();
    }
  }
}

export function handleLeftInDrawer() {
  if (focusArea === 'source_refresh') {
    focusArea = 'source_switch';
    updateVisualFocus();
  } else if (focusArea === 'channel') {
    prevCategory();
  }
}

export function handleRightInDrawer() {
  if (focusArea === 'source_switch') {
    focusArea = 'source_refresh';
    updateVisualFocus();
  } else if (focusArea === 'channel') {
    nextCategory();
  }
}

export function handleEnterInDrawer() {
  if (focusArea === 'search') {
    startSearchEditing();
  } else if (focusArea === 'source_switch') {
    openSourceModal();
  } else if (focusArea === 'source_refresh') {
    if (onRefreshSourceCallback) {
      onRefreshSourceCallback();
    }
  } else if (focusArea === 'channel') {
    var sel = getCurrentSelectedChannel();
    if (sel && onPlayChannelCallback) {
      onPlayChannelCallback(sel);
    }
  } else if (focusArea === 'source_modal') {
    selectSourceModalCurrent();
  }
}

export function isSearchBoxFocused() {
  return focusArea === 'search';
}

export function focusSearchBox() {
  focusArea = 'search';
  isSearchInputEditing = false;
  updateVisualFocus();
}

export function blurSearchBox() {
  focusArea = 'channel';
  isSearchInputEditing = false;
  var input = document.getElementById('channel-search-input');
  if (input) input.blur();
  updateVisualFocus();
}

export function isSearchEditing() {
  return isSearchInputEditing;
}

export function startSearchEditing() {
  focusArea = 'search';
  isSearchInputEditing = true;
  var input = document.getElementById('channel-search-input');
  if (input) {
    input.focus();
  }
  updateVisualFocus();
}

export function stopSearchEditing() {
  isSearchInputEditing = false;
  var input = document.getElementById('channel-search-input');
  if (input) input.blur();
  updateVisualFocus();
}

function updateVisualFocus() {
  var searchBox = document.getElementById('drawer-search-box');
  var btnSwitch = document.getElementById('btn-change-source');
  var btnRefresh = document.getElementById('btn-refresh-source');
  var catBar = document.getElementById('category-nav-bar');
  var list = document.getElementById('drawer-channel-list');

  if (searchBox) {
    if (focusArea === 'search') searchBox.classList.add('focused');
    else searchBox.classList.remove('focused');
  }

  if (btnSwitch) {
    if (focusArea === 'source_switch') btnSwitch.classList.add('focused');
    else btnSwitch.classList.remove('focused');
  }

  if (btnRefresh) {
    if (focusArea === 'source_refresh') btnRefresh.classList.add('focused');
    else btnRefresh.classList.remove('focused');
  }

  if (catBar) {
    var chips = catBar.querySelectorAll('.cat-chip');
    for (var k = 0; k < chips.length; k++) {
      if (k === currentCategoryIndex) {
        chips[k].classList.add('active');
        safeScrollIntoView(chips[k]);
      } else {
        chips[k].classList.remove('active');
      }
    }
  }

  if (list) {
    var items = list.children;
    if (lastFocusedItem) {
      lastFocusedItem.classList.remove('focused');
    }

    if (focusArea === 'channel' && currentChannelIndex >= 0 && currentChannelIndex < items.length) {
      var cur = items[currentChannelIndex];
      if (cur) {
        cur.classList.add('focused');
        safeScrollIntoView(cur);
        lastFocusedItem = cur;
      }
    }
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
        focusArea = 'category';
        renderCategories();
        renderChannels();
        updateVisualFocus();
      };
      nav.appendChild(chip);
    })(i);
  }

  var activeChip = nav.querySelector('.cat-chip.active');
  if (activeChip) safeScrollIntoView(activeChip);
}

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
    var isFoc = (i === currentChannelIndex && focusArea === 'channel');
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

  var children = list.children;
  for (var j = 0; j < children.length; j++) {
    (function(itemIdx) {
      children[itemIdx].onclick = function(e) {
        e.stopPropagation();
        currentChannelIndex = itemIdx;
        focusArea = 'channel';
        updateVisualFocus();
        if (onPlayChannelCallback && channels[itemIdx]) {
          onPlayChannelCallback(channels[itemIdx]);
        }
      };
    })(j);
  }

  if (focusArea === 'channel' && children[currentChannelIndex]) {
    lastFocusedItem = children[currentChannelIndex];
    safeScrollIntoView(lastFocusedItem);
  }
}
