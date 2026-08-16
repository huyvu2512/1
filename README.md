# 📺 TizenBrew IPTV Player DRM

[![Platform](https://img.shields.io/badge/Platform-Samsung%20Tizen%20Smart%20TV%20%7C%20Web-00A9E0?style=for-the-badge&logo=samsung)](https://github.com/huyvu2512/tizenbrew-iptv-drm)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES5%20%2F%20Chrome%2047%20Compatible-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://github.com/huyvu2512/tizenbrew-iptv-drm)
[![Shaka Player](https://img.shields.io/badge/Shaka%20Player-ClearKey%20DRM%20%7C%20DASH%20%7C%20HLS-FF0000?style=for-the-badge&logo=youtube)](https://github.com/huyvu2512/tizenbrew-iptv-drm)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

> Ứng dụng xem truyền hình trực tuyến IPTV hiện đại, hỗ trợ giải mã **ClearKey DRM**, chuẩn luồng phát **MPEG-DASH / HLS**, giao diện **TiviMate Dark Theme** sang trọng, bảng **Lịch phát sóng EPG 2 cột** thông minh, tương thích tối đa với Samsung Smart TV (**Tizen 3.0+ / 2017+**).

---

## ✨ Tính Năng Nổi Bật

### 🎬 1. Trình Phát Video & Giải Mã DRM Mạnh Mẽ
- **Shaka Player v4.13.2+**: Tích hợp trình phát video tiêu chuẩn công nghiệp hỗ trợ cả luồng **MPEG-DASH (`.mpd`)** và **HLS (`.m3u8`)**.
- **Giải mã ClearKey DRM**: Tự động nhận diện cấu hình `keyId` và `key` từ danh sách kênh để giải mã trực tiếp luồng truyền hình bản quyền chất lượng cao.
- **Tự động chuyển đổi Backup Stream**: Tự động chuyển luồng dự phòng nếu luồng phát chính gặp sự cố mạng hoặc lỗi DRM.
- **Tùy chỉnh Chất lượng & Kênh âm thanh**: Cho phép lựa chọn độ phân giải (Auto, 1080p, 720p, 576p,...) và chuyển đổi kênh âm thanh đa ngôn ngữ ngay trên OSD.

### 🎨 2. Giao Diện TiviMate Dark Theme Đẳng Cấp
- **Chế độ PIP (Picture-in-Picture) Thu Nhỏ Thông Minh**: Khi mở danh sách kênh hoặc menu, màn hình video tự động co gọn sang góc phải một cách mượt mà, không làm gián đoạn việc xem truyền hình.
- **Thanh Thông Tin OSD Hiện Đại**: Hiển thị Logo kênh, Tên kênh, Chương trình đang phát trực tiếp, Thanh tiến trình thời gian (Timeline) và Thông số video thời gian thực (`1920x1080 @ 50fps | 4.2 Mbps`).
- **Nút Điều Khiển Dạng Viên Thuốc (Action Pills)**: Bố cục nút bấm đáy trang nhã (Danh sách kênh, Lịch phát sóng, Chất lượng, Âm thanh).

### 📅 3. Bảng Lịch Phát Sóng EPG 2 Cột Chuyên Nghiệp
- **Giao Diện 2 Cột Rộng Rãi**:
  - **Cột Trái (250px)**: Danh sách kênh kèm Logo to rõ, duyệt nhanh qua lại giữa các kênh mà không làm ngắt video đang xem.
  - **Cột Phải**: Lịch phát sóng chi tiết của kênh được chọn.
- **Tự Động Cuộn Mục LIVE Ra Trung Tâm**: Chương trình đang chiếu luôn hiển thị ở chính giữa khung nhìn.
- **Phân Biệt Quá Khứ & Tương Lai**: Tự động làm mờ các chương trình đã kết thúc và chặn tua ngược lên quá khứ.
- **Thông Báo Trạng Thái**: Tự động thông báo nếu kênh chưa cập nhật dữ liệu lịch cho ngày hôm nay.

### 🔄 4. Bộ Nạp EPG XMLTV Đa Nguồn Thông Minh
- **Kết hợp 2 nguồn EPG hàng đầu Việt Nam**:
  1. `https://lichphatsong.io.vn/epg.xml` (Ưu tiên)
  2. `https://epg.blaosolar.vn/schedule/epg.xml` (Bổ sung kênh thiếu)
- **Thuật toán Smart Merge**: Tự động bổ sung các kênh còn thiếu và cập nhật sang nguồn mới nếu nguồn trước đó chứa lịch đã hết hạn.
- **Đồng bộ hóa Tên kênh**: Chuẩn hóa tên kênh tiếng Việt tự động cho các đài VTV, HTV, VTVcab, SCTV, và các đài tỉnh thành.

### 🔍 5. Tìm Kiếm Kênh & Điều Khiển Remote TV Tối Ưu
- **Tìm kiếm tức thì**: Nhập từ khóa để lọc kênh ngay lập tức trong danh mục.
- **Tương thích 100% Samsung Tizen Smart TV**: Hỗ trợ đầy đủ các phím điều khiển từ xa (D-Pad Lên, Xuống, Trái, Phải, Enter, Return/Back, Play, Pause, Info).
- **Biên dịch ES5 / Chrome 47**: Mã nguồn được tự động chuyển đổi qua Babel đảm bảo chạy mượt mà trên các dòng TV Samsung đời cũ từ Tizen 3.0 (2017) đến các dòng TV mới nhất.

---

## 🎮 Hướng Dẫn Sử Dụng Điều Khiển (Remote Keymap)

| Phím Remote | Chế độ Toàn màn hình (Fullscreen) | Chế độ Mở Menu Danh Sách Kênh | Khi Mở Bảng Lịch Phát Sóng (EPG) |
| :--- | :--- | :--- | :--- |
| **LÊN / XUỐNG** | Chuyển kênh kế tiếp / trước đó | Di chuyển chọn kênh trong danh sách | Cuộn danh sách kênh (cột Trái) / Lịch (cột Phải) |
| **TRÁI / PHẢI** | Chuyển qua lại các nút OSD đáy | Chuyển nhóm danh mục đài (VTV, HTV,...) | Chuyển đổi giữa Cột Kênh và Cột Lịch |
| **OK / ENTER** | Mở bảng tương ứng / Play-Pause | Phát kênh đang chọn | Phát kênh đang chọn |
| **RETURN / BACK** | Mở Menu danh sách kênh | Đóng Menu / Thoát tìm kiếm | Đóng bảng Lịch phát sóng |
| **PLAY / PAUSE** | Tạm dừng / Tiếp tục phát video | Tạm dừng / Tiếp tục phát video | Tạm dừng / Tiếp tục phát video |
| **INFO** | Bật hiển thị thanh thông tin OSD | - | - |

---

## 📂 Cấu Trúc Mã Nguồn

```text
tizenbrew-iptv-drm/
├── dist/
│   └── index.js              # Bundle ES5 hoàn chỉnh cho Samsung Tizen / Web
├── src/
│   ├── index.js              # Khởi tạo App & điều hướng sự kiện Remote
│   ├── styles.js             # Toàn bộ Style giao diện CSS Dark Modern
│   ├── osd.js                # Quản lý OSD Banner & Modal Lịch phát sóng 2 cột
│   ├── drawer.js             # Menu danh sách kênh, danh mục & tìm kiếm
│   ├── epg.js                # Nạp & hợp nhất dữ liệu XMLTV EPG đa nguồn
│   ├── player.js             # Khởi tạo Shaka Player, ClearKey DRM & luồng phát
│   ├── sources.js            # Tải & hợp nhất playlist M3U8 / MPD
│   └── remote.js             # Định nghĩa KeyCodes Samsung Tizen Remote
├── build.js                  # Script build tự động: esbuild + Babel (Chrome 47 / ES5)
├── server.js                 # Dev Server & Streaming Proxy (Bypass CORS, Rewrite Sub-playlist)
├── package.json              # Quản lý dependencies & scripts
└── README.md                 # Tài liệu hướng dẫn sử dụng chi tiết
```

---

## 🚀 Cài Đặt & Chạy Thử Nghiệm

### 1. Yêu Cầu Môi Trường
- **Node.js**: Phiên bản 16.x trở lên.
- **Trình duyệt Web** hoặc **TizenBrew / Samsung Tizen Studio** trên Smart TV.

### 2. Cài Đặt Thư Viện
```bash
# Clone dự án
git clone https://github.com/huyvu2512/tizenbrew-iptv-drm.git
cd tizenbrew-iptv-drm

# Cài đặt các gói phụ thuộc
npm install
```

### 3. Khởi Động Máy Chủ Dev & Proxy
```bash
npm start
```
> Ứng dụng sẽ chạy tại địa chỉ: **`http://localhost:3000`**

### 4. Đóng Gói / Biên Dịch (Build Production)
```bash
npm run build
```
*Script sẽ tự động gộp mã nguồn với `esbuild` và chuyển đổi sang chuẩn `ES5 / Chrome 47` thông qua `Babel` lưu tại thư mục `dist/index.js`.*

---

## 📺 Cài Đặt Lên Samsung Smart TV Qua TizenBrew

1. Mở ứng dụng **TizenBrew** trên Samsung Smart TV.
2. Thêm Module / Package URL dẫn tới file `dist/index.js` từ máy chủ lưu trữ hoặc CDN của bạn.
3. Khởi chạy ứng dụng và tận hưởng trải nghiệm truyền hình chuẩn TiviMate mượt mà trên TV!

---

## 📄 Bản Quyền & Tuyên Bố Từ Chối Trách Nhiệm (Disclaimer)
- Dự án này được phát triển phục vụ mục đích nghiên cứu, học tập và trải nghiệm công nghệ đa phương tiện trên nền tảng Samsung Tizen Smart TV.
- Toàn bộ nguồn phát sóng và dữ liệu lịch EPG được thu thập từ các nguồn công khai trên Internet. Chúng tôi không lưu trữ hoặc chịu trách nhiệm về nội dung của các luồng phát này.

---
*Phát triển bởi [huyvu2512](https://github.com/huyvu2512) với ❤️ dành cho cộng đồng TizenBrew & IPTV Việt Nam.*
