import { parseM3U } from './parser.js';
import {
  FALLBACK_M3U_SOURCE_1,
  FALLBACK_M3U_SOURCE_2,
  FALLBACK_M3U_VIETANH,
  FALLBACK_M3U_VMT_COBAN,
  FALLBACK_M3U_VIETXIAOMI,
  FALLBACK_M3U_ONSPORTS_VIP,
  FALLBACK_M3U_TINHLAGI_SPORTS,
  FALLBACK_M3U_TINHLAGI_TV,
  FALLBACK_M3U_EASPORT
} from './fallback_data.js';

export var SOURCE_CONFIGS = [
  {
    id: 'vmt',
    name: 'VMT (VIP & Sự Kiện)',
    rawUrl: 'https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/vmttv',
    apiUrl: 'https://api.github.com/repos/vuminhthanh12/vuminhthanh12/contents/vmttv',
    fallbackM3u: FALLBACK_M3U_SOURCE_2
  },
  {
    id: 'superok',
    name: 'SuperOK (Tổng Hợp)',
    rawUrl: 'https://raw.githubusercontent.com/hieu-TQS/error/refs/heads/main/error.m3u',
    apiUrl: 'https://api.github.com/repos/hieu-TQS/error/contents/error.m3u',
    fallbackM3u: FALLBACK_M3U_SOURCE_1
  },
  {
    id: 'vietanh',
    name: 'VietAnhTV (Đa Dạng)',
    rawUrl: 'https://tv.vietanhtv.top/tv/',
    apiUrl: null,
    fallbackM3u: FALLBACK_M3U_VIETANH
  },
  {
    id: 'vmt_coban',
    name: 'VMT Cơ Bản (Cơ Bản)',
    rawUrl: 'https://dl.dropboxusercontent.com/s/o5vygit34v9ryly71gam4/coban66.m3u?rlkey=auyoon54hfubajt16nc7u7dbn&st=70gyvtcu&dl=0',
    apiUrl: null,
    fallbackM3u: FALLBACK_M3U_VMT_COBAN
  },
  {
    id: 'vietxiaomi',
    name: 'VietXiaomi (Địa Phương)',
    rawUrl: 'https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main/new.m3u',
    apiUrl: 'https://api.github.com/repos/vietng228/m3u/contents/new.m3u',
    fallbackM3u: FALLBACK_M3U_VIETXIAOMI
  },
  {
    id: 'onsports_vip',
    name: 'ON Sports VIP (ClearKey DRM)',
    rawUrl: 'https://justpaste.it/lxtwn',
    apiUrl: null,
    fallbackM3u: FALLBACK_M3U_ONSPORTS_VIP
  },
  {
    id: 'tinhlagi_sports',
    name: 'TinhLaGi Sports (Bóng Đá)',
    rawUrl: 'https://tinhlagi.pro/s.m3u',
    apiUrl: null,
    fallbackM3u: FALLBACK_M3U_TINHLAGI_SPORTS
  },
  {
    id: 'tinhlagi_tv',
    name: 'TinhLaGi TV (HBO & 4K)',
    rawUrl: 'https://tinhlagi.pro/tv.json',
    apiUrl: null,
    fallbackM3u: FALLBACK_M3U_TINHLAGI_TV
  },
  {
    id: 'easport',
    name: 'EASport (Thể Thao Quốc Tế)',
    rawUrl: 'https://livesport.io.vn/ott/list.php',
    apiUrl: null,
    fallbackM3u: FALLBACK_M3U_EASPORT
  }
];

export function getActiveSourceIndex() {
  try {
    var saved = localStorage.getItem('active_source_idx');
    if (saved !== null && saved !== '') {
      var idx = parseInt(saved, 10);
      if (!isNaN(idx) && idx >= 0 && idx < SOURCE_CONFIGS.length) {
        return idx;
      }
    }
  } catch (e) {}
  return 0;
}

export function setActiveSourceIndex(idx) {
  try {
    localStorage.setItem('active_source_idx', idx.toString());
  } catch (e) {}
}

