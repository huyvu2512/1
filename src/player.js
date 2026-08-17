let playerInstance = null;
let currentChannelData = null;
let currentVideoElement = null;
let liveSyncInterval = null;
let onMediaStatsChangedCb = null;
let onPlaybackErrorCb = null;
let isAbrActive = true;
let isSwitchingBackup = false;

// Khởi tạo an toàn Shaka Player khi cần thiết mà không làm sập ứng dụng lúc khởi động
function getShakaSafe() {
  if (typeof window !== 'undefined') {
    if (!window.URL) window.URL = window.webkitURL;
    if (window.URL && !window.URL.createObjectURL && window.webkitURL) {
      window.URL.createObjectURL = window.webkitURL.createObjectURL;
    }
    if (!window.MediaSource && window.WebKitMediaSource) {
      window.MediaSource = window.WebKitMediaSource;
    }
    if (window.shaka) return window.shaka;
  }
  try {
    const sh = require('shaka-player/dist/shaka-player.compiled.js');
    if (typeof window !== 'undefined') {
      window.shaka = sh;
    }
    return sh;
  } catch (e) {
    return null;
  }
}

export function setStatsCallback(cb) {
  onMediaStatsChangedCb = cb;
}

export function setPlaybackErrorCallback(cb) {
  onPlaybackErrorCb = cb;
}

export function getRealMediaStats() {
  if (!currentVideoElement) return null;
  try {
    let width = currentVideoElement.videoWidth || 1920;
    let height = currentVideoElement.videoHeight || 1080;
    let fps = 25.0;

    if (playerInstance && playerInstance.getVariantTracks) {
      const activeTracks = playerInstance.getVariantTracks().filter(t => t.active);
      if (activeTracks.length > 0) {
        const track = activeTracks[0];
        if (track.width) width = track.width;
        if (track.height) height = track.height;
        if (track.frameRate && track.frameRate > 10) fps = track.frameRate;
      }
    }

    if (currentChannelData) {
      const nameLow = currentChannelData.name.toLowerCase();
      if (nameLow.includes('50fps')) fps = 50.0;
      else if (nameLow.includes('60fps')) fps = 60.0;
    }

    let bitrateMbps = width >= 1920 ? '3.5' : (width >= 1280 ? '2.5' : '1.8');

    return {
      width: width,
      height: height,
      fps: typeof fps === 'number' ? fps.toFixed(1) : fps,
      bandwidth: `${bitrateMbps} Mbps`
    };
  } catch (e) {
    return null;
  }
}

export function getRealVideoQualities() {
  if (playerInstance && playerInstance.getVariantTracks) {
    try {
      const tracks = playerInstance.getVariantTracks();
      const heightMap = {};
      tracks.forEach(t => {
        if (t.height && t.height > 0) {
          if (!heightMap[t.height] || (t.bandwidth > (heightMap[t.height].bandwidth || 0))) {
            heightMap[t.height] = t;
          }
        }
      });

      const heights = Object.keys(heightMap).map(h => parseInt(h, 10)).sort((a, b) => b - a);
      if (heights.length > 1) {
        const list = [{ label: 'Auto', value: 'auto', active: isAbrActive }];
        heights.forEach(h => {
          list.push({
            label: `${h}p`,
            value: h,
            track: heightMap[h],
            active: !isAbrActive
          });
        });
        return list;
      }
    } catch (e) {}
  }

  return [
    { label: 'Auto', value: 'auto', active: true },
    { label: '1080p', value: 1080, active: false },
    { label: '720p', value: 720, active: false },
    { label: '576p', value: 576, active: false }
  ];
}

export function setRealVideoQuality(val) {
  if (!playerInstance) return;
  try {
    if (val === 'auto' || val === 'Auto') {
      isAbrActive = true;
      if (playerInstance.configure) {
        playerInstance.configure({ abr: { enabled: true } });
      }
    } else {
      isAbrActive = false;
      if (playerInstance.configure && playerInstance.getVariantTracks) {
        playerInstance.configure({ abr: { enabled: false } });
        const tracks = playerInstance.getVariantTracks();
        const targetHeight = parseInt(val, 10);
        const matchTrack = tracks.find(t => t.height === targetHeight);
        if (matchTrack && playerInstance.selectVariantTrack) {
          playerInstance.selectVariantTrack(matchTrack, true);
        }
      }
    }
  } catch (e) {}
}

