import shaka from 'shaka-player/dist/shaka-player.compiled.js';

let playerInstance = null;
let currentChannelData = null;
let currentVideoElement = null;

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
        bufferingGoal: 10,
        rebufferingGoal: 2,
        bufferBehind: 15,
        retryParameters: {
          maxAttempts: 3,
          baseDelay: 1000,
          backoffFactor: 2
        }
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

    // Chỉ báo lỗi nếu là lỗi nghiêm trọng (severity === 2 / CRITICAL)
    playerInstance.addEventListener('error', (event) => {
      const err = event.detail;
      if (err.severity === 2) {
        console.error('🚨 Shaka Fatal Error:', err);
        if (onStatusUpdate) {
          onStatusUpdate(`Lỗi phát nghiêm trọng (Code ${err.code})`);
        }
      } else {
        // severity === 1 là cảnh báo có thể tự phục hồi (recoverable), video vẫn phát bình thường
        console.warn('⚠️ Shaka Recoverable Warning (Tự phục hồi):', err);
      }
    });

    return playerInstance;
  } catch (e) {
    console.error('initPlayer error:', e);
    if (onStatusUpdate) onStatusUpdate('Lỗi khởi tạo Player');
    return null;
  }
}

export async function playStream(channel, onStatusUpdate) {
  if (!playerInstance) return;
  currentChannelData = channel;

  try {
    if (onStatusUpdate) onStatusUpdate(`Đang nạp: ${channel.name}...`);

    const drmConfig = { servers: {}, clearKeys: {}, advanced: {} };

    if (channel.licenseKey) {
      const clearKeyObj = parseClearKey(channel.licenseKey);
      if (clearKeyObj) {
        drmConfig.clearKeys = clearKeyObj;
      } else {
        drmConfig.servers['com.widevine.alpha'] = channel.licenseKey;
        drmConfig.advanced['com.widevine.alpha'] = {
          videoRobustness: 'SW_SECURE_CRYPTO',
          audioRobustness: 'SW_SECURE_CRYPTO'
        };
      }
    }

    playerInstance.configure({ drm: drmConfig });

    let streamUrl = channel.url;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      streamUrl = `/api/stream?url=${encodeURIComponent(channel.url)}`;
    }

    await playerInstance.load(streamUrl);
    if (currentVideoElement) {
      currentVideoElement.play().catch(() => {});
    }
    if (onStatusUpdate) onStatusUpdate(`Đang phát: ${channel.name}`);
  } catch (error) {
    if (error.severity === 2) {
      console.error(`🚨 [Playback Failed] ${channel.name}:`, error);
      if (onStatusUpdate) {
        onStatusUpdate(`Lỗi phát: Code ${error.code || 'UNKNOWN'}`);
      }
    }
  }
}

export async function stopStream() {
  if (playerInstance) {
    try {
      await playerInstance.unload();
    } catch (e) {
      console.error(e);
    }
  }
}
