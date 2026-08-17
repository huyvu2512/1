import { 
  getRealMediaStats, 
  getRealVideoQualities, 
  setRealVideoQuality, 
  getRealAudioTracks, 
  setRealAudioTrack 
} from './player.js';
import { getChannelEPG, getChannelFullSchedule, isEpgReady } from './epg.js';

var osdHideTimeout = null;
var currentActionIndex = 0; // 0: Danh sách kênh, 1: Lịch phát sóng, 2: Chất lượng, 3: Âm thanh
var onOpenDrawerCallback = null;
var onPlayChannelCallback = null;

var isDialogOpen = false;
var dialogType = null; // 'quality' | 'audio' | 'epg'
var dialogOptions = [];
var dialogFocusedIndex = 0;

// Trạng thái EPG 2 cột
var epgChannelsList = [];
var epgSelectedChannelIndex = 0;
var epgActiveColumn = 'schedule'; // 'channel' | 'schedule'

var ACTION_BUTTONS = ['btn-action-drawer', 'btn-action-epg', 'btn-action-quality', 'btn-action-audio'];

function safeScroll(el, blockPos) {
  if (!el) return;
  try {
    if (typeof el.scrollIntoView === 'function') {
      if (blockPos === 'center' || blockPos === 'nearest') {
        el.scrollIntoView({ block: blockPos, behavior: 'auto' });
      } else {
        el.scrollIntoView(false);
      }
    }
  } catch (e) {
    try {
      el.scrollIntoView(false);
    } catch (err) {}
  }
}

export function setOpenDrawerCallback(cb) {
  onOpenDrawerCallback = cb;
}

export function setPlayChannelCallback(cb) {
  onPlayChannelCallback = cb;
}

export function showCenterPlayPause(type) {
  var layer = document.getElementById('center-state-layer');
  var icon = document.getElementById('center-state-icon');
  if (!layer) return;

  if (type === 'pause') {
    if (icon) {
      icon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
    }
    layer.classList.add('active');
  } else if (type === 'play') {
    if (icon) {
      icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
    }
    layer.classList.add('active');
    setTimeout(function() {
      layer.classList.remove('active');
    }, 800);
  } else {
    layer.classList.remove('active');
  }
}

export function updateOsdInfo(ch, isDrawerOpen) {
  var banner = document.getElementById('dl-osd-banner');
  if (!banner || !ch) return;

  var chNameEl = document.getElementById('osd-channel-name');
  var progNameEl = document.getElementById('osd-program-name');
  var logoEl = document.getElementById('osd-logo');
  var timelineRowEl = document.getElementById('osd-timeline-row');
  var actionRowEl = document.querySelector('.osd-action-pills-row');

  if (chNameEl) chNameEl.innerText = ch.name;

  if (logoEl) {
    logoEl.innerHTML = (ch.logo && ch.logo.trim().length > 0)
      ? '<img src="' + ch.logo + '" alt="logo" onerror="this.style.display=\'none\';" />'
      : '';
  }

  var epgReady = isEpgReady();
  var epg = getChannelEPG(ch.name);

  if (!epgReady) {
    if (progNameEl) {
      progNameEl.style.display = 'block';
      progNameEl.innerHTML = '<div class="skeleton-box skeleton-title" style="width: 140px; height: 12px; margin: 2px 0;"></div>';
    }
    if (timelineRowEl) {
      timelineRowEl.style.display = 'flex';
      timelineRowEl.innerHTML = 
        '<div class="skeleton-box" style="width: 34px; height: 12px; border-radius: 3px;"></div>' +
        '<div class="osd-timeline-track"><div class="skeleton-box skeleton-timeline" style="width: 100%; height: 100%;"></div></div>' +
        '<div class="skeleton-box" style="width: 34px; height: 12px; border-radius: 3px;"></div>';
    }
  } else if (epg && epg.current && epg.current.title) {
    if (progNameEl) {
      progNameEl.style.display = 'block';
      progNameEl.innerText = epg.current.title;
    }
    if (timelineRowEl) {
      timelineRowEl.style.display = 'flex';
      timelineRowEl.innerHTML = 
        '<span id="osd-start-time" class="osd-time-bound">' + epg.current.startTimeStr + '</span>' +
        '<div class="osd-timeline-track">' +
          '<div id="osd-progress-bar" class="osd-timeline-fill" style="width: ' + epg.current.progressPercent + '%;"></div>' +
        '</div>' +
        '<span id="osd-stop-time" class="osd-time-bound">' + epg.current.stopTimeStr + '</span>';
    }
  } else {
    if (progNameEl) {
      progNameEl.style.display = 'block';
      progNameEl.innerText = 'Đang phát trực tiếp';
    }
    if (timelineRowEl) {
      timelineRowEl.style.display = 'none';
    }
  }

  if (isDrawerOpen) {
    banner.classList.add('pip-right');
    banner.classList.add('active');
    if (actionRowEl) actionRowEl.style.display = 'none';
    if (osdHideTimeout) clearTimeout(osdHideTimeout);
  } else {
    banner.classList.remove('pip-right');
    banner.classList.add('active');
    if (actionRowEl) actionRowEl.style.display = 'flex';
    updateActionPillFocus();

    if (osdHideTimeout) clearTimeout(osdHideTimeout);
    if (!isDialogOpen) {
      osdHideTimeout = setTimeout(function() {
        banner.classList.remove('active');
      }, 5000);
    }
  }
}

