import { injectStyles } from './styles.js';
import { 
  updateOsdInfo, 
  updateLiveVideoSpecs, 
  showCenterPlayPause, 
  setOpenDrawerCallback, 
  setPlayChannelCallback,
  setupPillClickEvents, 
  navigateActionBar, 
  executeActionPill,
  isOsdVisible,
  isQualityOrAudioDialogOpen,
  navigateDialog,
  selectDialogCurrent,
  closeQualityAudioDialog
} from './osd.js';
import { 
  initDrawerState, 
  renderCategories, 
  renderChannels, 
  nextCategory, 
  prevCategory, 
  nextChannel, 
  prevChannel, 
  getCurrentChannels, 
  getCurrentChannelIndex, 
  setCurrentChannelIndex, 
  getCurrentSelectedChannel, 
  updateWindowsClock,
  isSearchFocused,
  blurSearchInput,
  focusSearchInput,
  clearSearch,
  getSearchQuery
} from './drawer.js';
import { loadAndMergePlaylists } from './sources.js';
import { initPlayer, playStream, stopStream, setStatsCallback, setPlaybackErrorCallback, handleStreamFailure } from './player.js';
import { loadEPG } from './epg.js';
import { TV_KEYS, registerTizenKeys } from './remote.js';

let allChannels = [];
let currentPlayingChannel = null;
let isDrawerOpen = true;
let playbackTimeout = null;
let isPlayerReady = false;

function setupDOM() {
  injectStyles();

  document.body.innerHTML = `
    <video id="video-screen" class="pip-right" autoplay playsinline></video>

    <!-- LAYER ICON PLAY/PAUSE LỚN Ở GIỮA -->
    <div id="center-state-layer" class="pip-right">
      <div class="center-state-circle">
        <svg id="center-state-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </div>
    </div>

    <!-- SPINNER XOAY TRÒN TRẮNG LÚC NẠP VIDEO -->
    <div id="video-spinner-layer" class="pip-right active">
      <div class="white-video-spinner"></div>
    </div>

    <!-- KHUNG THÔNG BÁO OFFLINE -->
    <div id="video-error-layer" class="pip-right">
      <div class="error-container-box">
        <div class="error-title-main">
          <span class="err-white">IPTV Player</span>
          <span class="err-cyan">DRM</span>
        </div>
        <div class="error-channel-text">KÊNH HIỆN TẠI KHÔNG KHẢ DỤNG</div>
      </div>
    </div>

    <!-- BẢNG DANH SÁCH KÊNH TỐI GIẢN ĐEN XÁM (MẶC ĐỊNH MỞ) -->
    <div id="tivimate-drawer" class="open">
      <div class="drawer-header">
        <div class="drawer-top-row">
          <div class="app-title-badge">
            <span class="title-white">IPTV Player</span>
            <span class="title-cyan">DRM</span>
          </div>
          <div class="win-clock-badge">
            <div id="drawer-time" class="win-time">--:--:--</div>
            <div id="drawer-date" class="win-date">--/--/----</div>
          </div>
        </div>

        <!-- KHUNG TÌM KIẾM KÊNH -->
        <div class="drawer-search-wrapper">
          <div class="search-input-box" id="drawer-search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="channel-search-input" placeholder="Tìm kiếm kênh..." autocomplete="off" spellcheck="false" />
            <button id="search-clear-btn" class="search-clear-btn" style="display:none;" title="Xóa">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div id="category-nav-bar" class="category-nav-bar"></div>
      </div>

      <div id="drawer-channel-list" class="drawer-channel-list"></div>
    </div>

    <!-- KHUNG OSD BANNER DƯỚI -->
    <div id="dl-osd-banner" class="pip-right active">
      <!-- HÀNG 1: THÔNG TIN KÊNH + LIVE + SPECS -->
      <div class="osd-main-row">
        <div class="osd-left-info">
          <div id="osd-logo" class="osd-logo-box"></div>
          <div class="osd-text-col">
            <div id="osd-channel-name" class="osd-ch-name">Đang tải danh sách...</div>
            <div id="osd-program-name" class="osd-prog-name" style="display:none;"></div>
          </div>
        </div>
        <div class="osd-right-info">
          <span class="osd-live-tag">LIVE</span>
          <span id="osd-specs" class="osd-specs-text">1920x1080 @ 25.0fps | 3.5 Mbps</span>
        </div>
      </div>

      <!-- HÀNG 2: TIMELINE -->
      <div id="osd-timeline-row" class="osd-timeline-row" style="display:none;">
        <span id="osd-start-time" class="osd-time-bound">00:00</span>
        <div class="osd-timeline-track">
          <div id="osd-progress-bar" class="osd-timeline-fill" style="width: 0%;"></div>
        </div>
        <span id="osd-stop-time" class="osd-time-bound">00:45</span>
      </div>

      <!-- HÀNG 3: CÁC NÚT VIÊN THUỐC ĐIỀU KHIỂN -->
      <div class="osd-action-pills-row" style="display: none;">
        <button id="btn-action-drawer" class="bottom-pill-btn focused">
          <svg viewBox="0 0 24 24"><path d="M16 12H3"/><path d="M16 18H3"/><path d="M16 6H3"/><path d="M21 12h.01"/><path d="M21 18h.01"/><path d="M21 6h.01"/></svg>
          <span>Danh sách kênh</span>
        </button>
        <button id="btn-action-epg" class="bottom-pill-btn">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Lịch phát sóng</span>
        </button>
        <button id="btn-action-quality" class="bottom-pill-btn">
          <svg viewBox="0 0 24 24"><path d="M10 12H6"/><path d="M10 15V9"/><path d="M14 14.5a.5.5 0 0 0 .5.5h1a2.5 2.5 0 0 0 2.5-2.5v-1A2.5 2.5 0 0 0 15.5 9h-1a.5.5 0 0 0-.5.5z"/><path d="M6 15V9"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg>
          <span>Auto</span>
        </button>
        <button id="btn-action-audio" class="bottom-pill-btn">
          <svg viewBox="0 0 24 24"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>
          <span>Âm thanh</span>
        </button>
      </div>
    </div>

    <!-- POPUP CHỌN LỊCH PHÁT SÓNG 2 CỘT, CHẤT LƯỢNG VÀ ÂM THANH (GÓC PHẢI) -->
    <div id="quality-audio-dialog"></div>
  `;

  setupPillClickEvents(() => currentPlayingChannel, () => allChannels);
  setOpenDrawerCallback(openDrawer);
  setPlayChannelCallback(playSelectedChannel);
}

