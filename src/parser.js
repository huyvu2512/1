/**
 * Parser phân tích danh sách phát M3U với hỗ trợ các thẻ #KODIPROP (DRM Widevine / ClearKey, MPD, UserAgent)
 */
export function parseM3U(content) {
  if (!content || typeof content !== 'string') return [];

  var lines = content.split(/\r?\n/);
  var channels = [];
  var current = {};

  for (var i = 0; i < lines.length; i++) {
    var rawLine = lines[i];
    var line = rawLine.trim();
    if (!line) continue;

    if (line.indexOf('#EXTINF:') === 0) {
      var commaIndex = line.lastIndexOf(',');
      var name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Kênh truyền hình';

      var logoMatch = line.match(/tvg-logo=["']?([^"'>\s,]+)["']?/i);
      var groupMatch = line.match(/group-title=["']?([^"'>,]+)["']?/i);
      var idMatch = line.match(/tvg-id=["']?([^"'>\s,]+)["']?/i);

      current = {
        name: name || 'Kênh không tên',
        logo: logoMatch ? logoMatch[1] : '',
        group: groupMatch ? groupMatch[1] : 'Mặc định',
        id: idMatch ? idMatch[1] : ''
      };
    } else if (line.indexOf('#KODIPROP:inputstream.adaptive.license_key=') === 0) {
      current.licenseKey = line.split('=')[1].trim();
    } else if (line.indexOf('#KODIPROP:inputstream.adaptive.manifest_type=') === 0) {
      current.manifestType = line.split('=')[1].trim();
    } else if (line.indexOf('#KODIPROP:inputstream.adaptive.license_type=') === 0) {
      current.licenseType = line.split('=')[1].trim();
    } else if (line.indexOf('#EXTVLCOPT:http-user-agent=') === 0) {
      current.userAgent = line.split('=')[1].trim();
    } else if (line.indexOf('http://') === 0 || line.indexOf('https://') === 0) {
      current.url = line;
      if (current.name) {
        channels.push(Object.assign({}, current));
      }
      current = {};
    }
  }

  return channels;
}
