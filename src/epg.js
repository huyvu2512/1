export const EPG_SOURCE_1 = 'https://lichphatsong.io.vn/epg.xml'; // Nguồn EPG 1 (Ưu tiên)
export const EPG_SOURCE_2 = 'https://epg.blaosolar.vn/schedule/epg.xml'; // Nguồn EPG 2 (Bổ sung kênh thiếu)

let epgData = {};
let isLoaded = false;

function parseXMLTVDate(str) {
  if (!str) return null;
  try {
    const clean = str.trim();
    const y = parseInt(clean.substring(0, 4), 10);
    const m = parseInt(clean.substring(4, 6), 10) - 1;
    const d = parseInt(clean.substring(6, 8), 10);
    const h = parseInt(clean.substring(8, 10), 10);
    const min = parseInt(clean.substring(10, 12), 10);
    const s = parseInt(clean.substring(12, 14), 10) || 0;
    return new Date(y, m, d, h, min, s);
  } catch (e) {
    return null;
  }
}

function removeVietnameseTones(str) {
  if (!str) return '';
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

export function normalizeEpgName(name) {
  if (!name) return '';
  let s = removeVietnameseTones(name.toLowerCase());
  s = s.replace(/[\s\-_.:/()\[\]]/g, '');
  s = s.replace(/(fhd|uhd|4k|2k|hd|sd|50fps|60fps|hevc|h265|raw|tv)$/g, '');

  if (s.startsWith('vinhlong') || /^thvl\d+$/.test(s)) {
    const num = s.match(/\d+/);
    return num ? `thvl${num[0]}` : 'thvl1';
  }
  if (s.startsWith('hanoi') || /^h\d+$/.test(s)) {
    const num = s.match(/\d+/);
    return num ? `hanoi${num[0]}` : 'hanoi1';
  }
  if (s.startsWith('angiang') || /^atv\d+$/.test(s)) {
    const num = s.match(/\d+/);
    return num ? `angiang${num[0]}` : 'angiang1';
  }
  if (s.startsWith('lamdong') || /^ltv\d+$/.test(s)) {
    const num = s.match(/\d+/);
    return num ? `lamdong${num[0]}` : 'lamdong1';
  }
  if (s.startsWith('haiphong') || s.startsWith('thp')) {
    const num = s.match(/\d+/);
    return num ? `haiphong${num[0]}` : 'haiphong1';
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

  return s;
}

export function isEpgReady() {
  return isLoaded;
}

function parseEpgXml(xmlText) {
  const result = {};
  if (!xmlText || typeof xmlText !== 'string') return result;
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const channelMap = {};
    const channelNodes = xmlDoc.getElementsByTagName('channel');
    for (let i = 0; i < channelNodes.length; i++) {
      const chId = channelNodes[i].getAttribute('id');
      const dName = channelNodes[i].getElementsByTagName('display-name')[0];
      const name = dName ? dName.textContent : chId;
      const norm = normalizeEpgName(name) || normalizeEpgName(chId);
      if (chId && norm) {
        channelMap[chId.toLowerCase()] = norm;
      }
    }

    const programmes = xmlDoc.getElementsByTagName('programme');
    for (let i = 0; i < programmes.length; i++) {
      const p = programmes[i];
      const chId = (p.getAttribute('channel') || '').toLowerCase();
      const normKey = channelMap[chId] || normalizeEpgName(chId);
      if (!normKey) continue;

      const start = parseXMLTVDate(p.getAttribute('start'));
      const stop = parseXMLTVDate(p.getAttribute('stop'));
      const titleEl = p.getElementsByTagName('title')[0];
      const descEl = p.getElementsByTagName('desc')[0];
      
      const rawTitle = titleEl ? titleEl.textContent.trim() : '';
      const title = rawTitle.toUpperCase();
      const desc = descEl ? descEl.textContent.trim() : '';

      if (!result[normKey]) {
        result[normKey] = [];
      }
      result[normKey].push({ start, stop, title, desc });
    }
  } catch (err) {
    console.error('[EPG] Lỗi phân tích XML:', err);
  }
  return result;
}

function fetchXml(url, callback) {
  const xhr = new XMLHttpRequest();
  const bustUrl = `${url}?_t=${Date.now()}`;
  const fetchUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `/api/stream?url=${encodeURIComponent(bustUrl)}`
    : bustUrl;

  xhr.open('GET', fetchUrl, true);
  xhr.timeout = 15000; // 15s để tải đầy đủ dữ liệu EPG 6MB
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
  xhr.ontimeout = function () {
    callback(new Error('Timeout'), null);
  };
  try {
    xhr.send();
  } catch (e) {
    callback(e, null);
  }
}

export function loadEPG(onLoaded) {
  // NGUYÊN TẮC HỢP NHẤT EPG THÔNG MINH:
  // 1. Tải Nguồn 1 (LichPhatSong)
  fetchXml(EPG_SOURCE_1, (err1, xml1) => {
    if (!err1 && xml1) {
      const src1Data = parseEpgXml(xml1);
      Object.assign(epgData, src1Data);
      isLoaded = true;
      console.log(`[EPG] Đã nạp thành công Nguồn 1 (LichPhatSong): ${Object.keys(epgData).length} kênh.`);
      if (onLoaded) onLoaded();
    }

    // 2. Tải tiếp Nguồn 2 (BlaoSolar) và hợp nhất thông minh (bổ sung kênh thiếu HOẶC cập nhật kênh bị hết hạn ở Nguồn 1)
    fetchXml(EPG_SOURCE_2, (err2, xml2) => {
      if (!err2 && xml2) {
        const src2Data = parseEpgXml(xml2);
        const now = new Date();
        let added = 0;
        let updated = 0;

        Object.keys(src2Data).forEach(key => {
          const s2List = src2Data[key] || [];
          if (s2List.length === 0) return;

          const s1List = epgData[key] || [];
          const s1HasValid = s1List.some(p => p.stop >= now);
          const s2HasValid = s2List.some(p => p.stop >= now);

          if (s1List.length === 0) {
            epgData[key] = s2List;
            added++;
          } else if (!s1HasValid && s2HasValid) {
            // Nguồn 1 chỉ có lịch cũ của hôm qua, Nguồn 2 có lịch hôm nay -> Cập nhật sang Nguồn 2!
            epgData[key] = s2List;
            updated++;
          }
        });

        isLoaded = true;
        console.log(`[EPG] Nguồn 2 (BlaoSolar): Thêm mới ${added} kênh, Cập nhật mới ${updated} kênh. Tổng: ${Object.keys(epgData).length} kênh EPG!`);
        if (onLoaded) onLoaded();
      } else {
        console.warn('[EPG] Nguồn 2 (BlaoSolar) lỗi hoặc quá tải, tiếp tục với Nguồn 1.');
        isLoaded = true;
        if (onLoaded) onLoaded();
      }
    });
  });
}

const formatHM = (d) => {
  if (!d) return '--:--';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function getChannelEPG(channelName) {
  const norm = normalizeEpgName(channelName);
  const list = epgData[norm] || [];
  if (list.length === 0) return null;

  const now = new Date();
  let currentProg = null;
  let nextProg = null;

  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (p.start && p.stop && now >= p.start && now <= p.stop) {
      currentProg = p;
      nextProg = list[i + 1] || null;
      break;
    }
  }

  if (!currentProg) return null;

  const total = currentProg.stop.getTime() - currentProg.start.getTime();
  const elapsed = now.getTime() - currentProg.start.getTime();
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / Math.max(1, total)) * 100)));

  return {
    current: {
      title: currentProg.title,
      desc: currentProg.desc,
      startTimeStr: formatHM(currentProg.start),
      stopTimeStr: formatHM(currentProg.stop),
      progressPercent
    },
    next: nextProg ? {
      title: nextProg.title,
      startTimeStr: formatHM(nextProg.start),
      stopTimeStr: formatHM(nextProg.stop)
    } : null
  };
}

export function getChannelFullSchedule(channelName) {
  const norm = normalizeEpgName(channelName);
  const list = epgData[norm] || [];
  if (list.length === 0) return [];

  const now = new Date();
  return list.map(p => {
    const isPast = p.stop < now;
    const isCurrent = p.start <= now && p.stop >= now;
    const isFuture = p.start > now;
    return {
      title: p.title,
      startStr: formatHM(p.start),
      stopStr: formatHM(p.stop),
      isPast,
      isCurrent,
      isFuture
    };
  });
}
