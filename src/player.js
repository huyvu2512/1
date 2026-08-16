import shaka from 'shaka-player/dist/shaka-player.ui.js';

let playerInstance = null;
let currentChannelData = null;

/**
 * Khởi tạo Shaka Player trên thẻ video
 */
export async function initPlayer(videoElement, onStatusUpdate) {
  // Cài đặt polyfills cho môi trường Tizen Web
  shaka.polyfill.installAll();

  if (!shaka.Player.isBrowserSupported()) {
    throw new Error('Trình duyệt TV không hỗ trợ Shaka Player / EME!');
  }

  playerInstance = new shaka.Player(videoElement);

  // Cấu hình cơ bản cho streaming
  playerInstance.configure({
    streaming: {
      bufferingGoal: 10,
      rebufferingGoal: 2,
      bufferBehind: 15,
      lowLatencyMode: true,
      retryParameters: {
        maxAttempts: 3,
        baseDelay: 1000,
        backoffFactor: 2
      }
    }
  });

  // Đăng ký Request Filter để hỗ trợ User-Agent hoặc Custom Headers nếu cần
  const netEngine = playerInstance.getNetworkingEngine();
  netEngine.registerRequestFilter((type, request) => {
    if (currentChannelData && currentChannelData.userAgent) {
      request.headers['User-Agent'] = currentChannelData.userAgent;
    }
  });

  // Lắng nghe sự kiện lỗi
  playerInstance.addEventListener('error', (event) => {
    const err = event.detail;
    console.error('Shaka Player Error:', err);
    if (onStatusUpdate) {
      onStatusUpdate(`Lỗi phát (${err.code}): ${err.message || 'Không thể giải mã'}`);
    }
  });

  return playerInstance;
}

/**
 * Nạp kênh và cấu hình DRM Widevine / ClearKey
 */
export async function playStream(channel, onStatusUpdate) {
  if (!playerInstance) return;

  currentChannelData = channel;

  try {
    if (onStatusUpdate) onStatusUpdate(`Đang nạp: ${channel.name}...`);

    // Thiết lập DRM
    const drmConfig = { servers: {}, advanced: {} };

    if (channel.licenseKey) {
      // Hỗ trợ Widevine License URL
      drmConfig.servers['com.widevine.alpha'] = channel.licenseKey;
      drmConfig.advanced['com.widevine.alpha'] = {
        videoRobustness: 'SW_SECURE_CRYPTO',
        audioRobustness: 'SW_SECURE_CRYPTO'
      };
      console.log(`[DRM] Kích hoạt Widevine license: ${channel.licenseKey}`);
    }

    playerInstance.configure({ drm: drmConfig });

    // Nạp manifest (MPD hoặc HLS)
    await playerInstance.load(channel.url);
    
    if (onStatusUpdate) onStatusUpdate(`Đang phát: ${channel.name}`);
    console.log(`[Playback] Đang phát thành công kênh: ${channel.name}`);
  } catch (error) {
    console.error(`[Playback Failed] Kênh ${channel.name}:`, error);
    if (onStatusUpdate) {
      onStatusUpdate(`Lỗi: ${error.message || 'Không mở được luồng phát'}`);
    }
  }
}

/**
 * Dừng phát video
 */
export async function stopStream() {
  if (playerInstance) {
    try {
      await playerInstance.unload();
    } catch (e) {
      console.error(e);
    }
  }
}
