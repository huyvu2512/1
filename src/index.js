import { parseM3U } from './parser.js';
import { initPlayer, playStream, stopStream } from './player.js';
import { TV_KEYS, registerTizenKeys } from './remote.js';

const STORAGE_KEY = 'tb_iptv_drm_playlist_url';

let allChannels = [];
let filteredChannels = [];
let categories = ['Tất cả'];
let activeCategory = 'Tất cả';
let selectedIndex = 0;
let currentPlayingChannel = null;
let isSidebarVisible = true;
let isModalOpen = false;

// XHR Helper
function xhrGet(url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, xhr.responseText);
      } else {
        callback(new Error(`HTTP ${xhr.status}`), null);
      }
    }
  };
  xhr.onerror = function () {
    callback(new Error('Network error (CORS hoặc mất mạng)'), null);
  };
  try {
    xhr.send();
  } catch (e) {
    callback(e, null);
  }
}

function setupUI() {
  document.body.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        background: #090a0f;
        color: #f8fafc;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
        height: 100vh;
        overflow: hidden;
      }
      #video-screen {
        position: absolute;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: #000;
        z-index: 1;
      }
      #main-app {
        position: relative;
        z-index: 10;
        width: 100vw; height: 100vh;
        pointer-events: none;
      }
      .sidebar {
        position: absolute;
        top: 20px; left: 20px; bottom: 20px;
        width: 400px;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
        transition: transform 0.25s ease;
        pointer-events: auto;
      }
      .sidebar.hidden {
        transform: translateX(-440px);
      }
      .header-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .header-title h1 {
        font-size: 18px;
        font-weight: 700;
        background: linear-gradient(135deg, #38bdf8, #818cf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .btn-add {
        background: #2563eb;
        color: #fff;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        font-weight: 600;
      }
      .category-tabs {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 4px;
      }
      .category-badge {
        padding: 5px 12px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        font-size: 12px;
        white-space: nowrap;
        cursor: pointer;
      }
      .category-badge.active {
        background: #2563eb;
        color: #fff;
        font-weight: 600;
      }
      .channel-list {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .channel-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid transparent;
        border-radius: 8px;
        cursor: pointer;
      }
      .channel-card.focused {
        background: rgba(37, 99, 235, 0.25);
        border-color: #3b82f6;
      }
      .channel-card.playing {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.15);
      }
      .channel-logo {
        width: 36px; height: 36px;
        border-radius: 6px;
        object-fit: contain;
        background: rgba(0, 0, 0, 0.4);
      }
      .channel-info {
        flex: 1;
        overflow: hidden;
      }
      .channel-name {
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .channel-tag {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 2px;
      }
      .drm-badge {
        font-size: 9px;
        padding: 1px 4px;
        border-radius: 3px;
        background: #f59e0b;
        color: #000;
        font-weight: 700;
      }
      .footer-hints {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #94a3b8;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 8px;
      }

      #status-bar {
        position: absolute;
        bottom: 20px; right: 20px;
        background: rgba(15, 23, 42, 0.9);
        padding: 8px 16px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 13px;
        color: #94a3b8;
        z-index: 20;
      }

      /* Modal Nhập Link M3U Thủ Công */
      .modal {
        position: absolute;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(10, 15, 30, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        pointer-events: auto;
      }
      .modal-box {
        background: #1e293b;
        padding: 28px;
        border-radius: 16px;
        width: 600px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
      }
      .modal-box h2 {
        font-size: 20px;
        margin-bottom: 8px;
      }
      .modal-box input {
        width: 100%;
        padding: 12px 14px;
        border-radius: 8px;
        background: #0f172a;
        border: 1px solid #334155;
        color: #fff;
        font-size: 15px;
        margin: 14px 0;
        outline: none;
      }
      .modal-box input:focus {
        border-color: #38bdf8;
      }
      .quick-links {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .quick-btn {
        background: #334155;
        border: none;
        color: #cbd5e1;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
      }
      .quick-btn:hover {
        background: #475569;
        color: #fff;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      .modal-actions button {
        padding: 10px 18px;
        border-radius: 8px;
        border: none;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-cancel {
        background: #334155;
        color: #fff;
      }
      .btn-load {
        background: #2563eb;
        color: #fff;
      }
    </style>

    <video id="video-screen" autoplay playsinline></video>
    
    <div id="main-app">
      <div id="sidebar" class="sidebar">
        <div class="header-title">
          <h1>IPTV DRM Player</h1>
          <button id="btn-open-modal" class="btn-add">Đổi Playlist</button>
        </div>

        <div id="categories" class="category-tabs"></div>
        <div id="channel-list" class="channel-list"></div>

        <div class="footer-hints">
          <span>Phím Đỏ: Đổi Link</span>
          <span>Xanh lá: Tải lại</span>
          <span>Xanh dương: Ẩn/Hiện</span>
        </div>
      </div>

      <div id="status-bar">Đang khởi động...</div>
    </div>
  `;

  document.getElementById('btn-open-modal').onclick = () => openInputModal();
}

function showStatus(text) {
  const bar = document.getElementById('status-bar');
  if (bar) bar.innerText = text;
}

// Modal nhập link M3U thủ công
function openInputModal() {
  isModalOpen = true;
  const current = localStorage.getItem(STORAGE_KEY) || 'https://tv.vietanhtv.top/tv/';

  const modal = document.createElement('div');
  modal.id = 'input-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-box">
      <h2>Thêm / Đổi Playlist IPTV (M3U)</h2>
      <p style="color: #94a3b8; font-size: 13px;">Dán đường link file M3U (hỗ trợ MPD, HLS, Widevine DRM):</p>
      
      <input id="playlist-url-input" type="text" placeholder="https://..." value="${current}" />

      <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">Chọn nhanh link mẫu để test:</div>
      <div class="quick-links">
        <button class="quick-btn" onclick="document.getElementById('playlist-url-input').value='https://tv.vietanhtv.top/tv/'">VietAnhTV (DRM)</button>
        <button class="quick-btn" onclick="document.getElementById('playlist-url-input').value='https://raw.githubusercontent.com/iptv-org/iptv/master/streams/vn.m3u'">IPTV-Org VN (HLS)</button>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" id="btn-modal-cancel">Hủy</button>
        <button class="btn-load" id="btn-modal-load">Tải Playlist</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btn-modal-cancel').onclick = () => closeInputModal();
  document.getElementById('btn-modal-load').onclick = () => {
    const val = document.getElementById('playlist-url-input').value.trim();
    if (val) {
      localStorage.setItem(STORAGE_KEY, val);
      closeInputModal();
      fetchAndLoadPlaylist(val);
    }
  };

  const input = document.getElementById('playlist-url-input');
  input.focus();
  input.onkeydown = (e) => {
    if (e.keyCode === 13) { // Enter
      document.getElementById('btn-modal-load').click();
    }
  };
}

function closeInputModal() {
  isModalOpen = false;
  const m = document.getElementById('input-modal');
  if (m) m.remove();
}

// Tải playlist M3U
function fetchAndLoadPlaylist(url) {
  showStatus('Đang tải danh sách kênh...');
  let cleanUrl = url.trim();
  if (cleanUrl.indexOf('tv.vietanhtv.top/tv') !== -1 && cleanUrl.slice(-1) !== '/') {
    cleanUrl += '/';
  }

  function tryFetch(targetUrl, isProxy = false) {
    xhrGet(targetUrl, (err, text) => {
      if (err) {
        if (!isProxy) {
          console.warn('Direct load failed, trying CORS proxy...');
          tryFetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, true);
        } else {
          showStatus(`Lỗi tải playlist: ${err.message}`);
        }
        return;
      }

      allChannels = parseM3U(text);
      if (allChannels.length === 0) {
        showStatus('Không tìm thấy kênh hợp lệ trong playlist');
        return;
      }

      const groupSet = new Set(['Tất cả']);
      allChannels.forEach(ch => {
        if (ch.group) groupSet.add(ch.group);
      });
      categories = Array.from(groupSet);

      renderCategories();
      filterCategory('Tất cả');
      showStatus(`Đã nạp ${allChannels.length} kênh.`);

      if (filteredChannels.length > 0) {
        selectChannel(0, true);
      }
    });
  }

  tryFetch(cleanUrl);
}

function renderCategories() {
  const catEl = document.getElementById('categories');
  if (!catEl) return;
  catEl.innerHTML = '';
  categories.forEach(cat => {
    const badge = document.createElement('div');
    badge.className = `category-badge ${cat === activeCategory ? 'active' : ''}`;
    badge.innerText = cat;
    badge.onclick = () => filterCategory(cat);
    catEl.appendChild(badge);
  });
}

function filterCategory(categoryName) {
  activeCategory = categoryName;
  if (categoryName === 'Tất cả') {
    filteredChannels = allChannels;
  } else {
    filteredChannels = allChannels.filter(c => c.group === categoryName);
  }

  selectedIndex = 0;
  renderChannelList();
  renderCategories();
}

function renderChannelList() {
  const listEl = document.getElementById('channel-list');
  if (!listEl) return;

  listEl.innerHTML = '';
  filteredChannels.forEach((ch, idx) => {
    const card = document.createElement('div');
    card.className = `channel-card ${idx === selectedIndex ? 'focused' : ''} ${currentPlayingChannel === ch ? 'playing' : ''}`;

    const logoImg = ch.logo ? `<img class="channel-logo" src="${ch.logo}" alt="logo" onerror="this.style.display='none'"/>` : '';
    const drmTag = ch.licenseKey ? `<span class="drm-badge">DRM</span>` : '';

    card.innerHTML = `
      ${logoImg}
      <div class="channel-info">
        <div class="channel-name">${ch.name}</div>
        <div class="channel-tag">${ch.group} ${drmTag}</div>
      </div>
    `;

    card.onclick = () => selectChannel(idx, true);
    listEl.appendChild(card);
  });

  updateFocus();
}

function updateFocus() {
  const cards = document.querySelectorAll('.channel-card');
  cards.forEach((c, idx) => {
    c.classList.toggle('focused', idx === selectedIndex);
    if (idx === selectedIndex) {
      c.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

async function selectChannel(idx, playImmediately = false) {
  if (idx < 0 || idx >= filteredChannels.length) return;
  selectedIndex = idx;
  updateFocus();

  if (playImmediately) {
    currentPlayingChannel = filteredChannels[idx];
    renderChannelList();
    await playStream(currentPlayingChannel, showStatus);
  }
}

// Xử lý phím bấm điều khiển
function handleKeyDown(e) {
  const key = e.keyCode;

  if (isModalOpen) {
    if (key === TV_KEYS.RETURN || key === TV_KEYS.BACK_PC) {
      closeInputModal();
    }
    return;
  }

  switch (key) {
    case TV_KEYS.UP:
      if (selectedIndex > 0) {
        selectedIndex--;
        updateFocus();
      }
      break;

    case TV_KEYS.DOWN:
      if (selectedIndex < filteredChannels.length - 1) {
        selectedIndex++;
        updateFocus();
      }
      break;

    case TV_KEYS.LEFT:
      shiftCategory(-1);
      break;

    case TV_KEYS.RIGHT:
      shiftCategory(1);
      break;

    case TV_KEYS.ENTER:
      selectChannel(selectedIndex, true);
      break;

    case TV_KEYS.RED:
      openInputModal();
      break;

    case TV_KEYS.GREEN:
      const cur = localStorage.getItem(STORAGE_KEY);
      if (cur) fetchAndLoadPlaylist(cur);
      else openInputModal();
      break;

    case TV_KEYS.BLUE:
      isSidebarVisible = !isSidebarVisible;
      document.getElementById('sidebar').classList.toggle('hidden', !isSidebarVisible);
      break;

    case TV_KEYS.STOP:
      stopStream();
      showStatus('Đã dừng phát');
      break;
  }
}

function shiftCategory(direction) {
  let idx = categories.indexOf(activeCategory);
  idx = (idx + direction + categories.length) % categories.length;
  filterCategory(categories[idx]);
}

async function initApp() {
  setupUI();
  registerTizenKeys();

  const video = document.getElementById('video-screen');
  try {
    await initPlayer(video, showStatus);
  } catch (err) {
    showStatus(err.message);
  }

  window.addEventListener('keydown', handleKeyDown);

  const savedUrl = localStorage.getItem(STORAGE_KEY);
  if (savedUrl) {
    fetchAndLoadPlaylist(savedUrl);
  } else {
    // Hiện popup nhập link nếu chưa có
    openInputModal();
  }
}

initApp();
