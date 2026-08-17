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

    /* KHI MỞ MENU: THU NHỎ VIDEO SANG NỬA PHẢI MÀN HÌNH (RỘNG 420PX TRÊN TV) */
    #video-screen.pip-right {
      left: 420px !important;
      width: calc(100vw - 420px) !important;
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
      left: 420px !important;
      width: calc(100vw - 420px) !important;
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
      left: 420px !important;
      width: calc(100vw - 420px) !important;
    }
    .white-video-spinner {
      width: 54px;
      height: 54px;
      border: 4.5px solid rgba(255, 255, 255, 0.2);
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
      left: 420px !important;
      width: calc(100vw - 420px) !important;
    }
    .error-container-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      text-align: center;
    }
    .error-title-main {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
      font-style: italic;
    }
    .err-white { color: #ffffff; }
    .err-cyan { color: #00e5ff; }
    .error-channel-text {
      font-size: 15px;
      font-weight: 700;
      color: #ef4444;
      letter-spacing: 0.8px;
    }

    /* =========================================================================
       BẢNG DANH SÁCH KÊNH (TIVIMATE DRAWER ĐEN XÁM TỐI GIẢN - RỘNG 420PX CHO TV)
       ========================================================================= */
    #tivimate-drawer {
      position: absolute;
      top: 0;
      left: 0;
      width: 420px;
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
      padding: 18px 16px 12px 16px;
      background: #0e111a;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    }

    .drawer-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .app-title-badge {
      font-size: 20px;
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
      font-size: 15px;
      font-weight: 800;
      color: #ffffff;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.5px;
    }
    .win-date {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
    }

    /* KHUNG TÌM KIẾM KÊNH */
    .drawer-search-wrapper {
      margin-bottom: 12px;
    }
    .search-input-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      background: #151923;
      border: 1.5px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      transition: all 0.15s ease;
    }
    .search-input-box:focus-within,
    .search-input-box.focused {
      background: #1c2230;
      border-color: #ffffff;
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.25);
    }
    .search-icon {
      width: 18px;
      height: 18px;
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
      font-size: 14px;
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
      width: 20px;
      height: 20px;
      transition: all 0.1s ease;
    }
    .search-clear-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
    .search-clear-btn svg {
      width: 14px;
      height: 14px;
    }

    /* THANH CUỘN NGANG NHÓM DANH MỤC */
    .category-nav-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      white-space: nowrap;
      padding: 2px 0 4px 0;
      scrollbar-width: none;
    }
    .category-nav-bar::-webkit-scrollbar { display: none; }

    .cat-chip {
      padding: 6px 14px;
      background: #171b26;
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 16px;
      font-size: 13.5px;
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
      box-shadow: 0 2px 8px rgba(255, 255, 255, 0.15);
    }

    /* DANH SÁCH HÀNG KÊNH */
    .drawer-channel-list {
      flex: 1;
      overflow-y: auto;
      padding: 10px 14px;
    }
    .drawer-channel-list::-webkit-scrollbar { width: 4px; }
    .drawer-channel-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }

    /* MỖI HÀNG KÊNH: CHIỀU CAO 66PX CHO TV */
    .channel-row-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 8px 14px;
      margin-bottom: 6px;
      height: 66px;
      min-height: 66px;
      background: #13161f;
      border: 1.5px solid transparent;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.1s ease;
    }
    .channel-row-item:hover {
      background: #1c202d;
    }
    .channel-row-item.focused {
      background: #232938 !important;
      border-color: #ffffff !important;
      box-shadow: 0 0 14px rgba(255, 255, 255, 0.2) !important;
    }

    .ch-logo-container {
      width: 56px;
      height: 38px;
      background: #000000;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .ch-logo-img {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
    }
    .ch-logo-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ch-content-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
      gap: 2px;
    }

    .ch-name-orange {
      font-size: 16px;
      font-weight: 800;
      color: #f97316;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ch-name-plain {
      font-size: 16px;
      font-weight: 700;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ch-program-gray {
      font-size: 13.5px;
      font-weight: 600;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ch-timeline-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 3px;
    }
    .ch-time-text {
      font-size: 11.5px;
      font-weight: 700;
      color: #64748b;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }
    .ch-timeline-bar-bg {
      flex: 1;
      height: 3.5px;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 2px;
      overflow: hidden;
    }
    .ch-timeline-bar-fill {
      height: 100%;
      background: #f97316;
      border-radius: 2px;
    }

    /* SKELETON SHIMMER CHỜ EPG */
    .skeleton-box {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.05) 75%);
      background-size: 200% 100%;
      animation: shimmerAnim 1.4s infinite;
      border-radius: 3px;
    }
    @keyframes shimmerAnim {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .skeleton-title {
      width: 65%;
      height: 12px;
      margin: 3px 0;
    }
    .skeleton-timeline {
      width: 100%;
      height: 3.5px;
      margin-top: 3px;
    }

    /* =========================================================================
       KHUNG OSD BANNER DƯỚI (MẶC ĐỊNH MỞ)
       ========================================================================= */
    #dl-osd-banner {
      position: absolute;
      bottom: 24px;
      left: 32px;
      right: 32px;
      background: rgba(13, 17, 23, 0.94);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 16px;
      padding: 16px 24px 14px 24px;
      z-index: 25;
      display: flex;
      flex-direction: column;
      gap: 12px;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.85);
      pointer-events: none;
    }
    #dl-osd-banner.active {
      opacity: 1 !important;
      transform: translateY(0) !important;
      pointer-events: auto !important;
    }

    /* KHI MỞ MENU: OSD BANNER THU SANG PHẢI */
    #dl-osd-banner.pip-right {
      left: 444px !important;
      right: 24px !important;
      bottom: 20px !important;
      padding: 14px 20px !important;
    }

    .osd-main-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .osd-left-info {
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 0;
      flex: 1;
    }
    .osd-logo-box {
      width: 64px;
      height: 42px;
      background: #000000;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }
    .osd-logo-box img {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
    }
    .osd-text-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }
    .osd-ch-name {
      font-size: 22px;
      font-weight: 900;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.3px;
    }
    .osd-prog-name {
      font-size: 15.5px;
      font-weight: 700;
      color: #f97316;
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
      padding: 4px 10px;
      background: #ef4444;
      color: #ffffff;
      font-size: 12px;
      font-weight: 900;
      border-radius: 5px;
      letter-spacing: 0.5px;
    }
    .osd-specs-text {
      font-size: 13.5px;
      font-weight: 700;
      color: #94a3b8;
      font-variant-numeric: tabular-nums;
    }

    /* TIMELINE DƯỚI OSD */
    .osd-timeline-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .osd-time-bound {
      font-size: 12.5px;
      font-weight: 700;
      color: #94a3b8;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }
    .osd-timeline-track {
      flex: 1;
      height: 4.5px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 3px;
      overflow: hidden;
    }
    .osd-timeline-fill {
      height: 100%;
      background: #f97316;
      border-radius: 3px;
    }

    /* CÁC NÚT VIÊN THUỐC ĐIỀU KHIỂN */
    .osd-action-pills-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 4px;
    }
    .bottom-pill-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      background: rgba(255, 255, 255, 0.08);
      border: 1.5px solid transparent;
      border-radius: 24px;
      color: #cbd5e1;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .bottom-pill-btn svg {
      width: 16px;
      height: 16px;
      stroke: currentColor;
      fill: none;
      stroke-width: 2.2;
    }
    .bottom-pill-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
    }
    .bottom-pill-btn.focused {
      background: #ffffff !important;
      border-color: #ffffff !important;
      color: #0b0d14 !important;
      box-shadow: 0 0 16px rgba(255, 255, 255, 0.4) !important;
    }
    .bottom-pill-btn.focused svg {
      stroke: #0b0d14 !important;
    }

    /* =========================================================================
       POPUP LỊCH PHÁT SÓNG 2 CỘT, CHẤT LƯỢNG VÀ ÂM THANH
       ========================================================================= */
    #quality-audio-dialog {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 40;
      display: none;
      align-items: center;
      justify-content: center;
    }
    #quality-audio-dialog.active {
      display: flex !important;
    }

    .dialog-card {
      background: #0f141f;
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      border-radius: 18px;
      padding: 24px 28px;
      min-width: 380px;
      max-width: 460px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
      animation: dialogPop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes dialogPop {
      0% { transform: scale(0.9); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .dialog-title {
      font-size: 19px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 18px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .dialog-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 380px;
      overflow-y: auto;
    }
    .dialog-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: rgba(255, 255, 255, 0.05);
      border: 1.5px solid transparent;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
      color: #cbd5e1;
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .dialog-item.focused {
      background: #272e3f !important;
      border-color: #ffffff !important;
      color: #ffffff !important;
      box-shadow: 0 0 14px rgba(255, 255, 255, 0.25) !important;
    }
    .dialog-item.active {
      color: #f97316;
    }

    /* MODAL EPG 2 CỘT CHUYÊN DỤNG (900PX CHO TV) */
    .epg-schedule-card {
      min-width: 900px !important;
      max-width: 960px !important;
      height: 600px !important;
      display: flex !important;
      flex-direction: column !important;
      padding: 20px 24px !important;
    }
    .epg-dialog-body {
      display: flex;
      gap: 16px;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .epg-channel-sidebar {
      width: 280px;
      flex-shrink: 0;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      overflow-y: auto;
      padding-right: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .epg-ch-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.04);
      color: #cbd5e1;
      font-size: 14.5px;
      font-weight: 700;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: all 0.12s ease;
      min-height: 48px;
    }
    .epg-ch-item.selected {
      background: rgba(249, 115, 22, 0.15);
      color: #f97316;
      border-color: rgba(249, 115, 22, 0.4);
    }
    .epg-ch-item.focused {
      background: #ffffff !important;
      border-color: #ffffff !important;
      color: #0b0d14 !important;
      box-shadow: 0 0 14px rgba(255, 255, 255, 0.4) !important;
    }
    .epg-ch-logo {
      width: 44px;
      height: 28px;
      object-fit: contain;
      background: #000;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }

    .epg-schedule-panel {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-right: 6px;
    }
    .epg-schedule-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 18px;
      background: rgba(255, 255, 255, 0.04);
      border: 1.5px solid transparent;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.12s ease;
      min-height: 50px;
    }
    .epg-schedule-item.past {
      opacity: 0.35;
      filter: grayscale(0.5);
    }
    .epg-schedule-item.focused {
      background: #272e3f !important;
      border-color: #ffffff !important;
      color: #ffffff !important;
      box-shadow: 0 0 14px rgba(255, 255, 255, 0.3) !important;
      opacity: 1 !important;
    }
    .epg-time-range {
      font-size: 13.5px;
      font-weight: 800;
      color: #f97316;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }
    .epg-item-title {
      flex: 1;
      font-size: 14.5px;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .epg-live-badge {
      padding: 3px 8px;
      background: #ef4444;
      color: #ffffff;
      font-size: 11px;
      font-weight: 900;
      border-radius: 4px;
      flex-shrink: 0;
    }
`;

export function injectStyles() {
  const styleEl = document.createElement('style');
  styleEl.id = 'app-custom-styles';
  styleEl.innerHTML = globalStyles;
  document.head.appendChild(styleEl);
}
