import { 
  getRealMediaStats, 
  getRealVideoQualities, 
  setRealVideoQuality, 
  getRealAudioTracks, 
  setRealAudioTrack 
} from './player.js';
import { getChannelEPG, getChannelFullSchedule, isEpgReady } from './epg.js';

let osdHideTimeout = null;
let currentActionIndex = 0; // 0: Danh sách kênh, 1: Lịch phát sóng, 2: Chất lượng, 3: Âm thanh
let onOpenDrawerCallback = null;
let onPlayChannelCallback = null;

let isDialogOpen = false;
let dialogType = null; // 'quality' | 'audio' | 'epg'
let dialogOptions = [];
let dialogFocusedIndex = 0;

// Trạng thái EPG 2 cột
let epgChannelsList = [];
let epgSelectedChannelIndex = 0;
let epgActiveColumn = 'schedule'; // 'channel' | 'schedule'

const ACTION_BUTTONS = ['btn-action-drawer', 'btn-action-epg', 'btn-action-quality', 'btn-action-audio'];

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
  const layer = document.getElementById('center-state-layer');
  const icon = document.getElementById('center-state-icon');
  if (!layer) return;

  if (type === 'pause') {
    if (icon) {
      icon.innerHTML = `<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>`;
    }
    layer.classList.add('active');
  } else if (type === 'play') {
    if (icon) {
      icon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
    }
    layer.classList.add('active');
    setTimeout(() => {
      layer.classList.remove('active');
    }, 800);
  } else {
    layer.classList.remove('active');
  }
}

export function updateOsdInfo(ch, isDrawerOpen) {
  const banner = document.getElementById('dl-osd-banner');
  if (!banner || !ch) return;

  const chNameEl = document.getElementById('osd-channel-name');
  const progNameEl = document.getElementById('osd-program-name');
  const logoEl = document.getElementById('osd-logo');
  const timelineRowEl = document.getElementById('osd-timeline-row');
  const actionRowEl = document.querySelector('.osd-action-pills-row');

  if (chNameEl) chNameEl.innerText = ch.name;

  if (logoEl) {
    logoEl.innerHTML = (ch.logo && ch.logo.trim().length > 0)
      ? `<img src="${ch.logo}" alt="logo" onerror="this.style.display='none';" />`
      : '';
  }

  const epgReady = isEpgReady();
  const epg = getChannelEPG(ch.name);

  if (!epgReady) {
    if (progNameEl) {
      progNameEl.style.display = 'block';
      progNameEl.innerHTML = `<div class="skeleton-box skeleton-title" style="width: 140px; height: 12px; margin: 2px 0;"></div>`;
    }
    if (timelineRowEl) {
      timelineRowEl.style.display = 'flex';
      timelineRowEl.innerHTML = `
        <div class="skeleton-box" style="width: 34px; height: 12px; border-radius: 3px;"></div>
        <div class="osd-timeline-track"><div class="skeleton-box skeleton-timeline" style="width: 100%; height: 100%;"></div></div>
        <div class="skeleton-box" style="width: 34px; height: 12px; border-radius: 3px;"></div>
      `;
    }
  } else if (epg && epg.current && epg.current.title) {
    if (progNameEl) {
      progNameEl.style.display = 'block';
      progNameEl.innerText = epg.current.title;
    }
    if (timelineRowEl) {
      timelineRowEl.style.display = 'flex';
      timelineRowEl.innerHTML = `
        <span id="osd-start-time" class="osd-time-bound">${epg.current.startTimeStr}</span>
        <div class="osd-timeline-track">
          <div id="osd-progress-bar" class="osd-timeline-fill" style="width: ${epg.current.progressPercent}%;"></div>
        </div>
        <span id="osd-stop-time" class="osd-time-bound">${epg.current.stopTimeStr}</span>
      `;
    }
  } else {
    if (progNameEl) {
      progNameEl.style.display = 'none';
      progNameEl.innerHTML = '';
    }
    if (timelineRowEl) {
      timelineRowEl.style.display = 'none';
      timelineRowEl.innerHTML = '';
    }
  }

  updateLiveVideoSpecs();
  updateActionPillFocus();

  banner.classList.add('active');

  if (isDrawerOpen) {
    closeQualityAudioDialog();
    banner.classList.add('pip-right');
    if (actionRowEl) actionRowEl.style.display = 'none';
    if (osdHideTimeout) clearTimeout(osdHideTimeout);
  } else {
    banner.classList.remove('pip-right');
    if (actionRowEl) actionRowEl.style.display = 'flex';
    if (osdHideTimeout) clearTimeout(osdHideTimeout);
    if (!isDialogOpen) {
      osdHideTimeout = setTimeout(() => {
        banner.classList.remove('active');
      }, 5000);
    }
  }
}

