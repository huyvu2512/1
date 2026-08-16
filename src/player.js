import shaka from 'shaka-player/dist/shaka-player.compiled.js';

let playerInstance = null;
let currentChannelData = null;
let currentVideoElement = null;
let liveSyncInterval = null;
let onMediaStatsChangedCb = null;
let onPlaybackErrorCb = null;
let isAbrActive = true;
let isSwitchingBackup = false;

export function setStatsCallback(cb) {
  onMediaStatsChangedCb = cb;
}

export function setPlaybackErrorCallback(cb) {
  onPlaybackErrorCb = cb;
}

export function getRealMediaStats() {
  if (!playerInstance || !currentVideoElement) return null;
  try {
    const activeTracks = playerInstance.getVariantTracks ? playerInstance.getVariantTracks().filter(t => t.active) : [];
    const track = activeTracks.length > 0 ? activeTracks[0] : null;

    const width = (track && track.width) || currentVideoElement.videoWidth || 1920;
    const height = (track && track.height) || currentVideoElement.videoHeight || 1080;
    
    let fps = 25.0;
    if (track && track.frameRate && track.frameRate > 10) {
      fps = track.frameRate;
    } else if (currentChannelData) {
      const nameLow = currentChannelData.name.toLowerCase();
      if (nameLow.includes('50fps')) fps = 50.0;
      else if (nameLow.includes('60fps')) fps = 60.0;
      else fps = 25.0;
    }

    let bitrateMbps = '3.5';
    if (track && track.videoBandwidth) {
      bitrateMbps = (track.videoBandwidth / 1000000).toFixed(1);
    } else if (track && track.bandwidth && track.bandwidth < 20000000) {
      bitrateMbps = (track.bandwidth / 1000000).toFixed(1);
    } else {
      bitrateMbps = width >= 1920 ? '3.5' : (width >= 1280 ? '2.5' : '1.8');
    }

    return {
      width,
      height,
      fps: typeof fps === 'number' ? fps.toFixed(1) : fps,
      bandwidth: `${bitrateMbps} Mbps`
    };
  } catch (e) {
    return null;
  }
}

/**
 * Lấy danh sách độ phân giải video thực tế từ stream Shaka
 */
export function getRealVideoQualities() {
  if (!playerInstance) {
    return [{ label: 'Auto', active: true }, { label: '1080p', active: false }, { label: '720p', active: false }, { label: '480p', active: false }];
  }

  try {
    const tracks = playerInstance.getVariantTracks ? playerInstance.getVariantTracks() : [];
    const heightMap = new Map();

    tracks.forEach(t => {
      if (t.height && t.height > 0) {
        if (!heightMap.has(t.height) || (t.bandwidth > (heightMap.get(t.height).bandwidth || 0))) {
          heightMap.set(t.height, t);
        }
      }
    });

    const sortedHeights = Array.from(heightMap.keys()).sort((a, b) => b - a);

    const activeTrack = tracks.find(t => t.active);
    const activeHeight = activeTrack ? activeTrack.height : null;

    const list = [
      { label: 'Auto', value: 'auto', active: isAbrActive }
    ];

    sortedHeights.forEach(h => {
      list.push({
        label: `${h}p`,
        value: h,
        track: heightMap.get(h),
        active: !isAbrActive && (activeHeight === h)
      });
    });

    if (list.length === 1) {
      return [{ label: 'Auto', value: 'auto', active: true }, { label: '1080p', value: 1080, active: false }, { label: '720p', value: 720, active: false }, { label: '480p', value: 480, active: false }];
    }

    return list;
  } catch (e) {
    return [{ label: 'Auto', value: 'auto', active: true }, { label: '1080p', value: 1080, active: false }, { label: '720p', value: 720, active: false }, { label: '480p', value: 480, active: false }];
  }
}

/**
 * Thiết lập độ phân giải video
 */
export function setRealVideoQuality(val) {
  if (!playerInstance) return;
  try {
    if (val === 'auto' || val === 'Auto') {
      isAbrActive = true;
      playerInstance.configure({ abr: { enabled: true } });
    } else {
      isAbrActive = false;
      playerInstance.configure({ abr: { enabled: false } });
      const tracks = playerInstance.getVariantTracks();
      const targetHeight = parseInt(val, 10);
      const matchTrack = tracks.find(t => t.height === targetHeight);
      if (matchTrack) {
        playerInstance.selectVariantTrack(matchTrack, true);
      }
    }
  } catch (e) {
    console.error('Lỗi chọn chất lượng video:', e);
  }
}

/**
 * Lấy danh sách đường tiếng (Audio tracks) thực tế
 */
