import { parseM3U } from './parser.js';

export var SOURCE_1_URL = 'https://raw.githubusercontent.com/hieu-TQS/error/refs/heads/main/error.m3u'; // SuperOK VIP DRM (Nguồn 1 - Ưu tiên hàng đầu)
export var SOURCE_2_URL = 'https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/vmttv'; // VMT Thể Thao (Nguồn 2)
export var SOURCE_3_URL = 'https://tv.vietanhtv.top/tv/'; // VietAnhTV DRM (Nguồn 3 - Bổ sung kênh thiếu)

export function xhrGet(url, callback) {
  var done = false;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.timeout = 10000;

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
      callback(new Error('Network error'), null);
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
  var separator = cleanUrl.indexOf('?') !== -1 ? '&' : '?';
  return cleanUrl + separator + '_t=' + Date.now();
}

/**
 * Loại bỏ triệt để emoji, ký tự đặc biệt thừa ở đầu và đuôi (như |, •, ●, ★, -, _, :, ~, v.v.)
 */
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
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
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

/**
 * Thứ tự ưu tiên nhóm kênh:
 * 1. Các nhóm có chữ VTV lên đầu (VTV -> VTVcab -> VTV...)
 * 2. HTV (HTV, HTVC...)
 * 3. SCTV
 * 4. Các nhóm Sự Kiện (Sự Kiện TV360, Sự Kiện VTVPrime... giữ riêng)
 * 5. THỂ THAO (THỂ THAO QUỐC TẾ, Thể Thao, K+...)
 * 6. Các nhóm còn lại
 */
export function getCategoryPriority(catName) {
  var norm = removeVietnameseTones((catName || '').toLowerCase()).trim();

  // 1. Tất cả các nhóm có chữ VTV lên đầu tiên
  if (norm === 'vtv' || norm === 'dai truyen hinh viet nam') return 10;
  if (norm.startsWith('vtv') && (norm.indexOf('cab') !== -1 || norm.indexOf('vtvcab') !== -1)) return 11;
  if (norm.indexOf('vtvcab') !== -1 || norm.indexOf('vtv cab') !== -1) return 11;
  if (norm.startsWith('vtv')) return 12;
  if (norm.indexOf('vtv') !== -1) return 13;

  // 2. HTV
  if (norm === 'htv' || norm === 'htvc') return 20;
  if (norm.startsWith('htv') || norm.indexOf('htv') !== -1) return 21;

  // 3. SCTV
  if (norm === 'sctv') return 30;
  if (norm.startsWith('sctv') || norm.indexOf('sctv') !== -1) return 31;

  // 4. Các nhóm Sự Kiện (Giữ riêng biệt từng nhóm)
  if (norm.indexOf('su kien') !== -1 || norm.indexOf('event') !== -1 || norm.indexOf('truc tiep') !== -1) return 40;

  // 5. THỂ THAO
  if (norm.indexOf('the thao') !== -1 || norm.indexOf('sport') !== -1 || norm.indexOf('kplus') !== -1 || norm.indexOf('k+') !== -1) return 50;

  // 6. Vĩnh Long
  if (norm.indexOf('thvl') !== -1 || norm.indexOf('vinh long') !== -1) return 60;

  // 7. Còn lại
  return 100;
}

export function getChannelUniqueKey(ch) {
  if (ch.id && typeof ch.id === 'string' && ch.id.trim().length > 0) {
    var rawId = ch.id.trim().toLowerCase();
    var cleanId = removeVietnameseTones(rawId)
      .replace(/(fhd|uhd|4k|2k|hd|sd|50fps|60fps|hevc|h265|raw)/g, '')
      .replace(/[^a-z0-9]/g, '');
    if (cleanId.length > 0) return 'id:' + cleanId;
  }
  var cleanN = removeVietnameseTones((ch.name || '').toLowerCase())
    .replace(/(fhd|uhd|4k|2k|hd|sd|50fps|60fps|hevc|h265|raw)/g, '')
    .replace(/[^a-z0-9]/g, '');
  return 'name:' + (cleanN || 'channel');
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
    'vtc16': LOGO_BASE + 'VTC16.png'
  };

  for (var key in MAP) {
    if (s.indexOf(key) !== -1) return MAP[key];
  }
  return '';
}