function showVideoSpinner() {
  const spinner = document.getElementById('video-spinner-layer');
  const errorLayer = document.getElementById('video-error-layer');
  if (errorLayer) errorLayer.classList.remove('active');
  if (spinner) spinner.classList.add('active');
}

function hideVideoSpinner() {
  const spinner = document.getElementById('video-spinner-layer');
  if (spinner) spinner.classList.remove('active');
}

function showPlaybackError() {
  hideVideoSpinner();
  const errorLayer = document.getElementById('video-error-layer');
  if (errorLayer) errorLayer.classList.add('active');
  const osdSpecs = document.getElementById('osd-specs');
  if (osdSpecs) osdSpecs.innerText = 'Offline';
}

function hidePlaybackError() {
  const errorLayer = document.getElementById('video-error-layer');
  if (errorLayer) errorLayer.classList.remove('active');
}

function playSelectedChannel(ch) {
  if (!ch) return;
  currentPlayingChannel = ch;
  showCenterPlayPause(null);
  hidePlaybackError();
  showVideoSpinner();
  updateOsdInfo(ch, isDrawerOpen);
  renderChannels();

  if (playbackTimeout) clearTimeout(playbackTimeout);
  playbackTimeout = setTimeout(() => {
    const video = document.getElementById('video-screen');
    if (!video || video.paused || video.readyState < 2) {
      if (ch.sources && ch.sources.length > 1 && (ch.activeSourceIndex || 0) + 1 < ch.sources.length) {
        handleStreamFailure(new Error('Timeout'));
      } else {
        showPlaybackError();
      }
    }
  }, 7000);

  playStream(ch);
}

function openDrawer() {
  isDrawerOpen = true;
  const drawer = document.getElementById('tivimate-drawer');
  const video = document.getElementById('video-screen');
  const osdBanner = document.getElementById('dl-osd-banner');
  const centerLayer = document.getElementById('center-state-layer');
  const spinner = document.getElementById('video-spinner-layer');
  const errorLayer = document.getElementById('video-error-layer');

  if (drawer) drawer.classList.add('open');
  if (video) video.classList.add('pip-right');
  if (osdBanner) osdBanner.classList.add('pip-right');
  if (centerLayer) centerLayer.classList.add('pip-right');
  if (spinner) spinner.classList.add('pip-right');
  if (errorLayer) errorLayer.classList.add('pip-right');

  renderCategories();
  renderChannels();
  if (currentPlayingChannel) {
    updateOsdInfo(currentPlayingChannel, true);
  }
}

