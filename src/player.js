var shakaModule = null;
var playerInstance = null;
var currentChannelData = null;
var currentVideoElement = null;
var onMediaStatsChangedCb = null;
var onPlaybackErrorCb = null;
var isSwitchingBackup = false;

function getShakaSafe() {
  if (shakaModule) return shakaModule;
  if (typeof window !== 'undefined' && window.shaka) {
    shakaModule = window.shaka;
    return shakaModule;
  }
  try {
    var sh = require('shaka-player/dist/shaka-player.compiled.js');
    if (typeof window !== 'undefined') {
      window.shaka = sh;
    }
    shakaModule = sh;
    return sh;
  } catch (e) {
    console.warn('[Player] Không thể nạp Shaka Player:', e);
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
    var width = currentVideoElement.videoWidth || 1920;
    var height = currentVideoElement.videoHeight || 1080;
    var fps = 25.0;

    if (playerInstance && playerInstance.getVariantTracks) {
      var tracks = playerInstance.getVariantTracks();
      for (var i = 0; i < tracks.length; i++) {
        if (tracks[i].active) {
          if (tracks[i].width) width = tracks[i].width;
          if (tracks[i].height) height = tracks[i].height;
          if (tracks[i].frameRate) fps = tracks[i].frameRate;
          break;
        }
      }
    }

    if (currentChannelData) {
      var nameLow = currentChannelData.name.toLowerCase();
      if (nameLow.indexOf('50fps') !== -1) fps = 50.0;
      else if (nameLow.indexOf('60fps') !== -1) fps = 60.0;
    }

    var bitrateMbps = width >= 1920 ? '3.5' : (width >= 1280 ? '2.5' : '1.8');

    return {
      width: width,
      height: height,
      fps: fps.toFixed(1),
      bandwidth: bitrateMbps + ' Mbps'
    };
  } catch (e) {
    return null;
  }
}

export function getRealVideoQualities() {
  if (playerInstance && playerInstance.getVariantTracks) {
    try {
      var tracks = playerInstance.getVariantTracks();
      var trackMap = {};
      var list = [];
      for (var i = 0; i < tracks.length; i++) {
        var t = tracks[i];
        if (t.height && !trackMap[t.height]) {
          trackMap[t.height] = true;
          list.push({
            label: t.height + 'p',
            value: t.height,
            active: !!t.active
          });
        }
      }
      list.sort(function(a, b) { return b.value - a.value; });
      list.unshift({ label: 'Auto (Khuyên dùng)', value: 'auto', active: true });
      return list;
    } catch (e) {}
  }
  return [
    { label: 'Auto (Khuyên dùng)', value: 'auto', active: true },
    { label: '1080p FHD', value: 1080, active: false },
    { label: '720p HD', value: 720, active: false }
  ];
}

export function setRealVideoQuality(heightVal) {
  if (!playerInstance || !playerInstance.getVariantTracks) return;
  try {
    if (heightVal === 'auto') {
      playerInstance.configure({ abr: { enabled: true } });
    } else {
      playerInstance.configure({ abr: { enabled: false } });
      var tracks = playerInstance.getVariantTracks();
      for (var i = 0; i < tracks.length; i++) {
        if (tracks[i].height === heightVal) {
          playerInstance.selectVariantTrack(tracks[i], true);
          break;
        }
      }
    }
  } catch (e) {}
}

export function getRealAudioTracks() {
  if (playerInstance && playerInstance.getAudioLanguages) {
    try {
      var langs = playerInstance.getAudioLanguages();
      if (langs && langs.length > 0) {
        return langs.map(function(l) {
          return { label: l.toUpperCase() === 'VI' ? 'Tiếng Việt' : l.toUpperCase(), value: l, active: true };
        });
      }
    } catch (e) {}
  }
  return [
    { label: 'Tiếng Việt (Gốc)', value: 'vi', active: true }
  ];
}

export function setRealAudioTrack(audioObj) {
  if (playerInstance && playerInstance.selectAudioLanguage && audioObj) {
    try {
      playerInstance.selectAudioLanguage(audioObj.value);
    } catch (e) {}
  }
}

export function parseClearKey(drmString) {
  if (!drmString || typeof drmString !== 'string') return null;
  var clean = drmString.trim();
  var parts = clean.split(':');
  if (parts.length === 2) {
    var obj = {};
    obj[parts[0].trim()] = parts[1].trim();
    return obj;
  }
  return null;
}

