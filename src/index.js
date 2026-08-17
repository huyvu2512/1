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
  hideOsdBar,
  isQualityOrAudioDialogOpen,
  navigateDialog,
  selectDialogCurrent,
  closeQualityAudioDialog
} from './osd.js';
import { 
  initDrawerState, 
  renderCategories, 
  renderChannels, 
  updateDrawerEpgProgress,
  nextCategory, 
  prevCategory, 
  nextChannel, 
  prevChannel, 
  getCurrentChannels, 
  getCurrentChannelIndex, 
  setCurrentChannelIndex, 
  getCurrentSelectedChannel, 
  updateWindowsClock,
  isSearchBoxFocused,
  focusSearchBox,
  blurSearchBox,
  isSearchEditing,
  startSearchEditing,
  stopSearchEditing,
  clearSearch,
  getSearchQuery
} from './drawer.js';
import { loadAndMergePlaylists } from './sources.js';
import { initPlayer, playStream, stopStream, setStatsCallback, setPlaybackErrorCallback, handleStreamFailure } from './player.js';
import { loadEPG } from './epg.js';
import { TV_KEYS, registerTizenKeys } from './remote.js';

var APP_VERSION = 'v2.1';

var allChannels = [];
var currentPlayingChannel = null;
var isDrawerOpen = true;
var playbackTimeout = null;
var isPlayerInitialized = false;
var isAppStarted = false;

function isReturnOrEscKey(key) {
  return key === 10009 || key === 27 || key === 8 || key === 461 || key === TV_KEYS.RETURN || key === TV_KEYS.BACK_PC;
}

function isOkOrEnterKey(key) {
  return key === 13 || key === 32 || key === TV_KEYS.ENTER || key === TV_KEYS.SPACE;
}

