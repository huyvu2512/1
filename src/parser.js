/**
 * Parser phân tích danh sách phát M3U với hỗ trợ các thẻ #KODIPROP (DRM Widevine, MPD)
 */
export function parseM3U(content) {
  if (!content || typeof content !== 'string') return [];

  const lines = content.split(/\r?\n/);
  const channels = [];
  let current = {};

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Parse name: sau dấu phẩy cuối cùng của dòng #EXTINF
      const commaIndex = line.lastIndexOf(',');
      const name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Kênh truyền hình';

      // Parse tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      // Parse group-title
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      // Parse tvg-id
      const idMatch = line.match(/tvg-id="([^"]+)"/i);

      current = {
        name: name || 'Kênh không tên',
        logo: logoMatch ? logoMatch[1] : '',
        group: groupMatch ? groupMatch[1] : 'Mặc định',
        id: idMatch ? idMatch[1] : ''
      };
    } else if (line.startsWith('#KODIPROP:inputstream.adaptive.license_key=')) {
      current.licenseKey = line.split('=')[1].trim();
    } else if (line.startsWith('#KODIPROP:inputstream.adaptive.manifest_type=')) {
      current.manifestType = line.split('=')[1].trim();
    } else if (line.startsWith('#KODIPROP:inputstream.adaptive.license_type=')) {
      current.licenseType = line.split('=')[1].trim();
    } else if (line.startsWith('#EXTVLCOPT:http-user-agent=')) {
      current.userAgent = line.split('=')[1].trim();
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      current.url = line;
      if (current.name) {
        channels.push({ ...current });
      }
      current = {};
    }
  }

  return channels;
}