export function loadAndMergePlaylists(callback) {
  var sources = [
    { url: SOURCE_1_URL, name: 'SuperOK' },
    { url: SOURCE_2_URL, name: 'VMT' },
    { url: SOURCE_3_URL, name: 'VietAnhTV' }
  ];

  var completed = 0;
  var parsedLists = [];

  sources.forEach(function (srcObj, index) {
    xhrGet(getFetchUrl(srcObj.url), function (err, text) {
      if (err) {
        console.warn('[Sources] Không thể tải ' + srcObj.name + ':', err.message);
      }
      parsedLists[index] = {
        name: srcObj.name,
        channels: (!err && text) ? parseM3U(text) : []
      };
      completed++;

      if (completed === sources.length) {
        var mergedObj = {};
        var mergedList = [];

        // Duyệt tuần tự theo đúng thứ tự ưu tiên: Nguồn 1 -> Nguồn 2 -> Nguồn 3
        for (var i = 0; i < parsedLists.length; i++) {
          var srcData = parsedLists[i];
          if (!srcData || !srcData.channels) continue;

          for (var j = 0; j < srcData.channels.length; j++) {
            var ch = srcData.channels[j];
            if (isBlockedChannelOrGroup(ch.name, ch.group)) {
              continue;
            }

            var groupName = cleanGroupName(ch.group);
            var prettyName = formatPrettyChannelName(ch.name);
            ch.name = prettyName;
            ch.group = groupName;

            var uniqueKey = getChannelUniqueKey(ch);
            if (!uniqueKey) continue;

            var streamSource = {
              sourceName: srcData.name,
              url: ch.url,
              licenseKey: ch.licenseKey,
              userAgent: ch.userAgent
            };

            var validLogo = isValidLogoUrl(ch.logo) ? ch.logo : '';

            // NẾU KÊNH CHƯA CÓ TRONG DANH SÁCH: THÊM MỚI VÀO
            if (!mergedObj[uniqueKey]) {
              ch.sources = [streamSource];
              ch.activeSourceIndex = 0;
              ch.logo = validLogo || getFallbackChannelLogo(ch.name, ch.id);
              mergedObj[uniqueKey] = ch;
              mergedList.push(ch);
            } 
            // NẾU KÊNH ĐÃ CÓ (TRÙNG tvg-id HOẶC TÊN): LƯU THÊM NGUỒN PHÁT DỰ PHÒNG & THỪA KẾ LOGO
            else {
              var existing = mergedObj[uniqueKey];
              if (!existing.sources) {
                existing.sources = [{
                  sourceName: 'Gốc',
                  url: existing.url,
                  licenseKey: existing.licenseKey,
                  userAgent: existing.userAgent
                }];
              }
              var isDuplicateUrl = existing.sources.some(function(s) { return s.url === ch.url; });
              if (!isDuplicateUrl) {
                existing.sources.push(streamSource);
              }

              // NẾU NGUỒN 1 KHÔNG CÓ LOGO (hoặc logo chết) -> THỪA KẾ LOGO TỪ NGUỒN 2, 3!
              if (!isValidLogoUrl(existing.logo) && validLogo) {
                existing.logo = validLogo;
              }
            }
          }
        }

        // Kiểm tra lượt cuối: Nếu kênh nào chưa có logo hợp lệ, gán từ kho Logo Fallback
        for (var m = 0; m < mergedList.length; m++) {
          if (!isValidLogoUrl(mergedList[m].logo)) {
            mergedList[m].logo = getFallbackChannelLogo(mergedList[m].name, mergedList[m].id);
          }
        }

        var groupedChannels = {};
        var rawCategoryOrder = [];

        for (var k = 0; k < mergedList.length; k++) {
          var item = mergedList[k];
          var grp = item.group || 'Kênh Khác';
          if (!groupedChannels[grp]) {
            groupedChannels[grp] = [];
            rawCategoryOrder.push(grp);
          }
          groupedChannels[grp].push(item);
        }

        // Sắp xếp thứ tự Nhóm kênh: Tất cả nhóm VTV (VTV, VTVcab, VTV...) lên đầu -> HTV -> SCTV -> Sự Kiện -> THỂ THAO -> Còn lại
        var categoryList = rawCategoryOrder.slice();
        categoryList.sort(function (a, b) {
          var pA = getCategoryPriority(a);
          var pB = getCategoryPriority(b);
          if (pA !== pB) {
            return pA - pB;
          }
          return rawCategoryOrder.indexOf(a) - rawCategoryOrder.indexOf(b);
        });

        console.log('[Sources] Đã gộp và sắp xếp VTV/VTVcab lên đầu: ' + mergedList.length + ' kênh, ' + categoryList.length + ' nhóm danh mục!');
        callback({ allChannels: mergedList, groupedChannels: groupedChannels, categoryList: categoryList });
      }
    });
  });
}