export function updateLiveVideoSpecs(stats) {
  var osdSpecs = document.getElementById('osd-specs');
  if (!osdSpecs) return;
  var currentStats = stats || getRealMediaStats();
  if (currentStats) {
    osdSpecs.innerHTML = currentStats.width + 'x' + currentStats.height + ' @ ' + currentStats.fps + 'fps | ' + currentStats.bandwidth;
  } else {
    osdSpecs.innerHTML = '1920x1080 @ 25.0fps | 3.5 Mbps';
  }
}

export function isOsdVisible() {
  var banner = document.getElementById('dl-osd-banner');
  return banner && banner.classList.contains('active');
}

export function updateActionPillFocus() {
  ACTION_BUTTONS.forEach(function(id, idx) {
    var btn = document.getElementById(id);
    if (btn) {
      btn.classList.toggle('focused', idx === currentActionIndex);
    }
  });
}

export function navigateActionBar(dir, currentChannel) {
  if (dir === 'left') {
    if (currentActionIndex > 0) currentActionIndex--;
  } else if (dir === 'right') {
    if (currentActionIndex < ACTION_BUTTONS.length - 1) currentActionIndex++;
  }
  updateActionPillFocus();
  if (currentChannel) updateOsdInfo(currentChannel, false);
}

export function executeActionPill(currentChannel, allChannelsList) {
  if (currentActionIndex === 0) {
    if (onOpenDrawerCallback) onOpenDrawerCallback();
  } else if (currentActionIndex === 1) {
    openEpgScheduleDialog(currentChannel, allChannelsList);
  } else if (currentActionIndex === 2) {
    openQualityDialog(currentChannel);
  } else if (currentActionIndex === 3) {
    openAudioDialog(currentChannel);
  }
}

export function setupPillClickEvents(getCurrentChannelCb, getAllChannelsCb) {
  var btnDrawer = document.getElementById('btn-action-drawer');
  var btnEpg = document.getElementById('btn-action-epg');
  var btnQuality = document.getElementById('btn-action-quality');
  var btnAudio = document.getElementById('btn-action-audio');

  if (btnDrawer) {
    btnDrawer.onclick = function(e) {
      e.stopPropagation();
      currentActionIndex = 0;
      updateActionPillFocus();
      if (onOpenDrawerCallback) onOpenDrawerCallback();
    };
  }
  if (btnEpg) {
    btnEpg.onclick = function(e) {
      e.stopPropagation();
      currentActionIndex = 1;
      updateActionPillFocus();
      var ch = getCurrentChannelCb ? getCurrentChannelCb() : null;
      var all = getAllChannelsCb ? getAllChannelsCb() : [ch];
      if (ch) openEpgScheduleDialog(ch, all);
    };
  }
  if (btnQuality) {
    btnQuality.onclick = function(e) {
      e.stopPropagation();
      currentActionIndex = 2;
      updateActionPillFocus();
      var ch = getCurrentChannelCb ? getCurrentChannelCb() : null;
      openQualityDialog(ch);
    };
  }
  if (btnAudio) {
    btnAudio.onclick = function(e) {
      e.stopPropagation();
      currentActionIndex = 3;
      updateActionPillFocus();
      var ch = getCurrentChannelCb ? getCurrentChannelCb() : null;
      openAudioDialog(ch);
    };
  }
}