export function initPlayer(videoElement) {
  return new Promise(function(resolve) {
    currentVideoElement = videoElement;

    var sh = getShakaSafe();
    if (sh) {
      try {
        if (sh.polyfill && typeof sh.polyfill.installAll === 'function') {
          sh.polyfill.installAll();
        }

        if (sh.Player && sh.Player.isBrowserSupported && sh.Player.isBrowserSupported()) {
          playerInstance = new sh.Player(videoElement);

          // Cấu hình chống đứng hình (buffer 15s + an toàn 8s)
          playerInstance.configure({
            preferredAudioLanguage: 'vie',
            preferredAudioChannelCount: 2,
            abr: {
              enabled: true,
              defaultBandwidthEstimate: 1500000,
              switchInterval: 10
            },
            streaming: {
              bufferingGoal: 15,          // Buffer 15s để không bị giật lag
              rebufferingGoal: 3,         // Chờ 3s trước khi tiếp tục để ổn định
              bufferBehind: 30,
              safeSeekOffset: 8,          // Luôn cách live edge 8s an toàn
              jumpLargeGaps: true,        // Tự động bỏ qua phân đoạn lỗi
              stallEnabled: true,
              stallThreshold: 1.5,
              stallSkip: 0.5,
              retryParameters: {
                maxAttempts: 4,
                baseDelay: 500,
                backoffFactor: 1.5
              }
            },
            manifest: {
              dash: {
                ignoreMinBufferTime: true
              }
            }
          });

          var netEngine = playerInstance.getNetworkingEngine();
          if (netEngine) {
            netEngine.registerRequestFilter(function(type, request) {
              request.allowCrossSiteCredentials = false;
              if (currentChannelData && currentChannelData.userAgent) {
                request.headers['User-Agent'] = currentChannelData.userAgent;
              }
            });
          }

          playerInstance.addEventListener('error', function(event) {
            var err = event.detail;
            if (err && err.severity === 2) {
              console.warn('[Shaka] Fatal Error:', err);
              handleStreamFailure(err);
            }
          });

          console.log('[Player] Shaka Player khởi tạo thành công!');
        } else {
          console.log('[Player] Shaka không hỗ trợ, sử dụng Native Video Engine!');
        }
      } catch (e) {
        console.warn('[Player] Shaka init exception:', e);
        playerInstance = null;
      }
    }

    if (videoElement) {
      videoElement.addEventListener('playing', function() {
        if (onMediaStatsChangedCb) onMediaStatsChangedCb(getRealMediaStats());
      });
      videoElement.addEventListener('loadedmetadata', function() {
        if (onMediaStatsChangedCb) onMediaStatsChangedCb(getRealMediaStats());
      });
      videoElement.addEventListener('error', function() {
        var err = videoElement.error;
        console.warn('[Video] Native error:', err ? err.message : 'unknown');
      });
    }

    resolve(playerInstance);
  });
}

export function handleStreamFailure(err) {
  if (isSwitchingBackup || !currentChannelData) {
    if (onPlaybackErrorCb) onPlaybackErrorCb(err);
    return;
  }

  var sources = currentChannelData.sources || [];
  var currentIdx = currentChannelData.activeSourceIndex || 0;
  var nextIndex = currentIdx + 1;

  if (nextIndex < sources.length) {
    isSwitchingBackup = true;
    currentChannelData.activeSourceIndex = nextIndex;
    var backupSource = sources[nextIndex];
    console.warn('[Player] Đổi sang nguồn dự phòng [' + (nextIndex + 1) + '/' + sources.length + ']:', backupSource.url);

    currentChannelData.url = backupSource.url;
    currentChannelData.licenseKey = backupSource.licenseKey;
    if (backupSource.userAgent) currentChannelData.userAgent = backupSource.userAgent;

    playCurrentChannelInternal();
    isSwitchingBackup = false;
  } else {
    console.warn('[Player] Tất cả nguồn dự phòng đều lỗi:', currentChannelData.name);
    if (onPlaybackErrorCb) onPlaybackErrorCb(err);
  }
}