export function getRealAudioTracks() {
  if (!playerInstance) {
    return [{ label: 'Tiếng Việt (Gốc)', value: 'vi', active: true }, { label: 'Âm thanh 2', value: 'und', active: false }];
  }

  try {
    const tracks = playerInstance.getVariantTracks ? playerInstance.getVariantTracks() : [];
    const audioMap = new Map();

    tracks.forEach(t => {
      const lang = t.language || 'und';
      const key = `${lang}_${t.audioId || 0}`;
      if (!audioMap.has(key)) {
        let label = 'Âm thanh chuẩn (Stereo)';
        if (lang === 'vi' || lang === 'vie') label = 'Tiếng Việt (Stereo)';
        else if (lang === 'en' || lang === 'eng') label = 'Tiếng Anh (English)';
        else if (t.audioId) label = `Đường tiếng ${t.audioId}`;

        audioMap.set(key, {
          label: label,
          value: key,
          language: lang,
          track: t,
          active: t.active
        });
      }
    });

    const list = Array.from(audioMap.values());
    if (list.length === 0) {
      return [{ label: 'Âm thanh chuẩn (Stereo)', value: 'default', active: true }];
    }
    return list;
  } catch (e) {
    return [{ label: 'Âm thanh chuẩn (Stereo)', value: 'default', active: true }];
  }
}

/**
 * Chọn đường tiếng (Audio)
 */
export function setRealAudioTrack(audioObj) {
  if (!playerInstance || !audioObj) return;
  try {
    if (audioObj.track) {
      playerInstance.selectVariantTrack(audioObj.track, false);
    } else if (audioObj.language) {
      playerInstance.selectAudioLanguage(audioObj.language);
    }
  } catch (e) {
    console.error('Lỗi đổi audio track:', e);
  }
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
  } catch (e) {
    console.error('Lỗi parse ClearKey:', e);
  }
  return null;
}

export async function initPlayer(videoElement, onStatusUpdate) {
  try {
    currentVideoElement = videoElement;
    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
      if (onStatusUpdate) onStatusUpdate('Trình duyệt không hỗ trợ Shaka Player.');
      return null;
    }

    playerInstance = new shaka.Player(videoElement);

    playerInstance.configure({
      streaming: {
        bufferingGoal: 2,
        rebufferingGoal: 0.1,
        bufferBehind: 6,
        jumpLargeGaps: true,
        stallEnabled: true,
        stallThreshold: 1,
        stallSkip: 0.5,
        alwaysStreamText: false,
        retryParameters: {
          maxAttempts: 2,
          baseDelay: 200,
          timeout: 3000
        }
      },
      manifest: {
        dash: {
          autoCorrectDrift: true,
          ignoreSuggestedPresentationDelay: true,
          initialSegmentLimit: 1
        },
        retryParameters: {
          maxAttempts: 2,
          timeout: 3000
        }
      },
      abr: {
        enabled: true,
        defaultBandwidthEstimate: 500000,
        switchInterval: 2,
        bandwidthUpgradeTarget: 0.7,
        bandwidthDowngradeTarget: 0.9
      }
    });

    playerInstance.getNetworkingEngine().registerRequestFilter((type, request) => {
      const ua = (currentChannelData && currentChannelData.userAgent) 
        ? currentChannelData.userAgent 
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      
      request.headers['User-Agent'] = ua;

      if (currentChannelData && currentChannelData.url) {
        try {
          request.headers['Referer'] = new URL(currentChannelData.url).origin + '/';
        } catch (e) {}
      }
      request.allowCrossSiteCredentials = false;
    });

    playerInstance.addEventListener('adaptation', () => {
      if (onMediaStatsChangedCb) onMediaStatsChangedCb(getRealMediaStats());
    });

    playerInstance.addEventListener('variantchanged', () => {
      if (onMediaStatsChangedCb) onMediaStatsChangedCb(getRealMediaStats());
    });

    videoElement.addEventListener('loadedmetadata', () => {
      if (onMediaStatsChangedCb) onMediaStatsChangedCb(getRealMediaStats());
    });

    videoElement.addEventListener('playing', () => {
      if (onMediaStatsChangedCb) onMediaStatsChangedCb(getRealMediaStats());
    });

    playerInstance.addEventListener('error', (event) => {
      const err = event.detail;
      if (err.severity === 2) {
        console.error('🚨 Shaka Fatal Error:', err);
        handleStreamFailure(err);
      } else {
        console.warn('⚠️ Shaka Warning (Auto-recovered):', err);
      }
    });

    if (liveSyncInterval) clearInterval(liveSyncInterval);
    liveSyncInterval = setInterval(() => {
      if (!currentVideoElement || !playerInstance || playerInstance.isLive() === false) return;
      if (currentVideoElement.paused || currentVideoElement.seeking) return;

      try {
        const seekRange = playerInstance.seekRange();
        if (seekRange && seekRange.end) {
          const delay = seekRange.end - currentVideoElement.currentTime;
          if (delay > 8) {
            currentVideoElement.currentTime = seekRange.end - 1.5;
            currentVideoElement.playbackRate = 1.0;
          } else if (delay > 3.5) {
            currentVideoElement.playbackRate = 1.03;
          } else if (delay < 1.2) {
            currentVideoElement.playbackRate = 0.98;
          } else {
            currentVideoElement.playbackRate = 1.0;
          }
        }
      } catch (e) {}
    }, 2000);

    return playerInstance;
  } catch (e) {
    console.error('initPlayer error:', e);
    if (onStatusUpdate) onStatusUpdate('Lỗi khởi tạo Player');
    return null;
  }
}