function closeDrawer() {
  isDrawerOpen = false;
  blurSearchInput();
  const drawer = document.getElementById('tivimate-drawer');
  const video = document.getElementById('video-screen');
  const osdBanner = document.getElementById('dl-osd-banner');
  const centerLayer = document.getElementById('center-state-layer');
  const spinner = document.getElementById('video-spinner-layer');
  const errorLayer = document.getElementById('video-error-layer');

  if (drawer) drawer.classList.remove('open');
  if (video) video.classList.remove('pip-right');
  if (osdBanner) osdBanner.classList.remove('pip-right');
  if (centerLayer) centerLayer.classList.remove('pip-right');
  if (spinner) spinner.classList.remove('pip-right');
  if (errorLayer) errorLayer.classList.remove('pip-right');

  if (currentPlayingChannel) {
    updateOsdInfo(currentPlayingChannel, false);
  }
}

function togglePlayPause() {
  const video = document.getElementById('video-screen');
  if (!video) return;
  if (video.paused) {
    video.play();
    showCenterPlayPause('play');
  } else {
    video.pause();
    showCenterPlayPause('pause');
  }
}

function autoPlayFirstChannel() {
  const channels = getCurrentChannels();
  if (channels.length === 0) return;

  let targetChannel = channels[0];
  const lastIndex = localStorage.getItem('last_channel_index');
  if (lastIndex !== null) {
    const parsed = parseInt(lastIndex, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed < channels.length) {
      targetChannel = channels[parsed];
      setCurrentChannelIndex(parsed);
    }
  }

  playSelectedChannel(targetChannel);
}

function handleKeyDown(e) {
  const key = e.keyCode;

  if ([TV_KEYS.UP, TV_KEYS.DOWN, TV_KEYS.LEFT, TV_KEYS.RIGHT, 8, 27, TV_KEYS.RETURN, TV_KEYS.BACK_PC, TV_KEYS.INFO, TV_KEYS.PLAY, TV_KEYS.PAUSE, TV_KEYS.PLAY_PAUSE].includes(key)) {
    if (!isSearchFocused() || key !== 8) {
      e.preventDefault();
    }
  }

  // 1. KHI POPUP CHỌN LỊCH PHÁT SÓNG / CHẤT LƯỢNG / ÂM THANH ĐANG MỞ
  if (isQualityOrAudioDialogOpen()) {
    if (key === TV_KEYS.LEFT) {
      navigateDialog('left', currentPlayingChannel);
      return;
    }
    if (key === TV_KEYS.RIGHT) {
      navigateDialog('right', currentPlayingChannel);
      return;
    }
    if (key === TV_KEYS.UP) {
      navigateDialog('up', currentPlayingChannel);
      return;
    }
    if (key === TV_KEYS.DOWN) {
      navigateDialog('down', currentPlayingChannel);
      return;
    }
    if (key === TV_KEYS.ENTER) {
      selectDialogCurrent();
      return;
    }
    if (key === TV_KEYS.BACK_PC || key === TV_KEYS.RETURN || key === 8 || key === 27) {
      closeQualityAudioDialog(currentPlayingChannel);
      return;
    }
    return;
  }

  const channels = getCurrentChannels();

  // 2. KHI ĐANG Ở CHẾ ĐỘ TOÀN MÀN HÌNH (FULLSCREEN)
  if (!isDrawerOpen) {
    if (key === TV_KEYS.LEFT) {
      if (isOsdVisible()) {
        navigateActionBar('left', currentPlayingChannel);
      } else {
        if (currentPlayingChannel) updateOsdInfo(currentPlayingChannel, false);
      }
      return;
    }
    if (key === TV_KEYS.RIGHT) {
      if (isOsdVisible()) {
        navigateActionBar('right', currentPlayingChannel);
      } else {
        if (currentPlayingChannel) updateOsdInfo(currentPlayingChannel, false);
      }
      return;
    }

    if (key === TV_KEYS.ENTER) {
      if (isOsdVisible()) {
        executeActionPill(currentPlayingChannel, allChannels);
      } else {
        togglePlayPause();
      }
      return;
    }

    if (key === TV_KEYS.PLAY || key === TV_KEYS.PAUSE || key === TV_KEYS.PLAY_PAUSE) {
      togglePlayPause();
      return;
    }

    if (key === TV_KEYS.UP) {
      let curIdx = getCurrentChannelIndex();
      if (curIdx > 0) {
        setCurrentChannelIndex(curIdx - 1);
        playSelectedChannel(channels[curIdx - 1]);
      }
      return;
    }
    if (key === TV_KEYS.DOWN) {
      let curIdx = getCurrentChannelIndex();
      if (curIdx < channels.length - 1) {
        setCurrentChannelIndex(curIdx + 1);
        playSelectedChannel(channels[curIdx + 1]);
      }
      return;
    }

    if (key === TV_KEYS.INFO) {
      if (currentPlayingChannel) updateOsdInfo(currentPlayingChannel, false);
      return;
    }

    if (key === TV_KEYS.BACK_PC || key === TV_KEYS.RETURN || key === 27 || key === 8) {
      openDrawer();
      return;
    }

    return;
  }

  // 3. KHI MENU ĐANG MỞ
  if (isSearchFocused()) {
    if (key === TV_KEYS.DOWN) {
      blurSearchInput();
      return;
    }
    if (key === TV_KEYS.ENTER) {
      blurSearchInput();
      const ch = getCurrentSelectedChannel();
      if (ch) playSelectedChannel(ch);
      return;
    }
    if (key === TV_KEYS.BACK_PC || key === TV_KEYS.RETURN || key === 27) {
      if (getSearchQuery()) {
        clearSearch();
      } else {
        blurSearchInput();
        closeDrawer();
      }
      return;
    }
    return;
  }

  switch (key) {
    case TV_KEYS.UP:
      prevChannel();
      break;
    case TV_KEYS.DOWN:
      nextChannel();
      break;
    case TV_KEYS.LEFT:
      prevCategory();
      break;
    case TV_KEYS.RIGHT:
      nextCategory();
      break;
    case TV_KEYS.ENTER:
      const ch = getCurrentSelectedChannel();
      if (ch) playSelectedChannel(ch);
      break;
    case TV_KEYS.BACK_PC:
    case TV_KEYS.RETURN:
    case 27:
    case 8:
      if (getSearchQuery()) {
        clearSearch();
      } else {
        closeDrawer();
      }
      break;
  }
}

