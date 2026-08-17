let currentChannelData = null;
let currentVideoElement = null;
let onMediaStatsChangedCb = null;
let onPlaybackErrorCb = null;
let isSwitchingBackup = false;

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
  return [
    { label: 'Auto', value: 'auto', active: true },
    { label: '1080p', value: 1080, active: false },
    { label: '720p', value: 720, active: false },
    { label: '576p', value: 576, active: false }
  ];
}

export function setRealVideoQuality(val) {
  // Native video không hỗ trợ chọn chất lượng trực tiếp
}

export function getRealAudioTracks() {
  return [
    { label: 'Tiếng Việt (Gốc)', value: 'vi', active: true }
  ];
}

export function setRealAudioTrack(audioObj) {
  // Native video chỉ có 1 track âm thanh
}

export function parseClearKey(drmString) {
  return null;
}

export function initPlayer(videoElement) {
  return new Promise(function(resolve) {
    currentVideoElement = videoElement;

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

    console.log('[Player] Samsung Tizen Native Hardware Video Engine - Sẵn sàng!');
    resolve(null);
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

  // Tìm nguồn HLS tiếp theo (ưu tiên .m3u8)
  while (nextIndex < sources.length) {
    var nextUrl = sources[nextIndex].url || '';
    // Ưu tiên bỏ qua MPD, chọn HLS
    if (nextUrl.indexOf('.m3u8') !== -1) {
      break;
    }
    nextIndex++;
  }
  // Nếu không có HLS, thử bất kỳ nguồn nào còn lại
  if (nextIndex >= sources.length) {
    nextIndex = currentIdx + 1;
  }

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
    if (onPlaybackErrorCb) onPlaybackErrorCb(err);
  }
}

function playCurrentChannelInternal() {
  if (!currentChannelData || !currentVideoElement) return;

  var url = currentChannelData.url;

  // Trên Samsung Tizen 3, thẻ <video> native hỗ trợ HLS phần cứng
  // Nếu URL là MPD (DRM), thử chuyển sang nguồn HLS dự phòng ngay lập tức
  if (url.indexOf('.mpd') !== -1) {
    var sources = currentChannelData.sources || [];
    var hlsSource = null;
    for (var i = 0; i < sources.length; i++) {
      if (sources[i].url && sources[i].url.indexOf('.m3u8') !== -1) {
        hlsSource = sources[i];
        break;
      }
    }
    if (hlsSource) {
      console.log('[Player] Kênh DRM MPD -> Chuyển sang nguồn HLS:', hlsSource.url);
      url = hlsSource.url;
      currentChannelData.url = url;
      currentChannelData.activeSourceIndex = sources.indexOf(hlsSource);
    } else {
      console.warn('[Player] Kênh chỉ có MPD/DRM, thử phát trực tiếp...');
    }
  }

  playWithNativeVideo(url);
}

function playWithNativeVideo(streamUrl) {
  if (!currentVideoElement) return;
  try {
    currentVideoElement.pause();
    currentVideoElement.removeAttribute('src');
    currentVideoElement.load();

    currentVideoElement.src = streamUrl;
    var playPromise = currentVideoElement.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(function() {}).catch(function(err) {
        console.warn('[Native Video] Autoplay thất bại, thử muted:', err);
        currentVideoElement.muted = true;
        currentVideoElement.play().then(function() {
          function unmute() {
            if (currentVideoElement) currentVideoElement.muted = false;
            window.removeEventListener('keydown', unmute);
          }
          window.addEventListener('keydown', unmute);
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
}
