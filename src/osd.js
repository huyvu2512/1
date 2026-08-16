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

let isDialogOpen = false;
let dialogType = null; // 'quality' | 'audio' | 'epg'
let dialogOptions = [];
let dialogFocusedIndex = 0;

const ACTION_BUTTONS = ['btn-action-drawer', 'btn-action-epg', 'btn-action-quality', 'btn-action-audio'];

export function setOpenDrawerCallback(cb) {
  onOpenDrawerCallback = cb;
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
  const startTimeEl = document.getElementById('osd-start-time');
  const stopTimeEl = document.getElementById('osd-stop-time');
  const progressFillEl = document.getElementById('osd-progress-bar');
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
    if (progNameEl) progNameEl.innerHTML = `<div class="skeleton-box skeleton-title" style="width: 140px; height: 12px;"></div>`;
    if (startTimeEl) startTimeEl.innerText = '--:--';
    if (stopTimeEl) stopTimeEl.innerText = '--:--';
    if (progressFillEl) progressFillEl.style.width = '0%';
  } else if (epg && epg.current && epg.current.title) {
    if (progNameEl) progNameEl.innerText = epg.current.title;
    if (startTimeEl) startTimeEl.innerText = epg.current.startTimeStr;
    if (stopTimeEl) stopTimeEl.innerText = epg.current.stopTimeStr;
    if (progressFillEl) progressFillEl.style.width = `${epg.current.progressPercent}%`;
  } else {
    if (progNameEl) progNameEl.innerText = 'CHƯƠNG TRÌNH ĐANG PHÁT';
    if (startTimeEl) startTimeEl.innerText = '--:--';
    if (stopTimeEl) stopTimeEl.innerText = '--:--';
    if (progressFillEl) progressFillEl.style.width = '0%';
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

export function executeActionPill(currentChannel) {
  if (currentActionIndex === 0) {
    if (onOpenDrawerCallback) onOpenDrawerCallback();
  } else if (currentActionIndex === 1) {
    openEpgScheduleDialog(currentChannel);
  } else if (currentActionIndex === 2) {
    openQualityDialog();
  } else if (currentActionIndex === 3) {
    openAudioDialog();
  }
}

export function setupPillClickEvents(getCurrentChannelCb) {
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
      if (ch) openEpgScheduleDialog(ch);
    };
  }
  if (btnQuality) {
    btnQuality.onclick = (e) => {
      e.stopPropagation();
      currentActionIndex = 2;
      updateActionPillFocus();
      openQualityDialog();
    };
  }
  if (btnAudio) {
    btnAudio.onclick = (e) => {
      e.stopPropagation();
      currentActionIndex = 3;
      updateActionPillFocus();
      openAudioDialog();
    };
  }
}

export function isQualityOrAudioDialogOpen() {
  return isDialogOpen;
}

export function openEpgScheduleDialog(channel) {
  if (!channel) return;
  dialogType = 'epg';
  const schedules = getChannelFullSchedule(channel.name);
  dialogOptions = schedules;
  dialogFocusedIndex = schedules.findIndex(s => s.isCurrent);
  if (dialogFocusedIndex < 0) dialogFocusedIndex = 0;
  isDialogOpen = true;
  renderEpgScheduleContent(channel.name);
}

function renderEpgScheduleContent(channelName) {
  const dlg = document.getElementById('quality-audio-dialog');
  if (!dlg) return;

  let itemsHtml = '';
  if (dialogOptions.length === 0) {
    itemsHtml = `<div style="padding: 24px; text-align: center; color: #64748b; font-size: 13.5px; font-weight: 600;">Chưa có dữ liệu lịch phát sóng cho kênh này</div>`;
  } else {
    dialogOptions.forEach((p, idx) => {
      const isFoc = (idx === dialogFocusedIndex);
      itemsHtml += `
        <div class="epg-schedule-item ${p.isCurrent ? 'current' : ''} ${isFoc ? 'focused' : ''}" data-index="${idx}">
          <span class="epg-time-range">${p.startStr} - ${p.stopStr}</span>
          <span class="epg-item-title">${p.title}</span>
          ${p.isCurrent ? '<span class="epg-live-badge">LIVE</span>' : ''}
        </div>
      `;
    });
  }

  dlg.innerHTML = `
    <div class="dialog-card">
      <div class="dialog-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <span>Lịch phát sóng - ${channelName}</span>
      </div>
      <div class="dialog-list" id="epg-schedule-scroll-list">${itemsHtml}</div>
    </div>
  `;
  dlg.classList.add('active');

  const curEl = dlg.querySelector('.epg-schedule-item.current, .epg-schedule-item.focused');
  if (curEl) {
    curEl.scrollIntoView({ block: 'nearest' });
  }

  const itemEls = dlg.querySelectorAll('.epg-schedule-item');
  itemEls.forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      closeQualityAudioDialog();
    };
  });
}

export function openQualityDialog() {
  dialogType = 'quality';
  dialogOptions = getRealVideoQualities();
  dialogFocusedIndex = dialogOptions.findIndex(o => o.active);
  if (dialogFocusedIndex < 0) dialogFocusedIndex = 0;
  isDialogOpen = true;
  renderDialogContent('Chất lượng hình ảnh');
}

export function openAudioDialog() {
  dialogType = 'audio';
  dialogOptions = getRealAudioTracks();
  dialogFocusedIndex = dialogOptions.findIndex(o => o.active);
  if (dialogFocusedIndex < 0) dialogFocusedIndex = 0;
  isDialogOpen = true;
  renderDialogContent('Kênh âm thanh (Audio)');
}

export function closeQualityAudioDialog() {
  isDialogOpen = false;
  dialogType = null;
  const dlg = document.getElementById('quality-audio-dialog');
  if (dlg) {
    dlg.classList.remove('active');
    dlg.innerHTML = '';
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
        ${isAct ? '<span style="color:#f97316;font-weight:900;">✓</span>' : ''}
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

export function navigateDialog(dir, currentChannelName) {
  if (!isDialogOpen || dialogOptions.length === 0) return;
  if (dir === 'up') {
    if (dialogFocusedIndex > 0) dialogFocusedIndex--;
  } else if (dir === 'down') {
    if (dialogFocusedIndex < dialogOptions.length - 1) dialogFocusedIndex++;
  }

  if (dialogType === 'epg') {
    renderEpgScheduleContent(currentChannelName || 'Kênh');
  } else {
    renderDialogContent(dialogType === 'quality' ? 'Chất lượng hình ảnh' : 'Kênh âm thanh (Audio)');
  }
}

export function selectDialogCurrent() {
  if (!isDialogOpen || dialogOptions.length === 0) return;

  if (dialogType === 'epg') {
    closeQualityAudioDialog();
    return;
  }

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