function initApp() {
  try {
    setupDOM();
    updateWindowsClock();
    setInterval(updateWindowsClock, 1000);
    registerTizenKeys();
  } catch (e) {
    console.error('[App] Init DOM error:', e);
  }

  const video = document.getElementById('video-screen');

  if (video) {
    video.addEventListener('waiting', () => showVideoSpinner());
    video.addEventListener('seeking', () => showVideoSpinner());
    video.addEventListener('loadstart', () => showVideoSpinner());
    video.addEventListener('playing', () => {
      if (playbackTimeout) clearTimeout(playbackTimeout);
      hidePlaybackError();
      hideVideoSpinner();
    });
    video.addEventListener('canplay', () => {
      if (playbackTimeout) clearTimeout(playbackTimeout);
      hidePlaybackError();
      hideVideoSpinner();
    });
    video.addEventListener('timeupdate', () => {
      if (video.currentTime > 0.1) {
        if (playbackTimeout) clearTimeout(playbackTimeout);
        hidePlaybackError();
        hideVideoSpinner();
      }
    });
  }

  try {
    initPlayer(video).then(() => {
      isPlayerReady = true;
    }).catch(err => {
      console.warn('[App] Init player non-fatal error:', err);
      isPlayerReady = true;
    });
  } catch (e) {
    console.warn('[App] Player init failed:', e);
  }

  setStatsCallback((stats) => {
    updateLiveVideoSpecs(stats);
  });

  setPlaybackErrorCallback((err) => {
    showPlaybackError();
  });

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('beforeunload', () => stopStream());
  window.addEventListener('pagehide', () => stopStream());

  // Bắt đầu nạp danh sách kênh ngay lập tức
  loadAndMergePlaylists((data) => {
    allChannels = data.allChannels || [];
    initDrawerState(data, (ch) => {
      playSelectedChannel(ch);
    });

    openDrawer();
    autoPlayFirstChannel();

    loadEPG(() => {
      renderChannels();
      if (currentPlayingChannel) {
        updateOsdInfo(currentPlayingChannel, isDrawerOpen);
      }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
