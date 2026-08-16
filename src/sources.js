import { parseM3U } from './parser.js';

export const SOURCE_1_URL = 'https://raw.githubusercontent.com/hieu-TQS/error/refs/heads/main/error.m3u'; // SuperOK VIP DRM (Nguồn 1 - Ưu tiên hàng đầu)
export const SOURCE_2_URL = 'https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/vmttv'; // VMT Thể Thao (Nguồn 2)
export const SOURCE_3_URL = 'https://tv.vietanhtv.top/tv/'; // VietAnhTV DRM (Nguồn 3 - Bổ sung kênh thiếu)

export function xhrGet(url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  xhr.setRequestHeader('Pragma', 'no-cache');
  xhr.setRequestHeader('Expires', '0');

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, xhr.responseText);
      } else {
        callback(new Error(`HTTP ${xhr.status}`), null);
      }
    }
  };
  xhr.onerror = function () {
    callback(new Error('Network error'), null);
  };
  try {
    xhr.send();
  } catch (e) {
    callback(e, null);
  }
}

export function getFetchUrl(url) {
  let cleanUrl = url.trim();
  if (cleanUrl.indexOf('tv.vietanhtv.top/tv') !== -1 && cleanUrl.slice(-1) !== '/') {
    cleanUrl += '/';
  }
  const separator = cleanUrl.includes('?') ? '&' : '?';
  const bustUrl = `${cleanUrl}${separator}_t=${Date.now()}`;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `/api/stream?url=${encodeURIComponent(bustUrl)}`;
  }
  return bustUrl;
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
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
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
  if (!cleaned) return 'Khác';
  const lower = removeVietnameseTones(cleaned.toLowerCase());

  if (lower.includes('dia phuong') || lower.includes('tinh')) return 'Địa Phương';
  if (lower.includes('quoc te')) return 'Quốc Tế';
  if (lower.includes('the thao') || lower.includes('sport')) return 'Thể Thao';
  if (lower.includes('vtv') && !lower.includes('vtvcab') && !lower.includes('vtvprime')) return 'VTV';
  if (lower.includes('htv') && !lower.includes('htvc')) return 'HTV';
  if (lower.includes('htvc')) return 'HTVC';
  if (lower.includes('sctv')) return 'SCTV';
  if (lower.includes('vtvcab') || lower.includes('on ')) return 'VTVCab';
  if (lower.includes('thiet yeu')) return 'Thiết Yếu';
  if (lower.includes('su kien tv360') || lower.includes('tv360')) return 'Sự Kiện TV360';
  if (lower.includes('su kien fpt') || lower.includes('fpt play') || lower.includes('su kien') || lower.includes('event')) return 'Sự Kiện';
  if (lower.includes('radio') || lower.includes('nghe nhac')) return 'Radio';
  if (lower.includes('phim') || lower.includes('rap phim') || lower.includes('movie')) return 'Phim & Giải Trí';
  if (lower.includes('samsung')) return 'Samsung TV';
  if (lower.includes('rakuten')) return 'Rakuten';
  if (lower.includes('abc kids') || lower.includes('pbs kids')) return 'Thiếu Nhi';
  if (lower.includes('han quoc') || lower.includes('korea')) return 'Hàn Quốc';
  if (lower.includes('trung quoc') || lower.includes('china') || lower.includes('cctv')) return 'Trung Quốc';
  if (lower.includes('in the box')) return 'In The Box';

  return cleaned;
}

/**
 * Chuẩn hóa mã kênh (Unique ID) để nhận diện và gộp chính xác 100% giữa 3 nguồn
 */