export function isQualityOrAudioDialogOpen() {
  return isDialogOpen;
}

export function openEpgScheduleDialog(channel, allChannelsList) {
  if (!channel) return;
  if (osdHideTimeout) clearTimeout(osdHideTimeout);
  dialogType = 'epg';
  epgChannelsList = (allChannelsList && allChannelsList.length > 0) ? allChannelsList : [channel];
  
  var foundIdx = -1;
  for (var i = 0; i < epgChannelsList.length; i++) {
    if (epgChannelsList[i].name === channel.name) {
      foundIdx = i;
      break;
    }
  }
  epgSelectedChannelIndex = foundIdx >= 0 ? foundIdx : 0;
  
  var curCh = epgChannelsList[epgSelectedChannelIndex] || channel;
  dialogOptions = getChannelFullSchedule(curCh.name);
  
  var currentIdx = -1;
  for (var j = 0; j < dialogOptions.length; j++) {
    if (dialogOptions[j].isCurrent) {
      currentIdx = j;
      break;
    }
  }
  dialogFocusedIndex = currentIdx >= 0 ? currentIdx : 0;
  epgActiveColumn = 'schedule';

  isDialogOpen = true;
  renderTwoColumnEpgModal();
}

function renderTwoColumnEpgModal() {
  var dlg = document.getElementById('quality-audio-dialog');
  if (!dlg) return;

  var curCh = epgChannelsList[epgSelectedChannelIndex];
  var channelName = curCh ? curCh.name : 'Kênh';

  // 1. Render cột bên trái (Danh sách kênh)
  var channelListHtml = '';
  for (var idx = 0; idx < epgChannelsList.length; idx++) {
    var c = epgChannelsList[idx];
    var isSel = (idx === epgSelectedChannelIndex);
    var isFoc = (isSel && epgActiveColumn === 'channel');
    var logoImg = (c.logo && c.logo.trim()) ? '<img src="' + c.logo + '" class="epg-ch-logo" onerror="this.style.display=\'none\';" />' : '';
    channelListHtml += 
      '<div class="epg-ch-item ' + (isSel ? 'selected' : '') + ' ' + (isFoc ? 'focused' : '') + '" data-ch-index="' + idx + '">' +
        logoImg +
        '<span>' + c.name + '</span>' +
      '</div>';
  }

  // 2. Render cột bên phải (Lịch phát sóng)
  var itemsHtml = '';
  var hasValidSchedule = dialogOptions.length > 0;

  if (!hasValidSchedule) {
    itemsHtml = 
      '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 240px; gap: 8px; color: #94a3b8; text-align: center; padding: 20px;">' +
        '<span style="font-size: 16px; font-weight: 700; color: #cbd5e1;">Không có thông tin lịch phát sóng</span>' +
        '<span style="font-size: 13px; color: #64748b;">Chưa có dữ liệu chương trình cho kênh này</span>' +
      '</div>';
  } else {
    for (var k = 0; k < dialogOptions.length; k++) {
      var p = dialogOptions[k];
      var isFocP = (k === dialogFocusedIndex && epgActiveColumn === 'schedule');
      var isPast = p.isPast;
      itemsHtml += 
        '<div class="epg-schedule-item ' + (isPast ? 'past' : '') + ' ' + (isFocP ? 'focused' : '') + '" data-prog-index="' + k + '">' +
          '<span class="epg-time-range">' + p.startStr + ' - ' + p.stopStr + '</span>' +
          '<span class="epg-item-title">' + p.title + '</span>' +
          (p.isCurrent ? '<span class="epg-live-badge">LIVE</span>' : '') +
        '</div>';
    }
  }

  dlg.innerHTML = 
    '<div class="dialog-card epg-schedule-card">' +
      '<div class="dialog-title">Lịch phát sóng - ' + channelName + '</div>' +
      '<div class="epg-dialog-body">' +
        '<div class="epg-channel-sidebar" id="epg-channel-sidebar-list">' + channelListHtml + '</div>' +
        '<div class="epg-schedule-panel" id="epg-schedule-scroll-list">' + itemsHtml + '</div>' +
      '</div>' +
    '</div>';
  dlg.classList.add('active');

  setTimeout(function() {
    var chEl = dlg.querySelector('.epg-ch-item.selected');
    if (chEl) safeScroll(chEl, 'nearest');

    if (hasValidSchedule) {
      var curProgEl = dlg.querySelector('.epg-schedule-item.focused') || dlg.querySelector('.epg-schedule-item .epg-live-badge');
      var targetEl = curProgEl ? (curProgEl.classList.contains('epg-schedule-item') ? curProgEl : curProgEl.parentElement) : null;
      if (targetEl) safeScroll(targetEl, 'center');
    }
  }, 10);
}