function setupDOM() {
  injectStyles();

  var statusTextEl = document.getElementById('status-text');
  if (statusTextEl) {
    statusTextEl.style.display = 'none';
  }

  var app = document.getElementById('app-container');
  if (!app) {
    app = document.createElement('div');
    app.id = 'app-container';
    document.body.appendChild(app);
  }

  app.innerHTML = 
    '<video id="video-screen" class="pip-right" autoplay playsinline></video>' +
    '<div id="center-state-layer" class="pip-right"><div class="center-state-circle" id="center-state-icon"></div></div>' +
    '<div id="video-spinner-layer" class="pip-right"><div class="white-video-spinner"></div></div>' +
    '<div id="video-error-layer" class="pip-right">' +
      '<div class="error-container-box">' +
        '<div class="error-title-main"><span class="err-white">IPTV</span><span class="err-cyan">DRM</span></div>' +
        '<div class="error-channel-text">Kênh này đang tạm dừng hoặc lỗi nguồn phát</div>' +
      '</div>' +
    '</div>' +
    '<div id="tivimate-drawer" class="open">' +
      '<div class="drawer-header">' +
        '<div class="drawer-top-row">' +
          '<div class="app-title-badge">' +
            '<span class="title-white">IPTV</span>' +
            '<span class="title-cyan">DRM</span>' +
            '<span style="font-size: 11px; color: #f97316; margin-left: 6px; font-weight: 700;">' + APP_VERSION + '</span>' +
          '</div>' +
          '<div class="win-clock-badge">' +
            '<div id="drawer-time" class="win-time">--:--:--</div>' +
            '<div id="drawer-date" class="win-date">--/--/----</div>' +
          '</div>' +
        '</div>' +
        '<div class="drawer-search-wrapper">' +
          '<div class="search-input-box" id="drawer-search-box">' +
            '<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="11" cy="11" r="8"></circle>' +
              '<line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
            '</svg>' +
            '<input type="text" id="channel-search-input" placeholder="Tìm kiếm kênh..." autocomplete="off" spellcheck="false" />' +
            '<button id="search-clear-btn" class="search-clear-btn" style="display:none;" title="Xóa">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                '<line x1="18" y1="6" x2="6" y2="18"></line>' +
                '<line x1="6" y1="6" x2="18" y2="18"></line>' +
              '</svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div id="category-nav-bar" class="category-nav-bar"></div>' +
      '</div>' +
      '<div id="drawer-channel-list" class="drawer-channel-list"></div>' +
    '</div>' +
    '<div id="dl-osd-banner" class="pip-right active">' +
      '<div class="osd-main-row">' +
        '<div class="osd-left-info">' +
          '<div id="osd-logo" class="osd-logo-box"></div>' +
          '<div class="osd-text-col">' +
            '<div id="osd-channel-name" class="osd-ch-name">Đang tải danh sách...</div>' +
            '<div id="osd-program-name" class="osd-prog-name" style="display:none;"></div>' +
          '</div>' +
        '</div>' +
        '<div class="osd-right-info">' +
          '<span class="osd-live-tag">LIVE</span>' +
          '<span id="osd-specs" class="osd-specs-text">1920x1080 @ 25.0fps | 3.5 Mbps</span>' +
        '</div>' +
      '</div>' +
      '<div id="osd-timeline-row" class="osd-timeline-row" style="display:none;">' +
        '<span id="osd-start-time" class="osd-time-bound">00:00</span>' +
        '<div class="osd-timeline-track">' +
          '<div id="osd-progress-bar" class="osd-timeline-fill" style="width: 0%;"></div>' +
        '</div>' +
        '<span id="osd-stop-time" class="osd-time-bound">00:45</span>' +
      '</div>' +
      '<div class="osd-action-pills-row" style="display: none;">' +
        '<button id="btn-action-drawer" class="bottom-pill-btn focused">' +
          '<svg viewBox="0 0 24 24"><path d="M16 12H3"/><path d="M16 18H3"/><path d="M16 6H3"/><path d="M21 12h.01"/><path d="M21 18h.01"/><path d="M21 6h.01"/></svg>' +
          '<span>Danh sách kênh</span>' +
        '</button>' +
        '<button id="btn-action-epg" class="bottom-pill-btn">' +
          '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' +
          '<span>Lịch phát sóng</span>' +
        '</button>' +
        '<button id="btn-action-quality" class="bottom-pill-btn">' +
          '<svg viewBox="0 0 24 24"><path d="M10 12H6"/><path d="M10 15V9"/><path d="M14 14.5a.5.5 0 0 0 .5.5h1a2.5 2.5 0 0 0 2.5-2.5v-1A2.5 2.5 0 0 0 15.5 9h-1a.5.5 0 0 0-.5.5z"/><path d="M6 15V9"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg>' +
          '<span>Auto</span>' +
        '</button>' +
        '<button id="btn-action-audio" class="bottom-pill-btn">' +
          '<svg viewBox="0 0 24 24"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>' +
          '<span>Âm thanh</span>' +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div id="quality-audio-dialog"></div>';

  setupPillClickEvents(function() { return currentPlayingChannel; }, function() { return allChannels; });
  setOpenDrawerCallback(openDrawer);
  setPlayChannelCallback(playSelectedChannel);
}

function showVideoSpinner() {
  var spinner = document.getElementById('video-spinner-layer');
  var errorLayer = document.getElementById('video-error-layer');
  if (errorLayer) errorLayer.classList.remove('active');
  if (spinner) spinner.classList.add('active');
}

function hideVideoSpinner() {
  var spinner = document.getElementById('video-spinner-layer');
  if (spinner) spinner.classList.remove('active');
}

function showPlaybackError() {
  hideVideoSpinner();
  var errorLayer = document.getElementById('video-error-layer');
  if (errorLayer) errorLayer.classList.add('active');
  var osdSpecs = document.getElementById('osd-specs');
  if (osdSpecs) osdSpecs.innerText = 'Offline';
}

function hidePlaybackError() {
  var errorLayer = document.getElementById('video-error-layer');
  if (errorLayer) errorLayer.classList.remove('active');
}

function playSelectedChannel(ch) {
  if (!ch) return;
  currentPlayingChannel = ch;
  showCenterPlayPause(null);
  hidePlaybackError();
  showVideoSpinner();
  updateOsdInfo(ch, isDrawerOpen);

  if (playbackTimeout) clearTimeout(playbackTimeout);
  playbackTimeout = setTimeout(function() {
    var video = document.getElementById('video-screen');
    if (!video || video.paused || video.readyState < 2) {
      if (ch.sources && ch.sources.length > 1 && (ch.activeSourceIndex || 0) + 1 < ch.sources.length) {
        handleStreamFailure(new Error('Timeout'));
      } else {
        showPlaybackError();
      }
    }
  }, 10000);

  playStream(ch);
}

