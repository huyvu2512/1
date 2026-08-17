import { parseM3U } from './parser.js';

export const SOURCE_1_URL = 'https://raw.githubusercontent.com/hieu-TQS/error/refs/heads/main/error.m3u'; // SuperOK VIP DRM (Nguồn 1 - Ưu tiên hàng đầu)
export const SOURCE_2_URL = 'https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/vmttv'; // VMT Thể Thao (Nguồn 2)
export const SOURCE_3_URL = 'https://tv.vietanhtv.top/tv/'; // VietAnhTV DRM (Nguồn 3 - Bổ sung kênh thiếu)

export function xhrGet(url, callback) {
  let done = false;
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.timeout = 10000; // Timeout 10s cho mỗi nguồn playlist

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && !done) {
      done = true;
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, xhr.responseText);
      } else {
        callback(new Error(`HTTP ${xhr.status}`), null);
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
  let cleanUrl = url.trim();
  if (cleanUrl.indexOf('tv.vietanhtv.top/tv') !== -1 && cleanUrl.slice(-1) !== '/') {
    cleanUrl += '/';
  }
  const separator = cleanUrl.includes('?') ? '&' : '?';
  return `${cleanUrl}${separator}_t=${Date.now()}`;
}

export function cleanTitle(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF\u2300-\u23FF\u2B50\u200D\uFE0F]/g, '')
    .replace(/^[\s\|\-\_\:\/\•\●\★\—\–\.\,]+|[\s\|\-\_\:\/\•\●\★\—\–\.\,]+$/g, '')
    .trim();
}

function removeVietnameseTones(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|Ỵ|Ỷ|Ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str;
}

export function isBlockedChannelOrGroup(name, group) {
  const n = removeVietnameseTones((name || '').toLowerCase());
  const g = removeVietnameseTones((group || '').toLowerCase());

  const blockedWords = ['update', 'du phong', 'backup', 'thong bao', 'huong dan', 'quang cao', 'nap tien', 'gia han'];
  return blockedWords.some(w => n.includes(w) || g.includes(w));
}

/**
 * Chuẩn hóa tên danh mục đồng nhất 100%
 */
export function standardizeCategory(cat) {
  const cleaned = cleanTitle(cat);
  const norm = removeVietnameseTones(cleaned.toLowerCase()).replace(/[\s\-_]/g, '');

  if (norm.includes('vtv') || norm.includes('daiquocgia')) return 'VTV';
  if (norm.includes('vtvcab') || norm.includes('onlive') || norm.includes('oncine')) return 'VTVcab';
  if (norm.includes('htv') || norm.includes('htvc') || norm.includes('tphcm')) return 'HTV & HTVC';
  if (norm.includes('sctv') || norm.includes('saigontourist')) return 'SCTV';
  if (norm.includes('thethao') || norm.includes('sport') || norm.includes('kplus') || norm.includes('k+')) return 'Thể Thao & K+';
  if (norm.includes('thvl') || norm.includes('vinhlong')) return 'Truyền hình Vĩnh Long';
  if (norm.includes('phim') || norm.includes('movie') || norm.includes('cinema') || norm.includes('hbo')) return 'Phim Truyện';
  if (norm.includes('thieunhi') || norm.includes('kids') || norm.includes('cartoon') || norm.includes('hoathinh')) return 'Thiếu Nhi';
  if (norm.includes('tintuc') || norm.includes('news') || norm.includes('thoisu')) return 'Tin Tức & Thời Sự';
  if (norm.includes('giaitri') || norm.includes('amnhac') || norm.includes('music') || norm.includes('show')) return 'Giải Trí & Âm Nhạc';
  if (norm.includes('khoahoc') || norm.includes('khampha') || norm.includes('discovery') || norm.includes('natgeo')) return 'Khám Phá';
  if (norm.includes('quocte') || norm.includes('international') || norm.includes('world')) return 'Kênh Quốc Tế';
  if (norm.includes('diaphuong') || norm.includes('tinh') || norm.includes('local')) return 'Kênh Địa Phương';

  return 'Kênh Tổng Hợp';
}

/**
 * Chuẩn hóa tên kênh để so sánh và gộp kênh trùng giữa 3 nguồn
 */