export function xhrGet(url, callback) {
  var done = false;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.timeout = 3000;

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && !done) {
      done = true;
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, xhr.responseText);
      } else {
        callback(new Error('HTTP ' + xhr.status), null);
      }
    }
  };

  xhr.onerror = function () {
    if (!done) {
      done = true;
      callback(new Error('Network error / CORS'), null);
    }
  };

  xhr.ontimeout = function () {
    if (!done) {
      done = true;
      callback(new Error('Timeout'), null);
    }
  };

  try {
    xhr.send();
  } catch (e) {
    if (!done) {
      done = true;
      callback(e, null);
    }
  }
}

export function getFetchUrl(url) {
  var cleanUrl = url.trim();
  if (cleanUrl.indexOf('tv.vietanhtv.top/tv') !== -1 && cleanUrl.slice(-1) !== '/') {
    cleanUrl += '/';
  }
  var cacheBucket = Math.floor(Date.now() / 180000);
  var separator = cleanUrl.indexOf('?') !== -1 ? '&' : '?';
  return cleanUrl + separator + '_cb=' + cacheBucket;
}

function decodeBase64Safe(str) {
  try {
    var cleanStr = str.replace(/\s/g, '');
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      var raw = window.atob(cleanStr);
      try {
        return decodeURIComponent(escape(raw));
      } catch (e) {
        return raw;
      }
    } else if (typeof Buffer !== 'undefined') {
      return Buffer.from(cleanStr, 'base64').toString('utf-8');
    }
  } catch (e) {
    console.warn('[Sources] Lỗi giải mã Base64:', e);
  }
  return '';
}

function isCorsSupportedUrl(url) {
  if (!url) return false;
  var u = url.toLowerCase();
  return u.indexOf('githubusercontent.com') !== -1 || u.indexOf('api.github.com') !== -1 || u.indexOf('jsdelivr.net') !== -1 || u.indexOf('unpkg.com') !== -1;
}

function isRunningInStandardBrowser() {
  if (typeof window === 'undefined') return false;
  var isTizenApp = !!(window.tizen || window.webapis);
  return !isTizenApp;
}

function fetchSourceWithFallback(srcConfig, forceReload, callback) {
  if (isRunningInStandardBrowser() && !isCorsSupportedUrl(srcConfig.rawUrl)) {
    if (srcConfig.fallbackM3u && srcConfig.fallbackM3u.trim().length > 50) {
      callback(null, srcConfig.fallbackM3u);
      return;
    }
  }

  xhrGet(getFetchUrl(srcConfig.rawUrl), function (err, text) {
    if (!err && text && text.trim().length > 100) {
      callback(null, text);
      return;
    }

    if (srcConfig.apiUrl) {
      xhrGet(getFetchUrl(srcConfig.apiUrl), function (apiErr, apiText) {
        if (!apiErr && apiText) {
          try {
            var json = JSON.parse(apiText);
            if (json && json.content) {
              var decoded = decodeBase64Safe(json.content);
              if (decoded && decoded.trim().length > 100) {
                callback(null, decoded);
                return;
              }
            }
          } catch (e) {}
        }

        if (srcConfig.fallbackM3u && srcConfig.fallbackM3u.trim().length > 50) {
          callback(null, srcConfig.fallbackM3u);
        } else {
          callback(new Error('Không thể tải nguồn này'), null);
        }
      });
      return;
    }

    if (srcConfig.fallbackM3u && srcConfig.fallbackM3u.trim().length > 50) {
      callback(null, srcConfig.fallbackM3u);
    } else {
      callback(new Error('Không thể tải nguồn này'), null);
    }
  });
}

