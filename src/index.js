import { parseM3U } from './parser.js';
import { initPlayer, playStream, stopStream } from './player.js';
import { TV_KEYS, registerTizenKeys } from './remote.js';

const STORAGE_KEY = 'tb_iptv_drm_playlist_url';
const WORKER_URL = 'https://w-iptv-setup.dvt-kisu.workers.dev';

let allChannels = [];
let filteredChannels = [];
let categories = ['Tất cả'];
let activeCategory = 'Tất cả';
let selectedIndex = 0;
let currentPlayingChannel = null;
let isSidebarVisible = true;
let setupTimer = null;
let setupCode = '';

// Helper tạo mã code ngẫu nhiên
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

// XHR Helper tương thích tốt với Tizen Web
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

// Giao diện chính của Trình phát IPTV
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
        user-select: none;
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
        top: 24px; left: 24px; bottom: 24px;
        width: 420px;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
      }
      .sidebar.hidden {
        transform: translateX(-460px);
      }
      .header-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .header-title h1 {
        font-size: 20px;
        font-weight: 700;
        background: linear-gradient(135deg, #38bdf8, #818cf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .category-tabs {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
      }
      .category-badge {
        padding: 6px 14px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        font-size: 13px;
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
        gap: 12px;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid transparent;
        border-radius: 10px;
        cursor: pointer;
      }
      .channel-card.focused {
        background: rgba(37, 99, 235, 0.25);
        border-color: #3b82f6;
        transform: scale(1.01);
      }
      .channel-card.playing {
        border-color: #10b981;
      }
      .channel-logo {
        width: 40px; height: 40px;
        border-radius: 6px;
        object-fit: contain;
        background: rgba(0, 0, 0, 0.4);
      }
      .channel-info {
        flex: 1;
        overflow: hidden;
      }
      .channel-name {
        font-size: 15px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .channel-tag {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 2px;
      }
      .drm-badge {
        font-size: 10px;
        padding: 2px 5px;
        border-radius: 4px;
        background: #f59e0b;
        color: #000;
        font-weight: 700;
      }
      .footer-hints {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #94a3b8;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 10px;
      }
      .key-hint span {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: bold;
        color: #fff;
        margin-right: 4px;
      }
      .key-red { background: #ef4444; }
      .key-green { background: #10b981; }
      .key-blue { background: #3b82f6; }

      #status-bar {
        position: absolute;
        bottom: 24px; right: 24px;
        background: rgba(15, 23, 42, 0.9);
        padding: 8px 18px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 13px;
        color: #94a3b8;
        z-index: 20;
      }

      /* Màn hình QR Setup */
      #qr-screen {
        position: absolute;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(10, 15, 30, 0.96);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 100;
        text-align: center;
      }
      .qr-box {
        background: #fff;
        padding: 14px;
        border-radius: 12px;
        margin-bottom: 20px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      }
      .qr-code-text {
        font-size: 28px;
        font-weight: 800;
        color: #38bdf8;
        letter-spacing: 2px;
        margin: 10px 0;
      }
    </style>

    <video id="video-screen" autoplay playsinline></video>
    
    <div id="main-app">
      <div id="sidebar" class="sidebar">
        <div class="header-title">
          <h1>TizenBrew IPTV (DRM)</h1>
          <span id="channel-count" style="font-size: 12px; color: #38bdf8;">0 kênh</span>
        </div>

        <div id="categories" class="category-tabs"></div>
        <div id="channel-list" class="channel-list"></div>

        <div class="footer-hints">
          <div class="key-hint"><span class="key-red">Đỏ</span> Quét QR</div>
          <div class="key-hint"><span class="key-green">Xanh lá</span> Tải lại</div>
          <div class="key-hint"><span class="key-blue">Xanh dương</span> Ẩn/Hiện</div>
        </div>
      </div>

      <div id="status-bar">Đang khởi động...</div>
    </div>
  `;
}

function showStatus(text) {
  const bar = document.getElementById('status-bar');
  if (bar) bar.innerText = text;
}

// Hiển thị màn hình Quét QR để nạp playlist từ điện thoại
function showQRSetup() {
  stopSetupPolling();
  setupCode = generateCode();
  const setupUrl = `${WORKER_URL}/setup?code=${setupCode}`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(setupUrl)}`;

  const modal = document.createElement('div');
  modal.id = 'qr-screen';
  modal.innerHTML = `
    <h1 style="font-size: 26px; margin-bottom: 8px;">Cài đặt Danh sách Kênh M3U</h1>
    <p style="color: #94a3b8; font-size: 16px; margin-bottom: 20px; max-width: 500px;">
      Dùng camera điện thoại quét mã QR bên dưới để dán link Playlist M3U:
    </p>
    <div class="qr-box">
      <img src="${qrImgUrl}" width="220" height="220" alt="QR Code" />
    </div>
    <div style="font-size: 14px; color: #cbd5e1;">Mã kết nối:</div>
    <div class="qr-code-text">${setupCode}</div>
    <p style="color: #64748b; font-size: 13px; margin-top: 14px;">(Bấm phím <b>Return/Back</b> trên remote hoặc <b>Esc</b> để quay lại)</p>
  `;
  document.body.appendChild(modal);

  startSetupPolling();
}

function closeQRSetup() {
  stopSetupPolling();
  const modal = document.getElementById('qr-screen');
  if (modal) modal.remove();
}

function startSetupPolling() {
  setupTimer = setInterval(() => {
    if (!setupCode) return;
    xhrGet(`${WORKER_URL}/api/config?code=${encodeURIComponent(setupCode)}`, (err, data) => {
      if (err || !data) return;
      try {
        const json = JSON.parse(data);
        if (json && json.url) {
          console.log('[QR Sync] Nhận được link M3U từ điện thoại:', json.url);
          localStorage.setItem(STORAGE_KEY, json.url);
          closeQRSetup();
          fetchAndLoadPlaylist(json.url);
        }
      } catch (e) {}
    });
  }, 2000);
}

function stopSetupPolling() {
  if (setupTimer) {
    clearInterval(setupTimer);
    setupTimer = null;
  }
}

// Tải danh sách phát M3U
function fetchAndLoadPlaylist(url) {
  showStatus('Đang tải danh sách kênh...');
  let cleanUrl = url.trim();

  // Helper tải qua proxy nếu bị lỗi CORS
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
  const countEl = document.getElementById('channel-count');
  if (!listEl) return;

  if (countEl) countEl.innerText = `${filteredChannels.length} kênh`;
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

// Xử lý phím Remote TV & Bàn phím Máy Tính
function handleKeyDown(e) {
  const key = e.keyCode;

  // Nếu đang ở màn hình QR
  if (document.getElementById('qr-screen')) {
    if (key === TV_KEYS.RETURN || key === TV_KEYS.BACK_PC) {
      closeQRSetup();
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
      showQRSetup();
      break;

    case TV_KEYS.GREEN:
      const cur = localStorage.getItem(STORAGE_KEY);
      if (cur) fetchAndLoadPlaylist(cur);
      else showQRSetup();
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
    // Nếu chưa có playlist, hiện màn hình QR để quét từ điện thoại
    showQRSetup();
  }
}

initApp();
