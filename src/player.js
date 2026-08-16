import shaka from 'shaka-player/dist/shaka-player.compiled.js';

let playerInstance = null;
let currentChannelData = null;

export async function initPlayer(videoElement, onStatusUpdate) {
  try {
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

    const netEngine = playerInstance.getNetworkingEngine();
    if (netEngine) {
      netEngine.registerRequestFilter((type, request) => {
        if (currentChannelData && currentChannelData.userAgent) {
          request.headers['User-Agent'] = currentChannelData.userAgent;
        }
      });
    }

    playerInstance.addEventListener('error', (event) => {
      const err = event.detail;
      console.error('Shaka Player Error:', err);
      if (onStatusUpdate) {
        onStatusUpdate(`Lỗi phát (${err.code || 'DRM'})`);
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

    const drmConfig = { servers: {}, advanced: {} };
    if (channel.licenseKey) {
      drmConfig.servers['com.widevine.alpha'] = channel.licenseKey;
      drmConfig.advanced['com.widevine.alpha'] = {
        videoRobustness: 'SW_SECURE_CRYPTO',
        audioRobustness: 'SW_SECURE_CRYPTO'
      };
    }

    playerInstance.configure({ drm: drmConfig });
    await playerInstance.load(channel.url);
    if (onStatusUpdate) onStatusUpdate(`Đang phát: ${channel.name}`);
  } catch (error) {
    console.error(`[Playback Failed] ${channel.name}:`, error);
    if (onStatusUpdate) {
      onStatusUpdate(`Lỗi phát: ${error.message || 'Stream/DRM error'}`);
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
