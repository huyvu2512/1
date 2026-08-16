export const globalStyles = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    body, html {
      width: 100vw;
      height: 100vh;
      background-color: #000000;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #ffffff;
    }

    #app-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      background-color: #000000;
      overflow: hidden;
    }

    /* MÀN HÌNH VIDEO: CHUYỂN ĐỔI MƯỢT GIỮA FULLSCREEN VÀ THU NHỎ PHẢI (PIP) */
    #video-screen {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: #000000;
      object-fit: contain;
      z-index: 1;
      transition: all 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);
    }

    /* KHI MỞ MENU: THU NHỎ VIDEO SANG NỬA PHẢI MÀN HÌNH */
    #video-screen.pip-right {
      left: 360px !important;
      width: calc(100vw - 360px) !important;
      height: 100vh !important;
    }

    /* LAYER ICON PLAY/PAUSE LỚN Ở GIỮA MÀN HÌNH */
    #center-state-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 15;
      pointer-events: none;
      opacity: 0;
      transform: scale(0.7);
      transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    #center-state-layer.active {
      opacity: 1;
      transform: scale(1);
    }
    #center-state-layer.pip-right {
      left: 360px !important;
      width: calc(100vw - 360px) !important;
    }
    .center-state-circle {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 2px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
    }
    .center-state-circle svg {
      width: 44px;
      height: 44px;
      fill: #ffffff;
    }

    /* SPINNER XOAY TRÒN TRẮNG LÚC NẠP VIDEO */
    #video-spinner-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 12;
      pointer-events: none;
    }
    #video-spinner-layer.active {
      display: flex !important;
    }
    #video-spinner-layer.pip-right {
      left: 360px !important;
      width: calc(100vw - 360px) !important;
    }
    .white-video-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.2);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spinAnim 0.75s linear infinite;
    }
    @keyframes spinAnim {
      to { transform: rotate(360deg); }
    }

    /* KHUNG THÔNG BÁO OFFLINE */
    #video-error-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 14;
      background: rgba(0, 0, 0, 0.9);
    }
    #video-error-layer.active {
      display: flex !important;
    }
    #video-error-layer.pip-right {
      left: 360px !important;
      width: calc(100vw - 360px) !important;
    }
    .error-container-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      text-align: center;
    }
    .error-title-main {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      font-style: italic;
    }
    .err-white { color: #ffffff; }
    .err-cyan { color: #00e5ff; }
    .error-channel-text {
      font-size: 14px;
      font-weight: 700;
      color: #ef4444;
      letter-spacing: 0.8px;
    }

    /* =========================================================================
       BẢNG DANH SÁCH KÊNH (TIVIMATE DRAWER ĐEN XÁM TỐI GIẢN)
       ========================================================================= */
    #tivimate-drawer {
      position: absolute;
      top: 0;
      left: 0;
      width: 360px;
      height: 100vh;
      background-color: #0b0d14;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 20;
      display: flex;
      flex-direction: column;
      transform: translateX(-100%);
      transition: transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);
      box-shadow: 10px 0 30px rgba(0, 0, 0, 0.9);
    }
    #tivimate-drawer.open {
      transform: translateX(0) !important;
    }

    .drawer-header {
      padding: 16px 14px 10px 14px;
      background: #0e111a;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    }

    .drawer-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .app-title-badge {
      font-size: 18px;
      font-weight: 900;
      font-style: italic;
      letter-spacing: -0.5px;
    }
    .title-white { color: #ffffff; }
    .title-cyan { color: #00e5ff; margin-left: 2px; }

    .win-clock-badge {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .win-time {
      font-size: 14px;
      font-weight: 800;
      color: #ffffff;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.5px;
    }
    .win-date {
      font-size: 10.5px;
      font-weight: 600;
      color: #94a3b8;
    }

    /* KHUNG TÌM KIẾM KÊNH */
    .drawer-search-wrapper {
      margin-bottom: 10px;
    }
    .search-input-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #151923;
      border: 1.5px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      transition: all 0.15s ease;
    }
    .search-input-box:focus-within,
    .search-input-box.focused {
      background: #1c2230;
      border-color: #ffffff;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
    }
    .search-icon {
      width: 16px;
      height: 16px;
      color: #94a3b8;
      flex-shrink: 0;
    }
    .search-input-box.focused .search-icon,
    .search-input-box:focus-within .search-icon {
      color: #f97316;
    }
    #channel-search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
    }
    #channel-search-input::placeholder {
      color: #64748b;
      font-weight: 500;
    }
    .search-clear-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      transition: all 0.1s ease;
    }
    .search-clear-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
    .search-clear-btn svg {
      width: 13px;
      height: 13px;
    }

    /* THANH CUỘN NGANG NHÓM DANH MỤC */
    .category-nav-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      white-space: nowrap;
      padding: 2px 0 4px 0;
      scrollbar-width: none;
    }
    .category-nav-bar::-webkit-scrollbar { display: none; }

    .cat-chip {
      padding: 5px 13px;
      background: #171b26;
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 16px;
      font-size: 12.5px;
      font-weight: 700;
      color: #94a3b8;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .cat-chip:hover {
      background: #232938;
      color: #ffffff;
    }
    .cat-chip.active {
      background: #272e3f;
      border: 1.5px solid #ffffff;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(255, 255, 255, 0.12);
    }

    /* DANH SÁCH HÀNG KÊNH */
    .drawer-channel-list {
      flex: 1;
      overflow-y: auto;
      padding: 10px 12px;
    }
    .drawer-channel-list::-webkit-scrollbar { width: 4px; }
    .drawer-channel-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }

    /* MỖI HÀNG KÊNH: CHIỀU CAO ĐỒNG NHẤT 60PX */
    .channel-row-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 12px;
      margin-bottom: 5px;
      height: 60px;
      min-height: 60px;
      background: #13161f;
      border: 1.5px solid transparent;
      border-radius: 9px;
      cursor: pointer;
      transition: all 0.1s ease;
    }
    .channel-row-item:hover {
      background: #191d28;
    }

    /* KHI ĐƯỢC CHỌN (FOCUS): BỌC KHUNG VIỀN MÀU TRẮNG */
    .channel-row-item.focused {
      background: #1c212e;
      border-color: #ffffff !important;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.18);
    }

    /* LOGO NHỎ GỌN */
    .ch-logo-container {
      width: 58px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ch-logo-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .ch-logo-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 6px;
    }

    .ch-content-col {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2.5px;
    }

    .ch-name-orange {
      font-size: 13.5px;
      font-weight: 800;
      color: #f97316;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ch-name-plain {
      font-size: 14px;
      font-weight: 800;
      color: #f97316;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ch-program-gray {
      font-size: 11.5px;
      font-weight: 600;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ch-timeline-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 1px;
    }
    .ch-time-text {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      font-variant-numeric: tabular-nums;
    }
    .ch-timeline-bar-bg {
      flex: 1;
      height: 3px;
      background: #202636;
      border-radius: 2px;
      overflow: hidden;
    }
    .ch-timeline-bar-fill {
      height: 100%;
      background: #f97316;
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    /* SKELETON LOADING ĐEN XÁM NHẸ */
    .skeleton-box {
      background: linear-gradient(90deg, #181d2a 25%, #232a3d 50%, #181d2a 75%);
      background-size: 200% 100%;
      animation: skeletonShimmer 1.5s infinite;
      border-radius: 4px;
    }
    @keyframes skeletonShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .skeleton-title {
      width: 70%;
      height: 10px;
      margin-bottom: 2px;
    }
    .skeleton-timeline {
      width: 90%;
      height: 4px;
    }

    /* =========================================================================
       KHUNG OSD BANNER DƯỚI (SLIM GLASS + HÀNG VIÊN THUỐC LỚN ĐẸP SANG TRỌNG)
       ========================================================================= */
    #dl-osd-banner {
      position: absolute;
      bottom: 24px;
      left: 36px;
      right: 36px;
      z-index: 30;
      background: rgba(11, 15, 23, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 14px 22px 14px 22px;
      box-shadow: 0 14px 40px rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      gap: 10px;
      opacity: 0;
      transform: translateY(18px);
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);
    }
    #dl-osd-banner.active {
      opacity: 1 !important;
      transform: translateY(0) !important;
      pointer-events: auto !important;
    }
    #dl-osd-banner.pip-right {
      left: 384px !important;
      right: 24px !important;
      bottom: 20px !important;
    }

    /* KHI Ở CHẾ ĐỘ PIP THU NHỎ (MỞ DRAWER): ẨN HOÀN TOÀN HÀNG 4 NÚT VIÊN THUỐC */
    #dl-osd-banner.pip-right .osd-action-pills-row {
      display: none !important;
    }

    /* HÀNG 1: THÔNG TIN KÊNH + LIVE + SPECS */
    .osd-main-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .osd-left-info {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
      flex: 1;
    }
    .osd-logo-box {
      width: 58px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .osd-logo-box img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .osd-text-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .osd-ch-name {
      font-size: 17px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .osd-prog-name {
      font-size: 12.5px;
      font-weight: 800;
      color: #f97316;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .osd-right-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .osd-live-tag {
      padding: 3px 8px;
      background: #dc2626;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 0.6px;
    }
    .osd-specs-text {
      font-size: 12px;
      font-weight: 700;
      color: #f97316;
      font-family: 'Consolas', 'Courier New', monospace;
      letter-spacing: 0.2px;
    }

    /* HÀNG 2: TIMELINE */
    .osd-timeline-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .osd-time-bound {
      font-size: 11px;
      font-weight: 700;
      color: #cbd5e1;
      font-variant-numeric: tabular-nums;
    }
    .osd-timeline-track {
      flex: 1;
      height: 4px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
      overflow: hidden;
    }
    .osd-timeline-fill {
      height: 100%;
      background: #f97316;
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    /* HÀNG 3: CÁC NÚT VIÊN THUỐC ĐIỀU KHIỂN (TO HƠN & ĐẸP NỔI BẬT) */
    .osd-action-pills-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .bottom-pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 16px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.08);
      border: 1.5px solid rgba(255, 255, 255, 0.12);
      color: #ffffff;
      cursor: pointer;
      outline: none;
      font-size: 13.5px;
      font-weight: 700;
      line-height: 1;
      transition: all 0.15s ease;
    }
    .bottom-pill-btn svg {
      width: 17px;
      height: 17px;
      stroke: currentColor;
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      display: inline-block;
      vertical-align: middle;
      flex-shrink: 0;
    }
    .bottom-pill-btn span {
      font-size: 13.5px;
      font-weight: 700;
      line-height: 1;
      display: inline-block;
      vertical-align: middle;
    }

    /* KHI VIÊN THUỐC ĐƯỢC CHỌN (FOCUS BẰNG REMOTE HOẶC HOVER) */
    .bottom-pill-btn.focused,
    .bottom-pill-btn:hover {
      background: #ffffff !important;
      border-color: #ffffff !important;
      color: #0b0d14 !important;
      box-shadow: 0 0 14px rgba(255, 255, 255, 0.45);
      transform: scale(1.02);
    }
    .bottom-pill-btn.focused svg,
    .bottom-pill-btn:hover svg {
      stroke: #0b0d14 !important;
    }

    /* =========================================================================
       POPUP DIALOG CHỌN LỊCH PHÁT SÓNG, CHẤT LƯỢNG & ÂM THANH
       ========================================================================= */
    #quality-audio-dialog {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 100;
      display: none;
      align-items: center;
      justify-content: center;
    }
    #quality-audio-dialog.active {
      display: flex !important;
    }

    .dialog-card {
      width: 480px;
      max-width: 90vw;
      background: #0f1422;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .dialog-title {
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dialog-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 360px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .dialog-list::-webkit-scrollbar { width: 4px; }
    .dialog-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }

    .dialog-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1.5px solid transparent;
      color: #cbd5e1;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .dialog-item.focused,
    .dialog-item:hover {
      background: #1e293b;
      border-color: #ffffff !important;
      color: #ffffff;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
    }
    .dialog-item.active {
      color: #f97316;
      font-weight: 800;
    }

    /* MỤC LỊCH PHÁT SÓNG TRONG POPUP */
    .epg-schedule-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1.5px solid transparent;
      transition: all 0.12s ease;
    }
    .epg-schedule-item.current {
      background: rgba(249, 115, 22, 0.12);
      border-color: rgba(249, 115, 22, 0.4);
    }
    .epg-schedule-item.focused,
    .epg-schedule-item:hover {
      background: #1e293b;
      border-color: #ffffff !important;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
    }
    .epg-time-range {
      font-size: 12px;
      font-weight: 700;
      color: #94a3b8;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      min-width: 80px;
    }
    .epg-item-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #ffffff;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .epg-schedule-item.current .epg-item-title {
      color: #f97316;
    }
    .epg-live-badge {
      padding: 2px 6px;
      background: #dc2626;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 900;
      color: #ffffff;
    }
`;

export function injectStyles() {
  const style = document.createElement('style');
  style.id = 'app-custom-styles';
  style.textContent = globalStyles;
  document.head.appendChild(style);
}