export function normalizeName(name, tvgId) {
  let s = (name || '').toLowerCase();

  // 1. Tách cấu trúc dạng VietAnhTV "TN HD | TH Tây Ninh", "ATV1 HD | TH An Giang", "DRT HD | TH Đắk Lắk"
  if (/\|\s*th\s*/i.test(s)) {
    s = s.replace(/^.*?\|\s*th\s*/i, '');
  } else if (/\|\s*b/i.test(s)) {
    s = s.replace(/\s*\|\s*b.*$/i, '');
  }

  // Cắt bỏ các đuôi râu ria
  s = s.split(' - đài ptth')[0];
  s = s.split(' - báo và ptth')[0];
  s = s.split(' - đài truyền hình')[0];
  s = s.split(' | báo và ptth')[0];
  s = s.split(' - báo ')[0];
  s = s.split(' - vie channel')[0];
  s = s.split(' - you tv')[0];

  // Bỏ dấu tiếng Việt
  s = removeVietnameseTones(s);

  // Bỏ các từ định dạng chất lượng / tag
  s = s.replace(/\b(hd|sd|fhd|4k|2k|uhd|50fps|60fps|raw|vip|tivi|tv|channel|ott|live|hls|mpd)\b/g, '');
  s = s.replace(/[^a-z0-9]/g, '').trim();

  // 2. Quy đổi bí danh (Alias mapping) cho toàn bộ các đài tỉnh
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

  // TV360 Events
  if (s.includes('tv360')) {
    const num = s.match(/\d+/);
    if (num) return `tv360plus${num[0]}`;
  }

  // VTVcab
  if (s.includes('viegiaitri') || s.includes('giaitritv')) return 'onviegiaitri';
  if (s.includes('phimviet')) return 'onphimviet';
  if (s.includes('onmovies') || s.includes('vanhoa')) return 'onmovies';
  if (s.includes('echannel') || s.includes('onechannel')) return 'onechannel';
  if (s.includes('o2tv') || s.includes('ono2tv')) return 'ono2tv';
  if (s.includes('bibi')) return 'onbibi';
  if (s.includes('infotv') || s.includes('oninfotv')) return 'oninfotv';
  if (s.includes('oncine') || s.includes('filmtv')) return 'oncine';
  if (s.includes('onstyle') || s.includes('styletv')) return 'onstyle';
  if (s.includes('onmusic') || s.includes('mchannel')) return 'onmusic';
  if (s.includes('ontrending') || s.includes('yeah1tv')) return 'ontrending';
  if (s.includes('viedramas') || s.includes('ddramas')) return 'onviedramas';
  if (s.includes('vfamily')) return 'onvfamily';
  if (s.includes('onkids')) return 'onkids';
  if (s.includes('onlife') || s.includes('lifetv')) return 'onlife';
  if (s.includes('onsports') || s.includes('thethaotv') || s.includes('onsport')) return 'onsports';
  if (s.includes('onfootball') || s.includes('football')) return 'onfootball';

  // In The Box
  if (s.includes('boxmovie1') || s.includes('boxmovies1') || s.includes('bm1')) return 'boxmovie1';
  if (s.includes('boxhits') || s.includes('boxhit')) return 'boxhits';
  if (s.includes('hollywoodclassic')) return 'hollywoodclassics';
  if (s.includes('musicbox')) return 'musicbox';

  return s;
}

export function formatPrettyChannelName(rawName) {
  let name = cleanTitle(rawName);
  if (/\|\s*th\s*/i.test(name)) {
    name = name.replace(/^.*?\|\s*th\s*/i, '').trim();
  }
  name = name.replace(/\s*-\s*(đài ptth|báo và ptth|đài truyền hình|báo).*$/i, '').trim();
  name = name.replace(/\s*\|\s*(báo và ptth|báo).*$/i, '').trim();
  return name;
}

export function fixChannelStream(ch) {
  const norm = normalizeName(ch.name);
  if (norm.includes('qpvn') || norm.includes('quocphong')) {
    ch.url = 'https://live.fptplay53.net/live/media/quocphongvn/live-hls-avc/quocphongvn.m3u8';
  } else if (norm.includes('antv') || norm.includes('anninh')) {
    ch.url = 'https://live.fptplay53.net/fnxhd2/anninhtv_vhls.smil/chunklist.m3u8';
  }
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
      parsedLists[index] = {
        name: srcObj.name,
        channels: (!err && text) ? parseM3U(text) : []
      };
      completed++;

      if (completed === sources.length) {
        const mergedMap = new Map();
        const mergedList = [];

        // Duyệt tuần tự theo đúng thứ tự ưu tiên: Nguồn 1 -> Nguồn 2 -> Nguồn 3
        parsedLists.forEach(srcData => {
          if (!srcData || !srcData.channels) return;
          srcData.channels.forEach(ch => {
            // LỌC BỎ HOÀN TOÀN NHÓM VÀ KÊNH: UPDATE, DỰ PHÒNG, THÔNG BÁO...
            if (isBlockedChannelOrGroup(ch.name, ch.group)) {
              return;
            }

            const cleanGroup = standardizeCategory(ch.group);
            const prettyName = formatPrettyChannelName(ch.name);
            ch.name = prettyName;
            ch.group = cleanGroup;
            fixChannelStream(ch);

            const norm = normalizeName(ch.name, ch.tvgId);
            if (!norm) return;

            const streamSource = {
              sourceName: srcData.name,
              url: ch.url,
              licenseKey: ch.licenseKey,
              userAgent: ch.userAgent
            };

            // NẾU KÊNH CHƯA CÓ TRONG DANH SÁCH: THÊM MỚI VÀO
            if (!mergedMap.has(norm)) {
              ch.sources = [streamSource];
              ch.activeSourceIndex = 0;
              mergedMap.set(norm, ch);
              mergedList.push(ch);
            } 
            // NẾU KÊNH ĐÃ CÓ (Ưu tiên nguồn trước): LƯU NGUỒN NÀY LÀM DỰ PHÒNG
            else {
              const existing = mergedMap.get(norm);
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
          });
        });

        const groupedChannels = {};
        const categoryList = [];

        mergedList.forEach(ch => {
          const grp = ch.group || 'Khác';
          if (!groupedChannels[grp]) {
            groupedChannels[grp] = [];
            categoryList.push(grp);
          }
          groupedChannels[grp].push(ch);
        });

        console.log(`[Sources] Đã gộp và lọc trùng hoàn toàn: ${mergedList.length} kênh duy nhất, ${categoryList.length} nhóm danh mục!`);
        callback({ allChannels: mergedList, groupedChannels, categoryList });
      }
    });
  });
}