function openDrawer() {
  isDrawerOpen = true;
  var drawer = document.getElementById('tivimate-drawer');
  var video = document.getElementById('video-screen');
  var osdBanner = document.getElementById('dl-osd-banner');
  var centerLayer = document.getElementById('center-state-layer');
  var spinner = document.getElementById('video-spinner-layer');
  var errorLayer = document.getElementById('video-error-layer');

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
  blurSearchBox();
  var drawer = document.getElementById('tivimate-drawer');
  var video = document.getElementById('video-screen');
  var osdBanner = document.getElementById('dl-osd-banner');
  var centerLayer = document.getElementById('center-state-layer');
  var spinner = document.getElementById('video-spinner-layer');
  var errorLayer = document.getElementById('video-error-layer');

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
  var video = document.getElementById('video-screen');
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
  var channels = getCurrentChannels();
  if (channels.length === 0) return;

  var targetChannel = channels[0];
  var lastIndex = localStorage.getItem('last_channel_index');
  if (lastIndex !== null) {
    var parsed = parseInt(lastIndex, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed < channels.length) {
      targetChannel = channels[parsed];
      setCurrentChannelIndex(parsed);
    }
  }

  playSelectedChannel(targetChannel);
}

function handleKeyDown(e) {
  var key = e.keyCode;
  var navKeys = [TV_KEYS.UP, TV_KEYS.DOWN, TV_KEYS.LEFT, TV_KEYS.RIGHT, 8, 27, 32, 461, TV_KEYS.RETURN, TV_KEYS.BACK_PC, TV_KEYS.INFO, TV_KEYS.PLAY, TV_KEYS.PAUSE, TV_KEYS.PLAY_PAUSE];

  if (navKeys.indexOf(key) !== -1) {
    if (!isSearchEditing() || (key !== 8 && key !== 32)) {
      e.preventDefault();
    }
  }

  // 1. KHI POPUP LỊCH PHÁT SÓNG / CHẤT LƯỢNG / ÂM THANH ĐANG MỞ
  if (isQualityOrAudioDialogOpen()) {
    if (isReturnOrEscKey(key)) {
      closeQualityAudioDialog(currentPlayingChannel);
      return;
    }
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
    if (isOkOrEnterKey(key)) {
      selectDialogCurrent();
      return;
    }
    return;
  }

  var channels = getCurrentChannels();

  // 2. KHI ĐANG Ở CHẾ ĐỘ TOÀN MÀN HÌNH (FULLSCREEN)
  if (!isDrawerOpen) {
    if (isReturnOrEscKey(key)) {
      // Bấm Return / ESC khi đang full màn hình -> Bật Menu danh sách kênh bên trái
      if (isOsdVisible()) hideOsdBar();
      openDrawer();
      return;
    }

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

    if (isOkOrEnterKey(key)) {
      if (isOsdVisible()) {
        executeActionPill(currentPlayingChannel, allChannels);
      } else {
        // Mở thanh điều khiển OSD khi đang xem toàn màn hình
        if (currentPlayingChannel) updateOsdInfo(currentPlayingChannel, false);
      }
      return;
    }

    if (key === TV_KEYS.PLAY || key === TV_KEYS.PAUSE || key === TV_KEYS.PLAY_PAUSE) {
      togglePlayPause();
      return;
    }

    if (key === TV_KEYS.UP) {
      var curIdx = getCurrentChannelIndex();
      if (curIdx > 0) {
        setCurrentChannelIndex(curIdx - 1);
        playSelectedChannel(channels[curIdx - 1]);
      }
      return;
    }
    if (key === TV_KEYS.DOWN) {
      var curIdx = getCurrentChannelIndex();
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

    return;
  }

  // 3. KHI ĐANG TRONG TRẠNG THÁI GÕ BÀN PHÍM ẢO TÌM KIẾM
  if (isSearchEditing()) {
    if (key === TV_KEYS.DOWN || key === 13) {
      stopSearchEditing();
      blurSearchBox();
      var ch = getCurrentSelectedChannel();
      if (ch) playSelectedChannel(ch);
      return;
    }
    if (isReturnOrEscKey(key)) {
      if (getSearchQuery()) {
        clearSearch();
      } else {
        stopSearchEditing();
        blurSearchBox();
        closeDrawer();
      }
      return;
    }
    return;
  }

  // 4. KHI ĐANG FOCUS VIỀN SÁNG VÀO Ô TÌM KIẾM (CHƯA GÕ PHÍM)
  if (isSearchBoxFocused()) {
    if (isOkOrEnterKey(key)) {
      startSearchEditing();
      return;
    }
    if (key === TV_KEYS.DOWN) {
      nextChannel();
      return;
    }
    if (key === TV_KEYS.LEFT) {
      prevCategory();
      return;
    }
    if (key === TV_KEYS.RIGHT) {
      nextCategory();
      return;
    }
    if (isReturnOrEscKey(key)) {
      if (getSearchQuery()) {
        clearSearch();
      } else {
        blurSearchBox();
        closeDrawer();
      }
      return;
    }
    return;
  }

  // 5. KHI MENU DANH SÁCH KÊNH ĐANG HOẠT ĐỘNG
  if (isOkOrEnterKey(key)) {
    var selectedCh = getCurrentSelectedChannel();
    if (selectedCh) playSelectedChannel(selectedCh);
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
    default:
      if (isReturnOrEscKey(key)) {
        if (getSearchQuery()) {
          clearSearch();
        } else {
          closeDrawer(); // Đóng menu kênh, về toàn màn hình
        }
      }
      break;
  }
}

function startApplication() {
  if (isAppStarted) return;
  isAppStarted = true;

  try {
    setupDOM();
    updateWindowsClock();
    
    // Tự động làm mới đồng hồ, thanh tiến độ phát sóng và chương trình EPG liên tục mỗi 4 giây
    setInterval(function() {
      updateWindowsClock();
      updateDrawerEpgProgress();
      if (currentPlayingChannel) {
        updateOsdInfo(currentPlayingChannel, isDrawerOpen);
      }
    }, 4000);

    // Tự động cập nhật lại file XMLTV EPG mới nhất sau mỗi 30 phút
    setInterval(function() {
      loadEPG(function() {
        renderChannels();
      });
    }, 30 * 60 * 1000);

    registerTizenKeys();
  } catch (err) {
    console.error('[App] DOM setup error:', err);
  }

  var video = document.getElementById('video-screen');

  if (video) {
    video.addEventListener('waiting', function() { showVideoSpinner(); });
    video.addEventListener('seeking', function() { showVideoSpinner(); });
    video.addEventListener('loadstart', function() { showVideoSpinner(); });
    video.addEventListener('playing', function() {
      if (playbackTimeout) clearTimeout(playbackTimeout);
      hidePlaybackError();
      hideVideoSpinner();
    });
    video.addEventListener('canplay', function() {
      if (playbackTimeout) clearTimeout(playbackTimeout);
      hidePlaybackError();
      hideVideoSpinner();
    });
    video.addEventListener('timeupdate', function() {
      if (video.currentTime > 0.1) {
        if (playbackTimeout) clearTimeout(playbackTimeout);
        hidePlaybackError();
        hideVideoSpinner();
      }
    });
  }

  if (video) {
    try {
      initPlayer(video).then(function() {
        isPlayerInitialized = true;
      }).catch(function(err) {
        console.warn('[App] Shaka Player warning:', err);
        isPlayerInitialized = true;
      });
    } catch (e) {
      console.warn('[App] Player init failed:', e);
    }
  }

  setStatsCallback(function(stats) {
    updateLiveVideoSpecs(stats);
  });

  setPlaybackErrorCallback(function(err) {
    showPlaybackError();
  });

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('beforeunload', function() { stopStream(); });
  window.addEventListener('pagehide', function() { stopStream(); });

  loadAndMergePlaylists(function(data) {
    allChannels = data.allChannels || [];
    initDrawerState(data, function(ch) {
      playSelectedChannel(ch);
    });

    openDrawer();
    autoPlayFirstChannel();

    loadEPG(function() {
      renderChannels();
      if (currentPlayingChannel) {
        updateOsdInfo(currentPlayingChannel, isDrawerOpen);
      }
    });
  });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  startApplication();
} else {
  window.addEventListener('DOMContentLoaded', startApplication);
  window.addEventListener('load', startApplication);
}