export function updateLiveVideoSpecs(stats) {
  const osdSpecs = document.getElementById('osd-specs');
  if (!osdSpecs) return;
  const currentStats = stats || getRealMediaStats();
  if (currentStats) {
    osdSpecs.innerHTML = `${currentStats.width}x${currentStats.height} @ ${currentStats.fps}fps | ${currentStats.bandwidth}`;
  } else {
    osdSpecs.innerHTML = `1920x1080 @ 25.0fps | 3.5 Mbps`;
  }
}

export function isOsdVisible() {
  const banner = document.getElementById('dl-osd-banner');
  return banner && banner.classList.contains('active');
}

export function updateActionPillFocus() {
  ACTION_BUTTONS.forEach((id, idx) => {
    const btn = document.getElementById(id);
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
  const btnDrawer = document.getElementById('btn-action-drawer');
  const btnEpg = document.getElementById('btn-action-epg');
  const btnQuality = document.getElementById('btn-action-quality');
  const btnAudio = document.getElementById('btn-action-audio');

  if (btnDrawer) {
    btnDrawer.onclick = (e) => {
      e.stopPropagation();
      currentActionIndex = 0;
      updateActionPillFocus();
      if (onOpenDrawerCallback) onOpenDrawerCallback();
    };
  }
  if (btnEpg) {
    btnEpg.onclick = (e) => {
      e.stopPropagation();
      currentActionIndex = 1;
      updateActionPillFocus();
      const ch = getCurrentChannelCb ? getCurrentChannelCb() : null;
      const all = getAllChannelsCb ? getAllChannelsCb() : [ch];
      if (ch) openEpgScheduleDialog(ch, all);
    };
  }
  if (btnQuality) {
    btnQuality.onclick = (e) => {
      e.stopPropagation();
      currentActionIndex = 2;
      updateActionPillFocus();
      const ch = getCurrentChannelCb ? getCurrentChannelCb() : null;
      openQualityDialog(ch);
    };
  }
  if (btnAudio) {
    btnAudio.onclick = (e) => {
      e.stopPropagation();
      currentActionIndex = 3;
      updateActionPillFocus();
      const ch = getCurrentChannelCb ? getCurrentChannelCb() : null;
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
  const foundIdx = epgChannelsList.findIndex(c => c.name === channel.name);
  epgSelectedChannelIndex = foundIdx >= 0 ? foundIdx : 0;
  
  const curCh = epgChannelsList[epgSelectedChannelIndex] || channel;
  dialogOptions = getChannelFullSchedule(curCh.name);
  const currentIdx = dialogOptions.findIndex(s => s.isCurrent);
  dialogFocusedIndex = currentIdx >= 0 ? currentIdx : 0;
  epgActiveColumn = 'schedule';

  isDialogOpen = true;
  renderTwoColumnEpgModal();
}

function renderTwoColumnEpgModal() {
  const dlg = document.getElementById('quality-audio-dialog');
  if (!dlg) return;

  const curCh = epgChannelsList[epgSelectedChannelIndex];
  const channelName = curCh ? curCh.name : 'Kênh';

  // 1. Render cột bên trái (Danh sách kênh)
  let channelListHtml = '';
  epgChannelsList.forEach((c, idx) => {
    const isSel = (idx === epgSelectedChannelIndex);
    const isFoc = (isSel && epgActiveColumn === 'channel');
    const logoImg = (c.logo && c.logo.trim()) ? `<img src="${c.logo}" class="epg-ch-logo" onerror="this.style.display='none';" />` : '';
    channelListHtml += `
      <div class="epg-ch-item ${isSel ? 'selected' : ''} ${isFoc ? 'focused' : ''}" data-ch-index="${idx}">
        ${logoImg}
        <span>${c.name}</span>
      </div>
    `;
  });

  // 2. Render cột bên phải (Lịch phát sóng)
  let itemsHtml = '';
  const hasValidSchedule = dialogOptions.length > 0 && dialogOptions.some(p => p.isCurrent || p.isFuture);

  if (!hasValidSchedule) {
    itemsHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 240px; gap: 8px; color: #94a3b8; text-align: center; padding: 20px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span style="font-size: 14.5px; font-weight: 700; color: #cbd5e1;">Không có thông tin lịch phát sóng</span>
        <span style="font-size: 12px; color: #64748b;">Chưa có dữ liệu chương trình cho kênh này</span>
      </div>
    `;
  } else {
    dialogOptions.forEach((p, idx) => {
      const isFoc = (idx === dialogFocusedIndex && epgActiveColumn === 'schedule');
      const isPast = p.isPast;
      itemsHtml += `
        <div class="epg-schedule-item ${isPast ? 'past' : ''} ${isFoc ? 'focused' : ''}" data-prog-index="${idx}">
          <span class="epg-time-range">${p.startStr} - ${p.stopStr}</span>
          <span class="epg-item-title">${p.title}</span>
          ${p.isCurrent ? '<span class="epg-live-badge">LIVE</span>' : ''}
        </div>
      `;
    });
  }

  dlg.innerHTML = `
    <div class="dialog-card epg-schedule-card">
      <div class="dialog-title">Lịch phát sóng - ${channelName}</div>
      <div class="epg-dialog-body">
        <div class="epg-channel-sidebar" id="epg-channel-sidebar-list">${channelListHtml}</div>
        <div class="epg-schedule-panel" id="epg-schedule-scroll-list">${itemsHtml}</div>
      </div>
    </div>
  `;
  dlg.classList.add('active');

  setTimeout(() => {
    const chEl = dlg.querySelector('.epg-ch-item.selected');
    if (chEl) safeScroll(chEl, 'nearest');

    if (hasValidSchedule) {
      const curProgEl = dlg.querySelector('.epg-schedule-item.focused') || dlg.querySelector('.epg-schedule-item .epg-live-badge');
      const targetEl = curProgEl ? (curProgEl.classList.contains('epg-schedule-item') ? curProgEl : curProgEl.parentElement) : null;
      if (targetEl) safeScroll(targetEl, 'center');
    }
  }, 10);

  const chEls = dlg.querySelectorAll('.epg-ch-item');
  chEls.forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(el.getAttribute('data-ch-index'), 10);
      switchEpgChannel(idx);
    };
  });

  const progEls = dlg.querySelectorAll('.epg-schedule-item');
  progEls.forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      if (onPlayChannelCallback && curCh) {
        onPlayChannelCallback(curCh);
      }
      closeQualityAudioDialog(curCh);
    };
  });
}

function switchEpgChannel(idx) {
  if (idx < 0 || idx >= epgChannelsList.length) return;
  epgSelectedChannelIndex = idx;
  const curCh = epgChannelsList[epgSelectedChannelIndex];
  dialogOptions = getChannelFullSchedule(curCh.name);
  const currentIdx = dialogOptions.findIndex(s => s.isCurrent);
  dialogFocusedIndex = currentIdx >= 0 ? currentIdx : 0;
  renderTwoColumnEpgModal();
}

export function openQualityDialog(channel) {
  if (osdHideTimeout) clearTimeout(osdHideTimeout);
  dialogType = 'quality';
  dialogOptions = getRealVideoQualities();
  dialogFocusedIndex = dialogOptions.findIndex(o => o.active);
  if (dialogFocusedIndex < 0) dialogFocusedIndex = 0;
  isDialogOpen = true;
  renderDialogContent('Chất lượng hình ảnh');
}

export function openAudioDialog(channel) {
  if (osdHideTimeout) clearTimeout(osdHideTimeout);
  dialogType = 'audio';
  dialogOptions = getRealAudioTracks();
  dialogFocusedIndex = dialogOptions.findIndex(o => o.active);
  if (dialogFocusedIndex < 0) dialogFocusedIndex = 0;
  isDialogOpen = true;
  renderDialogContent('Kênh âm thanh');
}

export function closeQualityAudioDialog(currentChannel) {
  isDialogOpen = false;
  dialogType = null;
  const dlg = document.getElementById('quality-audio-dialog');
  if (dlg) {
    dlg.classList.remove('active');
    dlg.innerHTML = '';
  }
  if (currentChannel) {
    updateOsdInfo(currentChannel, false);
  }
}

function renderDialogContent(titleText) {
  const dlg = document.getElementById('quality-audio-dialog');
  if (!dlg) return;

  let itemsHtml = '';
  dialogOptions.forEach((opt, idx) => {
    const isFoc = (idx === dialogFocusedIndex);
    const isAct = opt.active;
    itemsHtml += `
      <div class="dialog-item ${isFoc ? 'focused' : ''} ${isAct ? 'active' : ''}" data-index="${idx}">
        <span>${opt.label}</span>
        ${isAct ? '<svg class="dialog-check-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
      </div>
    `;
  });

  dlg.innerHTML = `
    <div class="dialog-card">
      <div class="dialog-title">${titleText}</div>
      <div class="dialog-list">${itemsHtml}</div>
    </div>
  `;
  dlg.classList.add('active');

  const itemEls = dlg.querySelectorAll('.dialog-item');
  itemEls.forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(el.getAttribute('data-index'), 10);
      dialogFocusedIndex = idx;
      selectDialogCurrent();
    };
  });
}

export function navigateDialog(dir, currentChannel) {
  if (!isDialogOpen) return;

  if (dialogType === 'epg') {
    const hasValidSchedule = dialogOptions.length > 0 && dialogOptions.some(p => p.isCurrent || p.isFuture);

    if (epgActiveColumn === 'schedule') {
      if (dir === 'left' || !hasValidSchedule) {
        epgActiveColumn = 'channel';
        renderTwoColumnEpgModal();
        return;
      }
      if (dir === 'up') {
        const currentIdx = dialogOptions.findIndex(s => s.isCurrent);
        const minNavIdx = currentIdx >= 0 ? currentIdx : 0;
        if (dialogFocusedIndex > minNavIdx) {
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

  const dlg = document.getElementById('quality-audio-dialog');
  if (!dlg) return;

  const itemEls = dlg.querySelectorAll('.dialog-item');
  itemEls.forEach((el, idx) => {
    const isFoc = (idx === dialogFocusedIndex);
    el.classList.toggle('focused', isFoc);
    if (isFoc) {
      safeScroll(el, 'nearest');
    }
  });
}

function updateScheduleFocusDOM() {
  const dlg = document.getElementById('quality-audio-dialog');
  if (!dlg) return;
  const itemEls = dlg.querySelectorAll('.epg-schedule-item');
  itemEls.forEach((el, idx) => {
    const isFoc = (idx === dialogFocusedIndex);
    el.classList.toggle('focused', isFoc);
    if (isFoc) {
      safeScroll(el, 'center');
    }
  });
}

export function selectDialogCurrent() {
  if (!isDialogOpen) return;

  if (dialogType === 'epg') {
    const curCh = epgChannelsList[epgSelectedChannelIndex];
    if (curCh && onPlayChannelCallback) {
      onPlayChannelCallback(curCh);
    }
    closeQualityAudioDialog(curCh);
    return;
  }

  if (dialogOptions.length === 0) return;
  const selectedOpt = dialogOptions[dialogFocusedIndex];
  if (!selectedOpt) return;

  if (dialogType === 'quality') {
    setRealVideoQuality(selectedOpt.value);
    const pill = document.getElementById('btn-action-quality');
    if (pill) {
      const span = pill.querySelector('span');
      if (span) span.innerText = selectedOpt.label;
    }
  } else if (dialogType === 'audio') {
    setRealAudioTrack(selectedOpt.track);
    const pill = document.getElementById('btn-action-audio');
    if (pill) {
      const span = pill.querySelector('span');
      if (span) span.innerText = selectedOpt.label;
    }
  }
  closeQualityAudioDialog();
}