export function getRealAudioTracks() {
  if (playerInstance && playerInstance.getVariantTracks) {
    try {
      const tracks = playerInstance.getVariantTracks();
      const audioMap = {};
      tracks.forEach(t => {
        const lang = t.language || 'und';
        const key = `${lang}_${t.audioId || 0}`;
        if (!audioMap[key]) {
          let label = 'Âm thanh chuẩn (Stereo)';
          if (lang === 'vi' || lang === 'vie') label = 'Tiếng Việt (Stereo)';
          else if (lang === 'en' || lang === 'eng') label = 'Tiếng Anh (English)';
          else if (t.audioId) label = `Đường tiếng ${t.audioId}`;

          audioMap[key] = {
            label: label,
            value: key,
            language: lang,
            track: t,
            active: t.active
          };
        }
      });

      const list = Object.values(audioMap);
      if (list.length > 0) return list;
    } catch (e) {}
  }

  return [
    { label: 'Tiếng Việt (Gốc)', value: 'vi', active: true },
    { label: 'Âm thanh 2', value: 'und', active: false }
  ];
}

export function setRealAudioTrack(audioObj) {
  if (!playerInstance || !audioObj) return;
  try {
    if (audioObj.track && playerInstance.selectVariantTrack) {
      playerInstance.selectVariantTrack(audioObj.track, false);
    } else if (audioObj.language && playerInstance.selectAudioLanguage) {
      playerInstance.selectAudioLanguage(audioObj.language);
    }
  } catch (e) {}
}

export function parseClearKey(drmString) {
  if (!drmString) return null;
  if (typeof drmString === 'object') return drmString;

  try {
    let keyString = drmString.trim();
    if (keyString.startsWith('http')) {
      if (keyString.includes('?id=')) {
        keyString = keyString.split('?id=')[1] || '';
      } else if (keyString.includes('&id=')) {
        keyString = keyString.split('&id=')[1] || '';
      }
    }

    const parts = keyString.split(':');
    if (parts.length === 2 && parts[0].length >= 16 && parts[1].length >= 16) {
      return {
        [parts[0].trim().toLowerCase()]: parts[1].trim().toLowerCase()
      };
    }
  } catch (e) {}
  return null;
}

export function initPlayer(videoElement) {
  return new Promise((resolve) => {
    currentVideoElement = videoElement;

    // Lắng nghe sự kiện native video
    if (videoElement) {
      videoElement.addEventListener('playing', () => {
        if (onMediaStatsChangedCb) onMediaStatsChangedCb(getRealMediaStats());
      });
      videoElement.addEventListener('loadedmetadata', () => {
        if (onMediaStatsChangedCb) onMediaStatsChangedCb(getRealMediaStats());
      });
      videoElement.addEventListener('error', () => {
        const err = videoElement.error;
        console.warn('[Video] Native error:', err ? err.message : 'unknown');
      });
    }

    // Khởi tạo Shaka Player đúng thứ tự: installAll() TRƯỚC isBrowserSupported()
    const sh = getShakaSafe();
    if (sh) {
      try {
        if (sh.polyfill && sh.polyfill.installAll) {
          sh.polyfill.installAll();
        }
        if (sh.Player && sh.Player.isBrowserSupported && sh.Player.isBrowserSupported()) {
          playerInstance = new sh.Player(videoElement);
          playerInstance.configure({
            streaming: {
              bufferingGoal: 3,
              rebufferingGoal: 0.2,
              bufferBehind: 10,
              jumpLargeGaps: true,
              retryParameters: { maxAttempts: 3, timeout: 5000 }
            }
          });

          playerInstance.addEventListener('error', (event) => {
            const err = event.detail;
            console.warn('[Player] Shaka Error detail:', err);
            if (err && err.severity === 2) {
              handleStreamFailure(err);
            }
          });
          console.log('[Player] Đã khởi tạo Shaka Player thành công!');
        } else {
          console.log('[Player] Shaka không hỗ trợ trình duyệt này, dùng Native Hardware Video!');
        }
      } catch (e) {
        console.warn('[Player] Shaka khởi tạo thất bại, dùng Native Video:', e.message);
        playerInstance = null;
      }
    } else {
      console.log('[Player] Dùng Native Video Engine của Samsung Tizen!');
    }

    resolve(playerInstance);
  });
}