export function normalizeName(name, tvgId) {
  let str = (name || '') + ' ' + (tvgId || '');
  str = cleanTitle(str);
  let s = removeVietnameseTones(str.toLowerCase());

  // Loại bỏ các từ khóa thừa
  s = s.replace(/(fhd|uhd|4k|2k|hd|sd|50fps|60fps|hevc|h265|raw|tv|backup|du phong|vip|server\s*\d+|nguon\s*\d+)/g, '');
  s = s.replace(/[^a-z0-9]/g, '').trim();

  // Quy đổi bí danh (Alias mapping) cho toàn bộ các đài tỉnh
  if (s.startsWith('vinhlong') || s.startsWith('thvl')) {
    const num = s.match(/\d+/);
    return num ? `thvl${num[0]}` : 'thvl1';
  }
  if (s.startsWith('hanoi') || s.startsWith('hn') || /^h\d+$/.test(s)) {
    const num = s.match(/\d+/);
    return num ? `hanoi${num[0]}` : 'hanoi1';
  }
  if (s.startsWith('danang') || s.startsWith('dnrt') || s.startsWith('dnang') || s.startsWith('dnrt1') || s.startsWith('dnrt2')) {
    const num = s.match(/\d+/);
    return num ? `danang${num[0]}` : 'danang1';
  }
  if (s.startsWith('dongnai') || s.startsWith('dnnrtv') || s.startsWith('dnrtv') || /^dn\d+$/.test(s) || s.startsWith('dn')) {
    const num = s.match(/\d+/);
    return num ? `dongnai${num[0]}` : 'dongnai1';
  }
  if (s.startsWith('dongthap') || s.startsWith('thdt') || s.startsWith('dthap')) {
    const num = s.match(/\d+/);
    return num ? `dongthap${num[0]}` : 'dongthap1';
  }
  if (s.startsWith('quangninh') || s.startsWith('qtv') || s.startsWith('qni')) {
    const num = s.match(/\d+/);
    return num ? `quangninh${num[0]}` : 'quangninh1';
  }
  if (s.startsWith('cantho') || s.startsWith('ctho')) {
    const num = s.match(/\d+/);
    return num ? `cantho${num[0]}` : 'cantho1';
  }
  if (s.startsWith('quangngai') || s.startsWith('qngtv') || s.startsWith('qng') || /^qn\d+$/.test(s)) {
    const num = s.match(/\d+/);
    return num ? `quangngai${num[0]}` : 'quangngai1';
  }
  if (s.startsWith('angiang') || /^atv\d+$/.test(s) || s.startsWith('atv')) {
    const num = s.match(/\d+/);
    return num ? `angiang${num[0]}` : 'angiang1';
  }
  if (s.startsWith('lamdong') || /^ltv\d+$/.test(s) || s.startsWith('ltv')) {
    const num = s.match(/\d+/);
    return num ? `lamdong${num[0]}` : 'lamdong1';
  }
  if (s.startsWith('haiphong') || s.startsWith('thp')) {
    const num = s.match(/\d+/);
    return num ? `haiphong${num[0]}` : 'haiphong1';
  }
  if (s.startsWith('tayninh') || s.startsWith('tayni') || s.startsWith('tn')) return 'tayninh';
  if (s.startsWith('camau') || s.startsWith('ctv')) return 'camau';
  if (s.startsWith('daklak') || s.startsWith('drt')) return 'daklak';
  if (s.startsWith('gialai') || s.startsWith('gtv')) return 'gialai';
  if (s.startsWith('hatinh') || s.startsWith('bht') || s.startsWith('bhttv')) return 'hatinh';
  if (s.startsWith('hungyen') || s.startsWith('hy') || s.startsWith('hytv')) return 'hungyen';
  if (s.startsWith('bacninh') || s.startsWith('bacn') || s.startsWith('btv')) return 'bacninh';
  if (s.startsWith('langson') || s.startsWith('lstv')) return 'langson';
  if (s.startsWith('laocai') || s.startsWith('thlc')) return 'laocai';
  if (s.startsWith('nghean')) return 'nghean';
  if (s.startsWith('phutho') || s.startsWith('ptv')) return 'phutho';
  if (s.startsWith('quangtri') || s.startsWith('qttv')) return 'quangtri';
  if (s.startsWith('thainguyen')) return 'thainguyen';
  if (s.startsWith('tuyenquang') || s.startsWith('tuyenq') || s.startsWith('ttv')) return 'tuyenquang';
  if (s.startsWith('dienbien') || s.startsWith('dtv')) return 'dienbien';
  if (s.startsWith('thanhhoa')) return 'thanhhoa';
  if (s.startsWith('ninhbinh')) return 'ninhbinh';
  if (s.startsWith('caobang') || s.startsWith('crtv') || s.startsWith('rtv')) return 'caobang';
  if (s.startsWith('sonla') || s.startsWith('stv')) return 'sonla';
  if (s.startsWith('hue')) return 'hue';
  if (s.startsWith('khanhhoa') || s.startsWith('ktv')) {
    const num = s.match(/\d+/);
    return num ? `khanhhoa${num[0]}` : 'khanhhoa';
  }

  // VTV
  if (s.startsWith('vtv')) {
    const num = s.match(/\d+/);
    if (num) {
      if (s.includes('tnb') || s.includes('taynam')) return `vtv${num[0]}tnb`;
      if (s.includes('tn') || s.includes('taynguyen')) return `vtv${num[0]}tn`;
      return `vtv${num[0]}`;
    }
  }

  // HTV
  if (s.startsWith('htv')) {
    const num = s.match(/\d+/);
    if (num) return `htv${num[0]}`;
    if (s.includes('thethao')) return 'htvthethao';
    if (s.includes('thuanviet')) return 'htvcthuanviet';
    if (s.includes('giadinh')) return 'htvcgiadinh';
    if (s.includes('phunu')) return 'htvcphunu';
    if (s.includes('dulich')) return 'htvcdulich';
    if (s.includes('canhac') || s.includes('music')) return 'htvccanhac';
    if (s.includes('plus')) return 'htvcplus';
    if (s.includes('phim') || s.includes('movies')) return 'htvcmovies';
  }

  // SCTV
  if (s.startsWith('sctv')) {
    const num = s.match(/\d+/);
    if (num) return `sctv${num[0]}`;
    if (s.includes('phim')) return 'sctvphim';
  }

  return s || 'channel';
}