/**
 * Tự động chuyển sang luồng dự phòng tiếp theo nếu có
 */
export async function handleStreamFailure(err) {
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
    console.warn(`⚠️ Luồng ${nextIndex} lỗi, đang tự động chuyển sang nguồn dự phòng [${backupSource.sourceName || nextIndex + 1}/${sources.length}]:`, backupSource.url);

    currentChannelData.url = backupSource.url;
    currentChannelData.licenseKey = backupSource.licenseKey;
    if (backupSource.userAgent) currentChannelData.userAgent = backupSource.userAgent;

    await playCurrentChannelInternal();
    isSwitchingBackup = false;
  } else {
    console.error(`❌ Toàn bộ ${sources.length || 1} nguồn dự phòng của kênh ${currentChannelData.name} đều không khả dụng.`);
    if (onPlaybackErrorCb) onPlaybackErrorCb(err);
  }
}

async function playCurrentChannelInternal() {
  if (!playerInstance || !currentChannelData) return;

  try {
    try {
      await playerInstance.unload();
    } catch (e) {}

    const drmConfig = { servers: {}, clearKeys: {}, advanced: {} };

    if (currentChannelData.licenseKey) {
      const clearKeyObj = parseClearKey(currentChannelData.licenseKey);
      if (clearKeyObj) {
        drmConfig.clearKeys = clearKeyObj;
      } else {
        drmConfig.servers['com.widevine.alpha'] = currentChannelData.licenseKey;
        drmConfig.advanced['com.widevine.alpha'] = {
          videoRobustness: 'SW_SECURE_CRYPTO',
          audioRobustness: 'SW_SECURE_CRYPTO'
        };
      }
    }

    playerInstance.configure({
      drm: drmConfig,
      abr: {
        enabled: true,
        defaultBandwidthEstimate: 500000
      }
    });

    let streamUrl = currentChannelData.url;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      streamUrl = `/api/stream?url=${encodeURIComponent(currentChannelData.url)}`;
    }

    await playerInstance.load(streamUrl);

    if (currentVideoElement) {
      currentVideoElement.playbackRate = 1.0;
      currentVideoElement.volume = 1.0;

      const playPromise = currentVideoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Autoplay muted fallback:', err);
          currentVideoElement.muted = true;
          currentVideoElement.play().then(() => {
            const unmute = () => {
              if (currentVideoElement) {
                currentVideoElement.muted = false;
                currentVideoElement.volume = 1.0;
              }
              window.removeEventListener('click', unmute);
              window.removeEventListener('keydown', unmute);
            };
            window.addEventListener('click', unmute, { once: true });
            window.addEventListener('keydown', unmute, { once: true });
          }).catch(() => {});
        });
      }
    }

    if (onMediaStatsChangedCb) {
      setTimeout(() => {
        onMediaStatsChangedCb(getRealMediaStats());
      }, 500);
    }
  } catch (error) {
    if (error.severity === 2) {
      handleStreamFailure(error);
    }
  }
}

export async function playStream(channel, onStatusUpdate) {
  if (!playerInstance) return;
  currentChannelData = channel;
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
  await playCurrentChannelInternal();
}

export async function stopStream() {
  if (currentVideoElement) {
    try {
      currentVideoElement.pause();
      currentVideoElement.removeAttribute('src');
      currentVideoElement.load();
    } catch (e) {}
  }

  if (playerInstance) {
    try {
      await playerInstance.unload();
    } catch (e) {}
  }

  if (liveSyncInterval) {
    clearInterval(liveSyncInterval);
    liveSyncInterval = null;
  }
}