function switchEpgChannel(idx) {
  if (idx < 0 || idx >= epgChannelsList.length) return;
  epgSelectedChannelIndex = idx;
  var curCh = epgChannelsList[epgSelectedChannelIndex];
  dialogOptions = getChannelFullSchedule(curCh.name);
  
  var currentIdx = -1;
  for (var j = 0; j < dialogOptions.length; j++) {
    if (dialogOptions[j].isCurrent) {
      currentIdx = j;
      break;
    }
  }
  dialogFocusedIndex = currentIdx >= 0 ? currentIdx : 0;
  renderTwoColumnEpgModal();
}

export function openQualityDialog(channel) {
  if (osdHideTimeout) clearTimeout(osdHideTimeout);
  dialogType = 'quality';
  dialogOptions = getRealVideoQualities();
  dialogFocusedIndex = 0;
  for (var i = 0; i < dialogOptions.length; i++) {
    if (dialogOptions[i].active) {
      dialogFocusedIndex = i;
      break;
    }
  }
  isDialogOpen = true;
  renderDialogContent('Chất lượng hình ảnh');
}

export function openAudioDialog(channel) {
  if (osdHideTimeout) clearTimeout(osdHideTimeout);
  dialogType = 'audio';
  dialogOptions = getRealAudioTracks();
  dialogFocusedIndex = 0;
  for (var i = 0; i < dialogOptions.length; i++) {
    if (dialogOptions[i].active) {
      dialogFocusedIndex = i;
      break;
    }
  }
  isDialogOpen = true;
  renderDialogContent('Kênh âm thanh');
}

export function closeQualityAudioDialog(currentChannel) {
  isDialogOpen = false;
  dialogType = null;
  var dlg = document.getElementById('quality-audio-dialog');
  if (dlg) {
    dlg.classList.remove('active');
    dlg.innerHTML = '';
  }
  if (currentChannel) {
    updateOsdInfo(currentChannel, false);
  }
}