export function cleanTitle(str) {
  if (!str || typeof str !== 'string') return '';
  var s = str
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF\u2300-\u23FF\u2B50\u200D\uFE0F]/g, '')
    .replace(/[^\x00-\x7F\u00C0-\u1EF9]/g, ' ')
    .replace(/^[\s\|\-\_\:\/\•\●\★\—\–\.\,\~\#\+\*\(\)\[\]\{\}\>\<\=\@\!]+/, '')
    .replace(/[\s\|\-\_\:\/\•\●\★\—\–\.\,\~\#\+\*\(\)\[\]\{\}\>\<\=\@\!]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

export function removeVietnameseTones(str) {
  if (!str || typeof str !== 'string') return '';
  var s = str;
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  s = s.replace(/ì|í|ỉ|ĩ|ị/g, 'i');
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  s = s.replace(/đ/g, 'd');
  s = s.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  s = s.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  s = s.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  s = s.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  s = s.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  s = s.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  s = s.replace(/Đ/g, 'D');
  return s;
}

export function isBlockedChannelOrGroup(name, group) {
  var check = ((name || '') + ' ' + (group || '')).toLowerCase();
  var blockedWords = [
    'nguoi lon', '18+', 'adult', 'xxx', 'sex', 'jav', 'hentai', 'porn', 'erotic', 'nsfw',
    'chao mung', 'chào mừng', 'huong dan', 'hướng dẫn', 'nap tien', 'nạp tiền', 'gia han', 'gia hạn', 'lien he', 'liên hệ', 'zalo', 'tele'
  ];

  for (var i = 0; i < blockedWords.length; i++) {
    if (check.indexOf(blockedWords[i]) !== -1) return true;
  }
  return false;
}

export function cleanGroupName(rawGroup) {
  var grp = cleanTitle(rawGroup || '').trim();
  return grp || 'Kênh Khác';
}

export function getCategoryPriority(catName) {
  var norm = removeVietnameseTones((catName || '').toLowerCase()).trim();

  // 1. Nhóm SỰ KIỆN (FPT Play lên đầu Sự Kiện, TV360, VTVPrime, LIVE EVENTS...)
  var isEventGroup = norm.indexOf('su kien') !== -1 || norm.indexOf('event') !== -1 || norm.indexOf('truc tiep') !== -1;
  if (isEventGroup) {
    if (norm.indexOf('fpt') !== -1) return 35; // Sự Kiện FPT Play lên đầu
    if (norm.indexOf('tv360') !== -1 || norm.indexOf('360') !== -1) return 36; // Sự Kiện TV360
    if (norm.indexOf('prime') !== -1 || norm.indexOf('vtvprime') !== -1) return 37; // Sự Kiện VTVPrime
    if (norm.indexOf('live event') !== -1 || norm === 'live events') return 38; // LIVE EVENTS
    return 39; // Các nhóm Sự Kiện khác
  }

  // 2. Tất cả các nhóm Đài Truyền hình VTV
  if (norm === 'vtv' || norm === 'dai truyen hinh viet nam') return 10;
  if (norm.startsWith('vtv') && (norm.indexOf('cab') !== -1 || norm.indexOf('vtvcab') !== -1)) return 11;
  if (norm.indexOf('vtvcab') !== -1 || norm.indexOf('vtv cab') !== -1) return 11;
  if (norm.startsWith('vtv')) return 12;
  if (norm.indexOf('vtv') !== -1) return 13;

  // 3. HTV
  if (norm === 'htv' || norm === 'htvc') return 20;
  if (norm.startsWith('htv') || norm.indexOf('htv') !== -1) return 21;

  // 4. SCTV
  if (norm === 'sctv') return 30;
  if (norm.startsWith('sctv') || norm.indexOf('sctv') !== -1) return 31;

  // 5. THỂ THAO & BÓNG ĐÁ
  if (norm.indexOf('the thao') !== -1 || norm.indexOf('sport') !== -1 || norm.indexOf('kplus') !== -1 || norm.indexOf('k+') !== -1 || norm.indexOf('bong da') !== -1) return 50;

  // 6. Rạp Phim / Phim truyện / 4K / HBO
  if (norm.indexOf('rap phim') !== -1 || norm.indexOf('hbo') !== -1 || norm.indexOf('phim') !== -1 || norm.indexOf('cinema') !== -1) return 55;

  // 7. Vĩnh Long (THVL)
  if (norm.indexOf('thvl') !== -1 || norm.indexOf('vinh long') !== -1) return 60;

  // 8. Còn lại
  return 100;
}

export function formatPrettyChannelName(rawName) {
  var name = cleanTitle(rawName);
  name = name.replace(/\s+(FHD|UHD|4K|2K|HD|SD|50fps|60fps|HEVC|H265|RAW)(\s+|$)/gi, ' ');
  name = name.replace(/^(Kênh|Kenh|Channel)\s+/i, '');
  return cleanTitle(name);
}

function isValidLogoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  var u = url.trim().toLowerCase();
  if (u.length === 0) return false;
  if (u.indexOf('duckdns.org') !== -1) return false;
  if (u.indexOf('vietanh18h1') !== -1) return false;
  if (u.indexOf('http://') === 0 || u.indexOf('https://') === 0) return true;
  return false;
}

export function getFallbackChannelLogo(name, tvgId) {
  var s = removeVietnameseTones(((name || '') + ' ' + (tvgId || '')).toLowerCase()).replace(/[^a-z0-9]/g, '');
  var LOGO_BASE = 'https://raw.githubusercontent.com/hieu-TQS/LOGO-IPTV/main/';

  var MAP = {
    'vtv1': LOGO_BASE + '1.png',
    'vtv2': LOGO_BASE + '2.png',
    'vtv3': LOGO_BASE + '3.png',
    'vtv4': LOGO_BASE + '4.png',
    'vtv5': LOGO_BASE + '5.png',
    'vtv5tnb': LOGO_BASE + '5TNB.png',
    'vtv5tn': LOGO_BASE + '5TN.png',
    'vtv6': LOGO_BASE + '6.png',
    'vtvcantho': LOGO_BASE + '6.png',
    'vtv7': LOGO_BASE + '7.png',
    'vtv8': LOGO_BASE + '8.png',
    'vtv9': LOGO_BASE + '9.png',
    'thvl1': LOGO_BASE + 'THVL1.png',
    'thvl2': LOGO_BASE + 'THVL2.png',
    'thvl3': LOGO_BASE + 'THVL3.png',
    'thvl4': LOGO_BASE + 'THVL4.png',
    'htv1': LOGO_BASE + 'HTV1.png',
    'htv2': LOGO_BASE + 'HTV2.png',
    'htv3': LOGO_BASE + 'HTV3.png',
    'htv7': LOGO_BASE + 'HTV7.png',
    'htv9': LOGO_BASE + 'HTV9.png',
    'htvthethao': LOGO_BASE + 'HTVTHETHAO.png',
    'sctv1': LOGO_BASE + 'SCTV1.png',
    'sctv2': LOGO_BASE + 'SCTV2.png',
    'sctv3': LOGO_BASE + 'SCTV3.png',
    'sctv4': LOGO_BASE + 'SCTV4.png',
    'sctv5': LOGO_BASE + 'SCTV5.png',
    'sctv6': LOGO_BASE + 'SCTV6.png',
    'sctv7': LOGO_BASE + 'SCTV7.png',
    'sctv8': LOGO_BASE + 'SCTV8.png',
    'sctv9': LOGO_BASE + 'SCTV9.png',
    'sctv10': LOGO_BASE + 'SCTV10.png',
    'sctv11': LOGO_BASE + 'SCTV11.png',
    'sctv12': LOGO_BASE + 'SCTV12.png',
    'sctv13': LOGO_BASE + 'SCTV13.png',
    'sctv14': LOGO_BASE + 'SCTV14.png',
    'sctv15': LOGO_BASE + 'SCTV15.png',
    'sctv16': LOGO_BASE + 'SCTV16.png',
    'sctv17': LOGO_BASE + 'SCTV17.png',
    'sctv18': LOGO_BASE + 'SCTV18.png',
    'sctv19': LOGO_BASE + 'SCTV19.png',
    'sctv20': LOGO_BASE + 'SCTV20.png',
    'sctv21': LOGO_BASE + 'SCTV21.png',
    'sctv22': LOGO_BASE + 'SCTV22.png',
    'vtc1': LOGO_BASE + 'VTC1.png',
    'vtc2': LOGO_BASE + 'VTC2.png',
    'vtc3': LOGO_BASE + 'VTC3.png',
    'vtc4': LOGO_BASE + 'VTC4.png',
    'vtc5': LOGO_BASE + 'VTC5.png',
    'vtc6': LOGO_BASE + 'VTC6.png',
    'vtc7': LOGO_BASE + 'VTC7.png',
    'vtc8': LOGO_BASE + 'VTC8.png',
    'vtc9': LOGO_BASE + 'VTC9.png',
    'vtc10': LOGO_BASE + 'VTC10.png',
    'vtc11': LOGO_BASE + 'VTC11.png',
    'vtc12': LOGO_BASE + 'VTC12.png',
    'vtc13': LOGO_BASE + 'VTC13.png',
    'vtc14': LOGO_BASE + 'VTC14.png',
    'vtc16': LOGO_BASE + 'VTC16.png',
    'vov1': 'https://admin.vov.gov.vn/UploadFolder/KhoTin/Images/UploadFolder/VOVVN/Images/sites/default/files/2024-02/vov1.jpg',
    'vov2': 'https://vov2.vov.vn/themes/custom/vov_news/logo.png',
    'vov3': 'https://vov3.vov.vn/sites/default/files/styles/front_medium/public/2021-12/Logo%20VOV3%20800x600%20edit.jpg',
    'vov5': 'https://foxxradio.com/upload/vi/1671788035.png.webp',
    'vovgiaothong': 'https://foxxradio.com/upload/vi/1671787624.png.webp'
  };

  for (var key in MAP) {
    if (s.indexOf(key) !== -1) return MAP[key];
  }
  return '';
}

/**
 * Nạp riêng biệt từng nguồn M3U được chọn (Không gộp chung / Không lọc bỏ kênh)
 * Vẫn giữ nguyên logic ưu tiên thứ tự nhóm kênh lên trên
 */
export function loadSourceByIndex(sourceIndex, forceReload, callback) {
  var idx = Math.max(0, Math.min(sourceIndex, SOURCE_CONFIGS.length - 1));
  var srcConfig = SOURCE_CONFIGS[idx];

  fetchSourceWithFallback(srcConfig, forceReload, function (err, text) {
    var rawChannels = (!err && text) ? parseM3U(text) : [];
    var processedChannels = [];
    var groupedChannels = {};
    var categoryOrder = [];

    for (var i = 0; i < rawChannels.length; i++) {
      var ch = rawChannels[i];
      if (isBlockedChannelOrGroup(ch.name, ch.group)) {
        continue;
      }

      var grpName = cleanGroupName(ch.group);
      var prettyName = formatPrettyChannelName(ch.name);

      ch.name = prettyName;
      ch.group = grpName;

      if (!isValidLogoUrl(ch.logo)) {
        ch.logo = getFallbackChannelLogo(ch.name, ch.id);
      }

      ch.sources = [{
        sourceName: srcConfig.name,
        url: ch.url,
        licenseKey: ch.licenseKey,
        userAgent: ch.userAgent
      }];
      ch.activeSourceIndex = 0;

      processedChannels.push(ch);

      if (!groupedChannels[grpName]) {
        groupedChannels[grpName] = [];
        categoryOrder.push(grpName);
      }
      groupedChannels[grpName].push(ch);
    }

    // Sắp xếp thứ tự Nhóm kênh theo đúng độ ưu tiên:
    // VTV -> HTV -> SCTV -> SỰ KIỆN -> THỂ THAO -> Rạp Phim -> Vĩnh Long -> Các nhóm khác
    var categoryList = categoryOrder.slice();
    categoryList.sort(function (a, b) {
      var pA = getCategoryPriority(a);
      var pB = getCategoryPriority(b);
      if (pA !== pB) {
        return pA - pB;
      }
      return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
    });

    if (processedChannels.length === 0 && SOURCE_CONFIGS.length > 1) {
      console.warn('[Sources] Nguồn ' + srcConfig.name + ' không có kênh nào hoặc lỗi tải, tự động chuyển sang nguồn tiếp theo!');
      var nextSourceIdx = (idx + 1) % SOURCE_CONFIGS.length;
      setActiveSourceIndex(nextSourceIdx);
      loadSourceByIndex(nextSourceIdx, forceReload, callback);
      return;
    }

    var payload = {
      allChannels: processedChannels,
      groupedChannels: groupedChannels,
      categoryList: categoryList,
      sourceName: srcConfig.name,
      sourceIndex: idx
    };

    console.log('[Sources] Đã nạp thành công ' + processedChannels.length + ' kênh từ nguồn: ' + srcConfig.name);
    callback(payload);
  });
}