function playCurrentChannelInternal() {
  if (!currentChannelData || !currentVideoElement) return;

  var url = currentChannelData.url;
  var isDrm = !!currentChannelData.licenseKey || (url.indexOf('.mpd') !== -1);

  // Đảm bảo bật âm thanh
  currentVideoElement.muted = false;
  currentVideoElement.volume = 1.0;

  // 1. Nếu có Shaka Player:
  if (playerInstance) {
    try {
      playerInstance.unload().catch(function() {});

      var drmConfig = { servers: {}, clearKeys: {}, advanced: {} };
      if (currentChannelData.licenseKey) {
        var clearKeyObj = parseClearKey(currentChannelData.licenseKey);
        if (clearKeyObj) {
          drmConfig.clearKeys = clearKeyObj;
        } else {
          drmConfig.servers['com.widevine.alpha'] = currentChannelData.licenseKey;
        }
      }

      playerInstance.configure({
        drm: drmConfig,
        preferredAudioLanguage: 'vie',
        preferredAudioChannelCount: 2,
        abr: { enabled: true }
      });

      playerInstance.load(url).then(function() {
        if (currentVideoElement) {
          currentVideoElement.muted = false;
          currentVideoElement.volume = 1.0;
        }

        var playPromise = currentVideoElement.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.catch(function(err) {
            console.warn('[Player] Autoplay âm thanh thất bại, thử muted:', err);
            currentVideoElement.muted = true;
            currentVideoElement.play().then(function() {
              function unmute() {
                if (currentVideoElement) {
                  currentVideoElement.muted = false;
                  currentVideoElement.volume = 1.0;
                }
                window.removeEventListener('keydown', unmute);
                window.removeEventListener('click', unmute);
              }
              window.addEventListener('keydown', unmute, { once: true });
              window.addEventListener('click', unmute, { once: true });
            }).catch(function() {});
          });
        }
        if (onMediaStatsChangedCb) {
          setTimeout(function() { onMediaStatsChangedCb(getRealMediaStats()); }, 500);
        }
      }).catch(function(e) {
        console.warn('[Player] Shaka load error, chuyển sang Native / Backup:', e);
        if (!isDrm) {
          playWithNativeVideo(url);
        } else {
          handleStreamFailure(e);
        }
      });
      return;
    } catch (e) {
      console.warn('[Player] Shaka exception, thử Native Video:', e);
    }
  }

  // 2. Mặc định dùng Native Video
  playWithNativeVideo(url);
}

function playWithNativeVideo(streamUrl) {
  if (!currentVideoElement) return;
  try {
    if (playerInstance) {
      try { playerInstance.unload().catch(function() {}); } catch (e) {}
    }

    currentVideoElement.pause();
    currentVideoElement.removeAttribute('src');
    currentVideoElement.load();

    currentVideoElement.muted = false;
    currentVideoElement.volume = 1.0;
    currentVideoElement.src = streamUrl;

    var playPromise = currentVideoElement.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(function() {}).catch(function(err) {
        console.warn('[Native Video] Autoplay thất bại, thử muted:', err);
        currentVideoElement.muted = true;
        currentVideoElement.play().then(function() {
          function unmute() {
            if (currentVideoElement) {
              currentVideoElement.muted = false;
              currentVideoElement.volume = 1.0;
            }
            window.removeEventListener('keydown', unmute);
            window.removeEventListener('click', unmute);
          }
          window.addEventListener('keydown', unmute, { once: true });
          window.addEventListener('click', unmute, { once: true });
        }).catch(function() {});
      });
    }

    if (onMediaStatsChangedCb) {
      setTimeout(function() { onMediaStatsChangedCb(getRealMediaStats()); }, 600);
    }
  } catch (err) {
    console.error('[Native Video] Play error:', err);
  }
}

export function playStream(channel, onStatusUpdate) {
  currentChannelData = channel;
  if (!channel) return;
  currentChannelData.activeSourceIndex = 0;
  isSwitchingBackup = false;

  if (channel.sources && channel.sources.length > 0) {
    var firstSrc = channel.sources[0];
    channel.url = firstSrc.url;
    channel.licenseKey = firstSrc.licenseKey;
    if (firstSrc.userAgent) channel.userAgent = firstSrc.userAgent;
  }

  if (onStatusUpdate) onStatusUpdate('Đang nạp: ' + channel.name + '...');
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
      playerInstance.unload().catch(function() {});
    } catch (e) {}
  }
}