function renderDialogContent(titleText) {
  var dlg = document.getElementById('quality-audio-dialog');
  if (!dlg) return;

  var itemsHtml = '';
  for (var idx = 0; idx < dialogOptions.length; idx++) {
    var opt = dialogOptions[idx];
    var isFoc = (idx === dialogFocusedIndex);
    var isAct = opt.active;
    itemsHtml += 
      '<div class="dialog-item ' + (isFoc ? 'focused' : '') + ' ' + (isAct ? 'active' : '') + '" data-index="' + idx + '">' +
        '<span>' + opt.label + '</span>' +
        (isAct ? '<svg class="dialog-check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '') +
      '</div>';
  }

  dlg.innerHTML = 
    '<div class="dialog-card">' +
      '<div class="dialog-title">' + titleText + '</div>' +
      '<div class="dialog-list">' + itemsHtml + '</div>' +
    '</div>';
  dlg.classList.add('active');
}

export function navigateDialog(dir, currentChannel) {
  if (!isDialogOpen) return;

  if (dialogType === 'epg') {
    var hasValidSchedule = dialogOptions.length > 0;

    if (epgActiveColumn === 'schedule') {
      if (dir === 'left' || !hasValidSchedule) {
        epgActiveColumn = 'channel';
        renderTwoColumnEpgModal();
        return;
      }
      if (dir === 'up') {
        if (dialogFocusedIndex > 0) {
          dialogFocusedIndex--;
          updateScheduleFocusDOM();
        }
        return;
      }
      if (dir === 'down') {
        if (dialogFocusedIndex < dialogOptions.length - 1) {
          dialogFocusedIndex++;
          updateScheduleFocusDOM();
        }
        return;
      }
    } else if (epgActiveColumn === 'channel') {
      if (dir === 'left') {
        closeQualityAudioDialog(currentChannel);
        return;
      }
      if (dir === 'right') {
        if (hasValidSchedule) {
          epgActiveColumn = 'schedule';
          renderTwoColumnEpgModal();
        }
        return;
      }
      if (dir === 'up') {
        if (epgSelectedChannelIndex > 0) {
          switchEpgChannel(epgSelectedChannelIndex - 1);
        }
        return;
      }
      if (dir === 'down') {
        if (epgSelectedChannelIndex < epgChannelsList.length - 1) {
          switchEpgChannel(epgSelectedChannelIndex + 1);
        }
        return;
      }
    }
    return;
  }

  if (dir === 'left') {
    closeQualityAudioDialog(currentChannel);
    return;
  }

  if (dialogOptions.length === 0) return;
  if (dir === 'up') {
    if (dialogFocusedIndex > 0) dialogFocusedIndex--;
  } else if (dir === 'down') {
    if (dialogFocusedIndex < dialogOptions.length - 1) dialogFocusedIndex++;
  }

  var dlg = document.getElementById('quality-audio-dialog');
  if (!dlg) return;

  var itemEls = dlg.querySelectorAll('.dialog-item');
  for (var i = 0; i < itemEls.length; i++) {
    var isFoc = (i === dialogFocusedIndex);
    itemEls[i].classList.toggle('focused', isFoc);
    if (isFoc) {
      safeScroll(itemEls[i], 'nearest');
    }
  }
}

function updateScheduleFocusDOM() {
  var dlg = document.getElementById('quality-audio-dialog');
  if (!dlg) return;
  var itemEls = dlg.querySelectorAll('.epg-schedule-item');
  for (var i = 0; i < itemEls.length; i++) {
    var isFoc = (i === dialogFocusedIndex);
    itemEls[i].classList.toggle('focused', isFoc);
    if (isFoc) {
      safeScroll(itemEls[i], 'center');
    }
  }
}

export function selectDialogCurrent() {
  if (!isDialogOpen) return;

  if (dialogType === 'epg') {
    var curCh = epgChannelsList[epgSelectedChannelIndex];
    if (curCh && onPlayChannelCallback) {
      onPlayChannelCallback(curCh);
    }
    closeQualityAudioDialog(curCh);
    return;
  }

  if (dialogOptions.length === 0) return;
  var selectedOpt = dialogOptions[dialogFocusedIndex];
  if (!selectedOpt) return;

  if (dialogType === 'quality') {
    setRealVideoQuality(selectedOpt.value);
    var pillQ = document.getElementById('btn-action-quality');
    if (pillQ) {
      var spanQ = pillQ.querySelector('span');
      if (spanQ) spanQ.innerText = selectedOpt.label;
    }
  } else if (dialogType === 'audio') {
    // Sửa lỗi: Truyền đúng selectedOpt.value
    setRealAudioTrack(selectedOpt.value);
    var pillA = document.getElementById('btn-action-audio');
    if (pillA) {
      var spanA = pillA.querySelector('span');
      if (spanA) spanA.innerText = selectedOpt.label;
    }
  }
  closeQualityAudioDialog();
}
