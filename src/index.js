import { parseM3U } from './parser.js';
import { initPlayer, playStream, stopStream } from './player.js';
import { TV_KEYS, registerTizenKeys } from './remote.js';

const STORAGE_KEY = 'tb_iptv_drm_playlist_url';
const DEFAULT_URL = 'https://tv.vietanhtv.top/tv/';

let allChannels = [];
let filteredChannels = [];
let categories = ['Tất cả'];
let activeCategory = 'Tất cả';
let selectedIndex = 0;
let currentPlayingChannel = null;
let isSidebarVisible = true;
let isModalOpen = false;

// 1. Tạo Giao Diện Hiện Đại
function setupUI() {
  document.body.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background-color: #08090c;
        color: #f1f5f9;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
        overflow: hidden;
        user-select: none;
      }
      #video-screen {
        width: 100vw;
        height: 100vh;
        position: absolute;
        top: 0;
        left: 0;
        background: #000;
        z-index: 1;
      }
      #app-container {
        position: relative;
        z-index: 10;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
      }
      .sidebar {
        position: absolute;
        top: 30px;
        left: 30px;
        bottom: 30px;
        width: 440px;
        background: rgba(15, 23, 42, 0.92);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
        transition: transform 0.3s ease, opacity 0.3s ease;
        pointer-events: auto;
      }
      .sidebar.hidden {
        transform: translateX(-480px);
        opacity: 0;
      }
      .header-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 12px;
      }
      .header-title h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        background: linear-gradient(135deg, #38bdf8, #818cf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .category-tabs {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 6px;
      }
      .category-badge {
        padding: 6px 14px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        font-size: 13px;
        white-space: nowrap;
      }
      .category-badge.active {
        background: #3b82f6;
        color: #fff;
        font-weight: 600;
      }
      .channel-list {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-right: 4px;
      }
      .channel-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid transparent;
        border-radius: 10px;
        transition: all 0.15s ease;
      }
      .channel-card.focused {
        background: rgba(59, 130, 246, 0.25);
        border-color: #3b82f6;
        transform: scale(1.02);
      }
      .channel-card.playing {
        border-color: #10b981;
      }
      .channel-logo {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        object-fit: contain;
        background: rgba(0, 0, 0, 0.4);
      }
      .channel-info {
        flex: 1;
        overflow: hidden;
      }
      .channel-name {
        font-size: 16px;
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
        padding: 2px 6px;
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
        padding-top: 12px;
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

      /* OSD Status Bar */
      #status-bar {
        position: absolute;
        bottom: 30px;
        right: 30px;
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(12px);
        padding: 10px 20px;
        border-radius: 30px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 14px;
        color: #cbd5e1;
        z-index: 20;
      }

      /* Modal nhập Playlist */
      .modal {
        position: absolute;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
      }
      .modal-box {
        background: #1e293b;
        padding: 32px;
        border-radius: 16px;
        width: 550px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .modal-box input {
        width: 100%;
        padding: 12px;
        border-radius: 8px;
        background: #0f172a;
        border: 1px solid #334155;
        color: #fff;
        font-size: 16px;
        margin: 16px 0;
      }
    </style>

    <video id="video-screen" autoplay playsinline></video>
    
    <div id="app-container">
      <div id="sidebar" class="sidebar">
        <div class="header-title">
          <h1>TizenBrew IPTV (DRM)</h1>
          <span id="channel-count" style="font-size: 12px; color: #38bdf8;">0 kênh</span>
        </div>

        <div id="categories" class="category-tabs"></div>

        <div id="channel-list" class="channel-list"></div>

        <div class="footer-hints">
          <div class="key-hint"><span class="key-red">Đỏ</span> Đổi link</div>
          <div class="key-hint"><span class="key-green">Xanh</span> Tải lại</div>
          <div class="key-hint"><span class="key-blue">Xanh dương</span> Ẩn/Hiện Menu</div>
        </div>
      </div>

      <div id="status-bar">Sẵn sàng</div>
    </div>
  `;
}

function showStatus(text) {
  const bar = document.getElementById('status-bar');
  if (bar) bar.innerText = text;
}

// 2. Tải Playlist & Lọc Kênh
async function fetchAndLoadPlaylist(url) {
  showStatus('Đang tải danh sách kênh...');
  try {
    let cleanUrl = url.trim();
    // Khắc phục lỗi 301 chuyển hướng tự động
    if (cleanUrl.includes('tv.vietanhtv.top/tv') && !cleanUrl.endsWith('/')) {
      cleanUrl += '/';
    }

    const res = await fetch(cleanUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    allChannels = parseM3U(text);
    if (allChannels.length === 0) {
      showStatus('Không tìm thấy kênh hợp lệ trong playlist!');
      return;
    }

    // Trích xuất các danh mục
    const groupSet = new Set(['Tất cả']);
    allChannels.forEach(ch => {
      if (ch.group) groupSet.add(ch.group);
    });
    categories = Array.from(groupSet);

    renderCategories();
    filterCategory('Tất cả');
    showStatus(`Đã nạp ${allChannels.length} kênh.`);
    
    // Tự động phát kênh đầu tiên
    if (filteredChannels.length > 0) {
      selectChannel(0, true);
    }
  } catch (err) {
    console.error(err);
    showStatus(`Lỗi tải playlist: ${err.message || 'Không thể kết nối'}`);
  }
}

function renderCategories() {
  const catEl = document.getElementById('categories');
  if (!catEl) return;
  catEl.innerHTML = '';
  categories.forEach(cat => {
    const badge = document.createElement('div');
    badge.className = `category-badge ${cat === activeCategory ? 'active' : ''}`;
    badge.innerText = cat;
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

// 3. Quản lý Phím Bấm Điều Khiển
function handleKeyDown(e) {
  const key = e.keyCode;

  // Nếu đang mở popup
  if (isModalOpen) {
    if (key === TV_KEYS.RETURN || key === TV_KEYS.BACK_PC) {
      closeModal();
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
      // Chuyển nhóm danh mục sang trái
      shiftCategory(-1);
      break;

    case TV_KEYS.RIGHT:
      // Chuyển nhóm danh mục sang phải
      shiftCategory(1);
      break;

    case TV_KEYS.ENTER:
      selectChannel(selectedIndex, true);
      break;

    case TV_KEYS.BLUE:
      // Ẩn/Hiện Sidebar
      isSidebarVisible = !isSidebarVisible;
      document.getElementById('sidebar').classList.toggle('hidden', !isSidebarVisible);
      break;

    case TV_KEYS.GREEN:
      // Tải lại playlist
      const currentUrl = localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
      fetchAndLoadPlaylist(currentUrl);
      break;

    case TV_KEYS.RED:
      // Mở modal đổi link playlist
      openUrlModal();
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

function openUrlModal() {
  isModalOpen = true;
  const current = localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
  const modal = document.createElement('div');
  modal.id = 'url-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-box">
      <h2>Nhập URL Playlist M3U</h2>
      <p style="color:#94a3b8; font-size:14px;">Hỗ trợ MPEG-DASH (.mpd) và Widevine DRM</p>
      <input id="playlist-input" type="text" value="${current}" />
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button id="save-btn" style="padding:10px 20px; background:#3b82f6; color:#fff; border:none; border-radius:6px; cursor:pointer;">Lưu & Nạp</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('save-btn').onclick = () => {
    const val = document.getElementById('playlist-input').value.trim();
    if (val) {
      localStorage.setItem(STORAGE_KEY, val);
      closeModal();
      fetchAndLoadPlaylist(val);
    }
  };
}

function closeModal() {
  isModalOpen = false;
  const m = document.getElementById('url-modal');
  if (m) m.remove();
}

// 4. Khởi Chạy
async function initApp() {
  setupUI();
  registerTizenKeys();

  const video = document.getElementById('video-screen');
  try {
    await initPlayer(video, showStatus);
  } catch (err) {
    showStatus(err.message);
    return;
  }

  window.addEventListener('keydown', handleKeyDown);

  const savedUrl = localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
  fetchAndLoadPlaylist(savedUrl);
}

initApp();
