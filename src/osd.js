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

// Trạng thái EPG 2 cột: Mặc định focus ở cột Kênh bên trái để lướt xem lịch tiện lợi
var epgChannelsList = [];
var epgSelectedChannelIndex = 0;
var epgActiveColumn = 'channel'; // 'channel' | 'schedule'

var ACTION_BUTTONS = ['btn-action-drawer', 'btn-action-epg', 'btn-action-quality', 'btn-action-audio'];
var DEFAULT_TV_ICON_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>';

/**
 * Đặt vị trí mục vào chính giữa container NGAY LẬP TỨC (Instant positioning, không kéo trượt chờ đợi)
 */
function setInstantCenter(container, item) {
  if (!container || !item) return;
  try {
    var cRect = container.getBoundingClientRect();
    var iRect = item.getBoundingClientRect();
    var diff = (iRect.top + iRect.height / 2) - (cRect.top + cRect.height / 2);
    container.scrollTop += diff;
  } catch (e) {
    try {
      var target = item.offsetTop - (container.clientHeight / 2) + (item.offsetHeight / 2);
      container.scrollTop = Math.max(0, target);
    } catch(err){}
  }
}

function safeScroll(el, blockPos) {
  if (!el) return;
  var parent = el.parentElement;
  if (parent) {
    setInstantCenter(parent, el);
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

export function updateActivePillLabels() {
  try {
    var pillQ = document.getElementById('btn-action-quality');
    if (pillQ) {
      var spanQ = pillQ.querySelector('span');
      if (spanQ) {
        var qualities = getRealVideoQualities();
        var activeQ = null;
        for (var i = 0; i < qualities.length; i++) {
          if (qualities[i].active) {
            activeQ = qualities[i];
            break;
          }
        }
        if (activeQ) {
          spanQ.innerText = activeQ.label;
        } else if (qualities.length > 0) {
          spanQ.innerText = qualities[0].label;
        }
      }
    }

    var pillA = document.getElementById('btn-action-audio');
    if (pillA) {
      var spanA = pillA.querySelector('span');
      if (spanA) {
        var audios = getRealAudioTracks();
        var activeA = null;
        for (var j = 0; j < audios.length; j++) {
          if (audios[j].active) {
            activeA = audios[j];
            break;
          }
        }
        if (activeA) {
          spanA.innerText = activeA.label;
        } else if (audios.length > 0) {
          spanA.innerText = audios[0].label;
        }
      }
    }
  } catch (e) {}
}

export function updateOsdInfo(ch, isDrawerOpen, forceShow) {
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

  var isRadio = ch.group && (ch.group.toLowerCase().indexOf('radio') !== -1 || ch.name.toLowerCase().indexOf('vov') !== -1);
  var epgReady = isEpgReady();
  var epg = getChannelEPG(ch.name);

  if (isRadio) {
    if (progNameEl) {
      progNameEl.style.display = 'block';
      progNameEl.innerText = 'Kênh phát thanh Radio trực tuyến';
    }
    if (timelineRowEl) {
      timelineRowEl.style.visibility = 'hidden';
      timelineRowEl.style.display = 'flex';
    }
  } else if (!epgReady) {
    if (progNameEl) {
      progNameEl.style.display = 'block';
      progNameEl.innerHTML = '<div class="skeleton-box skeleton-title" style="width: 140px; height: 12px; margin: 2px 0;"></div>';
    }
    if (timelineRowEl) {
      timelineRowEl.style.visibility = 'visible';
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
      timelineRowEl.style.visibility = 'visible';
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
      timelineRowEl.style.visibility = 'hidden';
      timelineRowEl.style.display = 'flex';
    }
  }

  updateActivePillLabels();

  if (isDrawerOpen) {
    banner.classList.add('pip-right');
    banner.classList.add('active');
    if (actionRowEl) actionRowEl.style.display = 'none';
    if (osdHideTimeout) clearTimeout(osdHideTimeout);
  } else {
    banner.classList.remove('pip-right');
    if (actionRowEl) actionRowEl.style.display = 'flex';
    updateActionPillFocus();

    if (forceShow) {
      banner.classList.add('active');
      if (osdHideTimeout) clearTimeout(osdHideTimeout);
      if (!isDialogOpen) {
        osdHideTimeout = setTimeout(function() {
          banner.classList.remove('active');
        }, 4000);
      }
    }
  }
}

export function updateLiveVideoSpecs(incomingStats) {
  var specsEl = document.getElementById('osd-specs');
  if (!specsEl) return;
  var stats = incomingStats || getRealMediaStats();
  if (stats) {
    if (stats.isAudioOnly || stats.fps === 'Radio' || stats.width === 0) {
      specsEl.innerText = 'Radio Live Stream | Stereo 128 kbps';
    } else {
      var fpsVal = stats.fps;
      var fpsStr = '25.0';
      if (typeof fpsVal === 'number') {
        fpsStr = fpsVal.toFixed(1);
      } else if (typeof fpsVal === 'string' && fpsVal.length > 0) {
        fpsStr = fpsVal;
      }
      var bitrateStr = stats.bitrate || stats.bandwidth || '3.5 Mbps';
      specsEl.innerText = stats.width + 'x' + stats.height + ' @ ' + fpsStr + 'fps | ' + bitrateStr;
    }
  }
  updateActivePillLabels();
}

export function isOsdVisible() {
  var banner = document.getElementById('dl-osd-banner');
  return banner && banner.classList.contains('active');
}

export function showOsdBar(channel, isDrawerOpen) {
  if (!channel) return;
  updateOsdInfo(channel, isDrawerOpen, true);
}

export function hideOsdBar() {
  var banner = document.getElementById('dl-osd-banner');
  if (banner) {
    banner.classList.remove('active');
  }
  if (osdHideTimeout) clearTimeout(osdHideTimeout);
}

export function navigateActionBar(dir, getCurrentChannel, getAllChannels) {
  if (dir === 'left') {
    if (currentActionIndex > 0) currentActionIndex--;
  } else if (dir === 'right') {
    if (currentActionIndex < ACTION_BUTTONS.length - 1) currentActionIndex++;
  }
  updateActionPillFocus();

  if (osdHideTimeout) clearTimeout(osdHideTimeout);
  if (!isDialogOpen) {
    osdHideTimeout = setTimeout(function() {
      hideOsdBar();
    }, 4000);
  }
}

function updateActionPillFocus() {
  for (var i = 0; i < ACTION_BUTTONS.length; i++) {
    var btn = document.getElementById(ACTION_BUTTONS[i]);
    if (btn) {
      btn.classList.toggle('focused', i === currentActionIndex);
    }
  }
}

export function executeActionPill(channelOrGetter, allChannelsOrGetter) {
  var ch = typeof channelOrGetter === 'function' ? channelOrGetter() : channelOrGetter;
  var allList = typeof allChannelsOrGetter === 'function' ? allChannelsOrGetter() : (allChannelsOrGetter || []);
  
  if (currentActionIndex === 0) {
    // 0: Mở danh sách kênh (Drawer)
    hideOsdBar();
    if (onOpenDrawerCallback) onOpenDrawerCallback();
  } else if (currentActionIndex === 1) {
    // 1: Mở Lịch phát sóng
    openEpgScheduleDialog(ch, allList);
  } else if (currentActionIndex === 2) {
    // 2: Mở Chất lượng
    openQualityDialog(ch);
  } else if (currentActionIndex === 3) {
    // 3: Mở Âm thanh
    openAudioDialog(ch);
  }
}

export function setupPillClickEvents(getCurrentChannel, getAllChannels) {
  for (var i = 0; i < ACTION_BUTTONS.length; i++) {
    (function(idx) {
      var btn = document.getElementById(ACTION_BUTTONS[idx]);
      if (btn) {
        btn.onclick = function(e) {
          e.stopPropagation();
          currentActionIndex = idx;
          updateActionPillFocus();
          executeActionPill(getCurrentChannel, getAllChannels);
        };
      }
    })(i);
  }

  var dlg = document.getElementById('quality-audio-dialog');
  if (dlg) {
    dlg.onclick = function(e) {
      if (e.target === dlg) {
        var ch = typeof getCurrentChannel === 'function' ? getCurrentChannel() : getCurrentChannel;
        closeQualityAudioDialog(ch);
      }
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
  
  // FOCUS MẶC ĐỊNH Ở CỘT KÊNH BÊN TRÁI ĐỂ NGƯỜI DÙNG BẤM LÊN/XUỐNG LƯỚT XEM LỊCH DỄ DÀNG
  epgActiveColumn = 'channel';

  isDialogOpen = true;
  var dlg = document.getElementById('quality-audio-dialog');
  if (dlg) dlg.classList.add('epg-mode');
  renderTwoColumnEpgModal();
}

function renderScheduleListHtml() {
  var itemsHtml = '';
  var hasValidSchedule = dialogOptions.length > 0;

  if (!hasValidSchedule) {
    itemsHtml = 
      '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 240px; gap: 8px; color: #94a3b8; text-align: center; padding: 20px;">' +
        '<span style="font-size: 18px; font-weight: 700; color: #cbd5e1;">Không có thông tin lịch phát sóng</span>' +
        '<span style="font-size: 14px; color: #64748b;">Chưa có dữ liệu chương trình cho kênh này</span>' +
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
  return itemsHtml;
}

function updateEpgDOMState() {
  var dlg = document.getElementById('quality-audio-dialog');
  if (!dlg) return;

  var curCh = epgChannelsList[epgSelectedChannelIndex];
  var channelName = curCh ? curCh.name : 'Kênh';

  var header = document.getElementById('epg-dialog-header-title');
  if (header) header.innerText = 'Lịch phát sóng - ' + channelName;

  var sidebar = document.getElementById('epg-channel-sidebar-list');
  if (sidebar) {
    var chEls = sidebar.querySelectorAll('.epg-ch-item');
    for (var i = 0; i < chEls.length; i++) {
      var isSel = (i === epgSelectedChannelIndex);
      var isFoc = (isSel && epgActiveColumn === 'channel');
      chEls[i].classList.toggle('selected', isSel);
      chEls[i].classList.toggle('focused', isFoc);
      if (isSel) {
        setInstantCenter(sidebar, chEls[i]);
      }
    }
  }

  var schedulePanel = document.getElementById('epg-schedule-scroll-list');
  if (schedulePanel) {
    schedulePanel.innerHTML = renderScheduleListHtml();
    
    // ĐỨNG SẴN NGAY TẠI CHÍNH GIỮA CHƯƠNG TRÌNH LIVE (INSTANT, KHÔNG KÉO TRƯỢT CHẬM)
    var targetProgEl = schedulePanel.querySelector('.epg-schedule-item[data-prog-index="' + dialogFocusedIndex + '"]') ||
                       schedulePanel.querySelector('.epg-schedule-item.focused') ||
                       schedulePanel.querySelector('.epg-schedule-item .epg-live-badge');
    if (targetProgEl) {
      var elToScroll = targetProgEl.classList.contains('epg-schedule-item') ? targetProgEl : targetProgEl.parentElement;
      setInstantCenter(schedulePanel, elToScroll);
    }
  }
}

function renderTwoColumnEpgModal() {
  var dlg = document.getElementById('quality-audio-dialog');
  if (!dlg) return;

  var existingSidebar = document.getElementById('epg-channel-sidebar-list');
  if (existingSidebar) {
    updateEpgDOMState();
    return;
  }

  var curCh = epgChannelsList[epgSelectedChannelIndex];
  var channelName = curCh ? curCh.name : 'Kênh';

  var channelListHtml = '';
  for (var idx = 0; idx < epgChannelsList.length; idx++) {
    var c = epgChannelsList[idx];
    var isSel = (idx === epgSelectedChannelIndex);
    var isFoc = (isSel && epgActiveColumn === 'channel');
    var hasLogo = (c.logo && typeof c.logo === 'string' && c.logo.trim().length > 0);
    var logoImgHtml = hasLogo 
      ? '<img src="' + c.logo + '" class="epg-ch-logo-img" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\';" />' 
      : '';
    var fallbackStyle = hasLogo ? 'display:none;' : 'display:flex;';

    channelListHtml += 
      '<div class="epg-ch-item ' + (isSel ? 'selected' : '') + ' ' + (isFoc ? 'focused' : '') + '" data-ch-index="' + idx + '">' +
        '<div class="epg-ch-logo-container">' +
          logoImgHtml +
          '<div class="epg-ch-logo-fallback" style="' + fallbackStyle + '">' + DEFAULT_TV_ICON_SVG + '</div>' +
        '</div>' +
        '<span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + c.name + '</span>' +
      '</div>';
  }

  dlg.innerHTML = 
    '<div class="dialog-card epg-schedule-card">' +
      '<div class="dialog-title" id="epg-dialog-header-title">Lịch phát sóng - ' + channelName + '</div>' +
      '<div class="epg-dialog-body">' +
        '<div class="epg-channel-sidebar" id="epg-channel-sidebar-list">' + channelListHtml + '</div>' +
        '<div class="epg-schedule-panel" id="epg-schedule-scroll-list">' + renderScheduleListHtml() + '</div>' +
      '</div>' +
    '</div>';
  dlg.classList.add('active');

  updateEpgDOMState();
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
  updateEpgDOMState();
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
  var dlg = document.getElementById('quality-audio-dialog');
  if (dlg) dlg.classList.remove('epg-mode');
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
  var dlg = document.getElementById('quality-audio-dialog');
  if (dlg) dlg.classList.remove('epg-mode');
  renderDialogContent('Kênh âm thanh');
}

export function closeQualityAudioDialog(currentChannel) {
  isDialogOpen = false;
  dialogType = null;
  var dlg = document.getElementById('quality-audio-dialog');
  if (dlg) {
    dlg.classList.remove('active');
    dlg.classList.remove('epg-mode');
    dlg.innerHTML = '';
  }
  if (currentChannel) {
    updateOsdInfo(currentChannel, false, true);
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

  // Gán sự kiện click trực tiếp
  var itemEls = dlg.querySelectorAll('.dialog-item');
  for (var j = 0; j < itemEls.length; j++) {
    (function(itemIdx) {
      itemEls[itemIdx].onclick = function(e) {
        e.stopPropagation();
        dialogFocusedIndex = itemIdx;
        selectDialogCurrent();
      };
    })(j);
  }
}

export function navigateDialog(dir, currentChannel) {
  if (!isDialogOpen) return;

  if (dialogType === 'epg') {
    var hasValidSchedule = dialogOptions.length > 0;

    if (epgActiveColumn === 'schedule') {
      if (dir === 'left' || !hasValidSchedule) {
        epgActiveColumn = 'channel';
        updateEpgDOMState();
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
          updateEpgDOMState();
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
      setInstantCenter(dlg.querySelector('.dialog-list'), itemEls[i]);
    }
  }
}

function updateScheduleFocusDOM() {
  var dlg = document.getElementById('quality-audio-dialog');
  if (!dlg) return;
  var itemEls = dlg.querySelectorAll('.epg-schedule-item');
  var schedulePanel = document.getElementById('epg-schedule-scroll-list');
  for (var i = 0; i < itemEls.length; i++) {
    var isFoc = (i === dialogFocusedIndex);
    itemEls[i].classList.toggle('focused', isFoc);
    if (isFoc && schedulePanel) {
      setInstantCenter(schedulePanel, itemEls[i]);
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
  } else if (dialogType === 'audio') {
    setRealAudioTrack(selectedOpt.value);
  }
  updateActivePillLabels();
  closeQualityAudioDialog();
}