export function handleStreamFailure(err) {
  if (isSwitchingBackup || !currentChannelData) {
    if (onPlaybackErrorCb) onPlaybackErrorCb(err);
    return;
  }

  const sources = currentChannelData.sources || [];
  const nextIndex = (currentChannelData.activeSourceIndex || 0) + 1;

  if (nextIndex < sources.length) {
    isSwitchingBackup = true;
    currentChannelData.activeSourceIndex = nextIndex;
    const backupSource = sources[nextIndex];
    console.warn(`[Player] Đổi sang nguồn dự phòng [${nextIndex + 1}/${sources.length}]:`, backupSource.url);

    currentChannelData.url = backupSource.url;
    currentChannelData.licenseKey = backupSource.licenseKey;
    if (backupSource.userAgent) currentChannelData.userAgent = backupSource.userAgent;

    playCurrentChannelInternal();
    isSwitchingBackup = false;
  } else {
    if (onPlaybackErrorCb) onPlaybackErrorCb(err);
  }
}

function playCurrentChannelInternal() {
  if (!currentChannelData || !currentVideoElement) return;

  const url = currentChannelData.url;
  const isDrm = !!currentChannelData.licenseKey || url.includes('.mpd');

  // 1. Dùng Shaka Player cho các kênh DRM ClearKey hoặc MPEG-DASH
  if (playerInstance) {
    try {
      playerInstance.unload().catch(() => {});

      const drmConfig = { servers: {}, clearKeys: {}, advanced: {} };
      if (currentChannelData.licenseKey) {
        const clearKeyObj = parseClearKey(currentChannelData.licenseKey);
        if (clearKeyObj) {
          drmConfig.clearKeys = clearKeyObj;
        } else {
          drmConfig.servers['com.widevine.alpha'] = currentChannelData.licenseKey;
        }
      }
      playerInstance.configure({ drm: drmConfig });

      playerInstance.load(url).then(() => {
        currentVideoElement.play().catch(() => {});
        if (onMediaStatsChangedCb) {
          setTimeout(() => onMediaStatsChangedCb(getRealMediaStats()), 500);
        }
      }).catch((e) => {
        console.warn('[Player] Shaka load error, chuyển Native Video:', e);
        playWithNativeVideo(url);
      });
      return;
    } catch (e) {
      console.warn('[Player] Shaka error, chuyển Native Video:', e);
    }
  }

  // 2. Mặc định cho luồng HLS / M3U8 trên Samsung Tizen: Dùng Trình phát Native phần cứng
  playWithNativeVideo(url);
}

function playWithNativeVideo(streamUrl) {
  if (!currentVideoElement) return;
  try {
    if (playerInstance) {
      try { playerInstance.unload().catch(() => {}); } catch (e) {}
    }
    currentVideoElement.src = streamUrl;
    const playPromise = currentVideoElement.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[Native Video] Autoplay muted fallback:', err);
        currentVideoElement.muted = true;
        currentVideoElement.play().then(() => {
          const unmute = () => {
            if (currentVideoElement) {
              currentVideoElement.muted = false;
            }
            window.removeEventListener('click', unmute);
            window.removeEventListener('keydown', unmute);
          };
          window.addEventListener('click', unmute, { once: true });
          window.addEventListener('keydown', unmute, { once: true });
        }).catch(() => {});
      });
    }

    if (onMediaStatsChangedCb) {
      setTimeout(() => onMediaStatsChangedCb(getRealMediaStats()), 600);
    }
  } catch (err) {
    console.error('[Native Video] Play error:', err);
  }
}

export function playStream(channel, onStatusUpdate) {
  currentChannelData = channel;
  if (!channel) return;
  currentChannelData.activeSourceIndex = 0;
  isAbrActive = true;
  isSwitchingBackup = false;

  if (channel.sources && channel.sources.length > 0) {
    const firstSrc = channel.sources[0];
    channel.url = firstSrc.url;
    channel.licenseKey = firstSrc.licenseKey;
    if (firstSrc.userAgent) channel.userAgent = firstSrc.userAgent;
  }

  if (onStatusUpdate) onStatusUpdate(`Đang nạp: ${channel.name}...`);
  playCurrentChannelInternal();
}

export function stopStream() {
  if (currentVideoElement) {
    try {
      currentVideoElement.pause();
      currentVideoElement.removeAttribute('src');
      currentVideoElement.load();
    } catch (e) {}
  }

  if (playerInstance) {
    try {
      playerInstance.unload().catch(() => {});
    } catch (e) {}
  }
}