/**
 * Định dạng tên hiển thị của kênh sạch đẹp, sang trọng
 */
export function formatPrettyChannelName(rawName) {
  let name = cleanTitle(rawName);
  name = name.replace(/\s+(FHD|UHD|4K|2K|HD|SD|50fps|60fps|HEVC|H265|RAW)(\s+|$)/gi, ' ');
  name = name.replace(/^(Kênh|Kenh|Channel)\s+/i, '');
  return name.trim();
}

export function loadAndMergePlaylists(callback) {
  // NGUYÊN TẮC: Nguồn 1 ưu tiên hàng đầu -> Nguồn 2 -> Nguồn 3 bổ sung kênh thiếu
  const sources = [
    { url: SOURCE_1_URL, name: 'SuperOK' },
    { url: SOURCE_2_URL, name: 'VMT' },
    { url: SOURCE_3_URL, name: 'VietAnhTV' }
  ];

  let completed = 0;
  const parsedLists = [];

  sources.forEach((srcObj, index) => {
    xhrGet(getFetchUrl(srcObj.url), (err, text) => {
      if (err) {
        console.warn(`[Sources] Không thể tải ${srcObj.name}:`, err.message);
      }
      parsedLists[index] = {
        name: srcObj.name,
        channels: (!err && text) ? parseM3U(text) : []
      };
      completed++;

      if (completed === sources.length) {
        const mergedObj = {};
        const mergedList = [];

        // Duyệt tuần tự theo đúng thứ tự ưu tiên: Nguồn 1 -> Nguồn 2 -> Nguồn 3
        for (let i = 0; i < parsedLists.length; i++) {
          const srcData = parsedLists[i];
          if (!srcData || !srcData.channels) continue;

          for (let j = 0; j < srcData.channels.length; j++) {
            const ch = srcData.channels[j];
            if (isBlockedChannelOrGroup(ch.name, ch.group)) {
              continue;
            }

            const cleanGroup = standardizeCategory(ch.group);
            const prettyName = formatPrettyChannelName(ch.name);
            ch.name = prettyName;
            ch.group = cleanGroup;

            const norm = normalizeName(ch.name, ch.id);
            if (!norm) continue;

            const streamSource = {
              sourceName: srcData.name,
              url: ch.url,
              licenseKey: ch.licenseKey,
              userAgent: ch.userAgent
            };

            // NẾU KÊNH CHƯA CÓ TRONG DANH SÁCH: THÊM MỚI VÀO
            if (!mergedObj[norm]) {
              ch.sources = [streamSource];
              ch.activeSourceIndex = 0;
              mergedObj[norm] = ch;
              mergedList.push(ch);
            } 
            // NẾU KÊNH ĐÃ CÓ: LƯU THÊM NGUỒN PHÁT DỰ PHÒNG
            else {
              const existing = mergedObj[norm];
              if (!existing.sources) {
                existing.sources = [{
                  sourceName: 'Gốc',
                  url: existing.url,
                  licenseKey: existing.licenseKey,
                  userAgent: existing.userAgent
                }];
              }
              const isDuplicateUrl = existing.sources.some(s => s.url === ch.url);
              if (!isDuplicateUrl) {
                existing.sources.push(streamSource);
              }
              if (!existing.logo && ch.logo) {
                existing.logo = ch.logo;
              }
            }
          }
        }

        const groupedChannels = {};
        const categoryList = [];

        for (let k = 0; k < mergedList.length; k++) {
          const ch = mergedList[k];
          const grp = ch.group || 'Khác';
          if (!groupedChannels[grp]) {
            groupedChannels[grp] = [];
            categoryList.push(grp);
          }
          groupedChannels[grp].push(ch);
        }

        console.log(`[Sources] Đã gộp và lọc trùng hoàn toàn: ${mergedList.length} kênh duy nhất, ${categoryList.length} nhóm danh mục!`);
        callback({ allChannels: mergedList, groupedChannels, categoryList });
      }
    });
  });
}
