export var globalStyles = '\
    * {\
      box-sizing: border-box;\
      margin: 0;\
      padding: 0;\
      user-select: none;\
      -webkit-user-select: none;\
    }\
    body, html {\
      width: 100vw;\
      height: 100vh;\
      background-color: #121418;\
      overflow: hidden;\
      font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;\
      color: #ffffff;\
      font-size: 20px;\
    }\
    #app-container {\
      position: relative;\
      width: 100vw;\
      height: 100vh;\
      background-color: #121418;\
      overflow: hidden;\
    }\
    #video-screen {\
      position: absolute;\
      top: 0; left: 0;\
      width: 100vw; height: 100vh;\
      background-color: #000000;\
      object-fit: contain;\
      z-index: 1;\
      transition: width 0.25s cubic-bezier(0.2, 0.9, 0.3, 1), left 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);\
    }\
    #video-screen.pip-right {\
      left: 32vw !important;\
      width: 68vw !important;\
      height: 100vh !important;\
    }\
    #center-state-layer {\
      position: absolute;\
      top: 0; left: 0;\
      width: 100vw; height: 100vh;\
      display: flex;\
      align-items: center;\
      justify-content: center;\
      z-index: 15;\
      pointer-events: none;\
      opacity: 0;\
      transform: scale(0.7);\
      transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);\
    }\
    #center-state-layer.active { opacity: 1; transform: scale(1); }\
    #center-state-layer.pip-right { left: 32vw !important; width: 68vw !important; }\
    .center-state-circle {\
      width: 110px; height: 110px;\
      border-radius: 50%;\
      background: rgba(38, 42, 50, 0.92);\
      border: 2.5px solid rgba(255, 255, 255, 0.35);\
      display: flex; align-items: center; justify-content: center;\
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.85);\
    }\
    .center-state-circle svg { width: 54px; height: 54px; fill: #ffffff;\ }\
    #video-spinner-layer {\
      position: absolute;\
      top: 0; left: 0;\
      width: 100vw; height: 100vh;\
      display: none;\
      align-items: center; justify-content: center;\
      z-index: 12; pointer-events: none;\
    }\
    #video-spinner-layer.active { display: flex !important; }\
    #video-spinner-layer.pip-right { left: 32vw !important; width: 68vw !important; }\
    .white-video-spinner {\
      width: 70px; height: 70px;\
      border: 6px solid rgba(255, 255, 255, 0.2);\
      border-top-color: #ffffff;\
      border-radius: 50%;\
      animation: spinAnim 0.75s linear infinite;\
    }\
    @keyframes spinAnim { to { transform: rotate(360deg); } }\
    #video-error-layer {\
      position: absolute;\
      top: 0; left: 0;\
      width: 100vw; height: 100vh;\
      display: none;\
      align-items: center; justify-content: center;\
      z-index: 14;\
      background: rgba(18, 20, 24, 0.95);\
    }\
    #video-error-layer.active { display: flex !important; }\
    #video-error-layer.pip-right { left: 32vw !important; width: 68vw !important; }\
    .error-container-box { display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center; }\
    .error-title-main { font-size: 36px; font-weight: 900; letter-spacing: -0.5px; font-style: italic; }\
    .err-white { color: #ffffff; }\
    .err-cyan { color: #38bdf8; }\
    .error-channel-text { font-size: 20px; font-weight: 700; color: #ef4444; letter-spacing: 0.8px; }\
    #tivimate-drawer {\
      position: absolute;\
      top: 0; left: 0;\
      width: 32vw;\
      height: 100vh;\
      background-color: #20242b;\
      border-right: 1.5px solid rgba(255, 255, 255, 0.18);\
      z-index: 20;\
      display: flex;\
      flex-direction: column;\
      transform: translateX(-100%);\
      transition: transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);\
      box-shadow: 10px 0 35px rgba(0, 0, 0, 0.85);\
    }\
    #tivimate-drawer.open { transform: translateX(0) !important; }\
    .drawer-header {\
      padding: 22px 22px 16px 22px;\
      background: #191c22;\
      border-bottom: 1.5px solid rgba(255, 255, 255, 0.14);\
    }\
    .drawer-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }\
    .app-title-badge { font-size: 24px; font-weight: 900; font-style: italic; letter-spacing: -0.5px; }\
    .title-white { color: #ffffff; }\
    .title-cyan { color: #38bdf8; margin-left: 2px; }\
    .win-clock-badge { display: flex; flex-direction: column; align-items: flex-end; }\
    .win-time { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; }\
    .win-date { font-size: 15px; font-weight: 600; color: #cbd5e1; }\
    .drawer-search-wrapper { margin-bottom: 14px; }\
    .search-input-box {\
      display: flex; align-items: center; gap: 12px;\
      padding: 12px 18px;\
      background: #2b303a;\
      border: 2px solid rgba(255, 255, 255, 0.2);\
      border-radius: 14px;\
      transition: background 0.15s ease, border-color 0.15s ease;\
    }\
    .search-input-box:focus-within, .search-input-box.focused {\
      background: #363d4a;\
      border-color: #ffffff;\
      box-shadow: none;\
    }\
    .search-icon { width: 22px; height: 22px; color: #cbd5e1; flex-shrink: 0; }\
    .search-input-box.focused .search-icon, .search-input-box:focus-within .search-icon { color: #fb923c; }\
    #channel-search-input { flex: 1; background: transparent; border: none; outline: none; color: #ffffff; font-size: 18px; font-weight: 600; font-family: inherit; }\
    #channel-search-input::placeholder { color: #94a3b8; font-weight: 500; }\
    .search-clear-btn { background: transparent; border: none; color: #cbd5e1; cursor: pointer; padding: 2px; display: flex; align-items: center; justify-content: center; border-radius: 50%; width: 26px; height: 26px; transition: all 0.1s ease; }\
    .search-clear-btn:hover { background: rgba(255, 255, 255, 0.18); color: #ffffff; }\
    .search-clear-btn svg { width: 18px; height: 18px; }\
    .category-nav-bar { display: flex; align-items: center; gap: 10px; overflow-x: auto; white-space: nowrap; padding: 4px 0 6px 0; scrollbar-width: none; }\
    .category-nav-bar::-webkit-scrollbar { display: none; }\
    .cat-chip {\
      padding: 10px 20px;\
      background: #2b303a;\
      border: 1.5px solid rgba(255, 255, 255, 0.16);\
      border-radius: 20px;\
      font-size: 16px;\
      font-weight: 700;\
      color: #e2e8f0;\
      white-space: nowrap;\
      cursor: pointer;\
      transition: background 0.12s ease, color 0.12s ease;\
    }\
    .cat-chip:hover { background: #373e4b; color: #ffffff; }\
    .cat-chip.active {\
      background: #ffffff;\
      border: 2px solid #ffffff;\
      color: #0f172a;\
      box-shadow: none;\
    }\
    .drawer-channel-list {\
      flex: 1;\
      overflow-y: auto;\
      padding: 14px 18px;\
    }\
    .drawer-channel-list::-webkit-scrollbar { width: 6px; }\
    .drawer-channel-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.28); border-radius: 3px; }\
    .channel-row-item {\
      display: flex; align-items: center; gap: 18px;\
      padding: 12px 18px;\
      margin-bottom: 8px;\
      height: 86px;\
      min-height: 86px;\
      background: #2b303a;\
      border: 2px solid rgba(255, 255, 255, 0.12);\
      border-radius: 14px;\
      cursor: pointer;\
      transition: background 0.1s ease, border-color 0.1s ease;\
    }\
    .channel-row-item:hover { background: #363d4a; }\
    .channel-row-item.focused {\
      background: #3f4756 !important;\
      border-color: #ffffff !important;\
      box-shadow: none !important;\
    }\
    .ch-logo-container {\
      width: 76px; height: 52px;\
      background: transparent;\
      border: none;\
      display: flex; align-items: center; justify-content: center;\
      flex-shrink: 0;\
    }\
    .ch-logo-img { max-width: 100%; max-height: 100%; object-fit: contain; }\
    .ch-logo-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }\
    .ch-content-col { flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0; gap: 4px; }\
    .ch-name-orange { font-size: 20px; font-weight: 800; color: #fb923c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
    .ch-name-plain { font-size: 20px; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
    .ch-program-gray { font-size: 16px; font-weight: 600; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
    .ch-timeline-row { display: flex; align-items: center; gap: 12px; margin-top: 4px; }\
    .ch-time-text { font-size: 14px; font-weight: 700; color: #94a3b8; flex-shrink: 0; }\
    .ch-timeline-bar-bg { flex: 1; height: 5px; background: rgba(255, 255, 255, 0.22); border-radius: 3px; overflow: hidden; }\
    .ch-timeline-bar-fill { height: 100%; background: #fb923c; border-radius: 3px; }\
    .skeleton-box {\
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 25%, rgba(255, 255, 255, 0.18) 50%, rgba(255, 255, 255, 0.08) 75%);\
      background-size: 200% 100%;\
      animation: shimmerAnim 1.4s infinite;\
      border-radius: 3px;\
    }\
    @keyframes shimmerAnim { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }\
    .skeleton-title { width: 65%; height: 16px; margin: 3px 0; }\
    .skeleton-timeline { width: 100%; height: 5px; margin-top: 3px; }\
    #dl-osd-banner {\
      position: absolute;\
      bottom: 0;\
      left: 0;\
      right: 0;\
      background: linear-gradient(to top, rgba(14, 16, 21, 0.94) 0%, rgba(14, 16, 21, 0.82) 65%, rgba(14, 16, 21, 0) 100%);\
      border: none;\
      border-radius: 0;\
      padding: 44px 50px 24px 50px;\
      z-index: 25;\
      display: flex;\
      flex-direction: column;\
      gap: 14px;\
      opacity: 0;\
      transform: translateY(20px);\
      transition: opacity 0.2s ease, transform 0.2s ease;\
      box-shadow: none;\
      pointer-events: none;\
    }\
    #dl-osd-banner.active { opacity: 1 !important; transform: translateY(0) !important; pointer-events: auto !important; }\
    #dl-osd-banner.pip-right {\
      left: calc(32vw + 24px) !important;\
      right: 28px !important;\
      bottom: 28px !important;\
      background: rgba(32, 36, 43, 0.96) !important;\
      border: 1.5px solid rgba(255, 255, 255, 0.24) !important;\
      border-radius: 20px !important;\
      padding: 16px 24px !important;\
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.85) !important;\
    }\
    .osd-main-row { display: flex; align-items: center; justify-content: space-between; min-height: 52px; }\
    .osd-left-info { display: flex; align-items: center; gap: 20px; min-width: 0; flex: 1; }\
    .osd-logo-box {\
      width: 80px; height: 52px;\
      background: transparent;\
      border: none;\
      display: flex; align-items: center; justify-content: center;\
      flex-shrink: 0;\
    }\
    .osd-logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }\
    .osd-text-col { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }\
    .osd-ch-name { font-size: 26px; font-weight: 900; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.3px; }\
    .osd-prog-name { font-size: 19px; font-weight: 700; color: #fb923c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 24px; }\
    .osd-right-info { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }\
    .osd-live-tag { padding: 6px 14px; background: #ef4444; color: #ffffff; font-size: 15px; font-weight: 900; border-radius: 8px; letter-spacing: 0.5px; }\
    .osd-specs-text { font-size: 16px; font-weight: 700; color: #cbd5e1; }\
    .osd-timeline-row { display: flex; align-items: center; gap: 16px; min-height: 18px; }\
    .osd-time-bound { font-size: 15px; font-weight: 700; color: #cbd5e1; flex-shrink: 0; }\
    .osd-timeline-track { flex: 1; height: 6px; background: rgba(255, 255, 255, 0.24); border-radius: 3px; overflow: hidden; }\
    .osd-timeline-fill { height: 100%; background: #fb923c; border-radius: 3px; }\
    .osd-action-pills-row {\
      display: flex;\
      align-items: center;\
      justify-content: center;\
      gap: 16px;\
      margin-top: 6px;\
      width: 100%;\
    }\
    .bottom-pill-btn { display: flex; align-items: center; gap: 12px; padding: 12px 22px; background: rgba(255, 255, 255, 0.12); border: 2px solid transparent; border-radius: 30px; color: #e2e8f0; font-size: 16px; font-weight: 700; cursor: pointer; transition: background 0.12s ease, color 0.12s ease; }\
    .bottom-pill-btn svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2.2; }\
    .bottom-pill-btn:hover { background: rgba(255, 255, 255, 0.2); color: #ffffff; }\
    .bottom-pill-btn.focused { background: #ffffff !important; border-color: #ffffff !important; color: #0b0d14 !important; box-shadow: none !important; }\
    .bottom-pill-btn.focused svg { stroke: #0b0d14 !important; }\
    #quality-audio-dialog { position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 17, 21, 0.85); z-index: 40; display: none; align-items: center; justify-content: center; }\
    #quality-audio-dialog.active { display: flex !important; }\
    .dialog-card { background: #20242b; border: 2px solid rgba(255, 255, 255, 0.24); border-radius: 22px; padding: 30px 36px; min-width: 480px; max-width: 560px; box-shadow: 0 22px 55px rgba(0, 0, 0, 0.9); }\
    .dialog-title { font-size: 24px; font-weight: 800; color: #ffffff; margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1.5px solid rgba(255, 255, 255, 0.16); }\
    .dialog-list { display: flex; flex-direction: column; gap: 12px; max-height: 440px; overflow-y: auto; }\
    .dialog-item { display: flex; align-items: center; justify-content: space-between; padding: 16px 22px; background: #2b303a; border: 2px solid rgba(255, 255, 255, 0.14); border-radius: 14px; font-size: 18px; font-weight: 700; color: #f1f5f9; cursor: pointer; transition: background 0.1s ease, color 0.1s ease; }\
    .dialog-item:hover { background: #363d4a; }\
    .dialog-item.focused {\
      background: #ffffff !important;\
      border-color: #ffffff !important;\
      color: #0b0d14 !important;\
      box-shadow: none !important;\
    }\
    .dialog-item.focused span { color: #0b0d14 !important; font-weight: 800 !important; }\
    .dialog-item.focused .dialog-check-icon { stroke: #0b0d14 !important; }\
    .dialog-item.active { color: #fb923c; }\
    .epg-schedule-card { min-width: 55vw !important; max-width: 65vw !important; height: 75vh !important; display: flex !important; flex-direction: column !important; padding: 26px 32px !important; }\
    .epg-dialog-body { display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden; }\
    .epg-channel-sidebar { width: 320px; flex-shrink: 0; border-right: 1.5px solid rgba(255, 255, 255, 0.16); overflow-y: auto; padding-right: 14px; display: flex; flex-direction: column; gap: 10px; }\
    .epg-ch-item { display: flex; align-items: center; gap: 16px; padding: 12px 16px; border-radius: 14px; background: #2b303a; color: #e2e8f0; font-size: 18px; font-weight: 700; cursor: pointer; border: 2px solid rgba(255, 255, 255, 0.12); transition: background 0.12s ease; min-height: 64px; }\
    .epg-ch-item.selected { background: #ffffff; color: #0f172a; border-color: #ffffff; box-shadow: none; }\
    .epg-ch-item.focused { background: #ffffff !important; border-color: #ffffff !important; color: #0b0d14 !important; box-shadow: none !important; }\
    .epg-ch-logo-container {\
      width: 62px; height: 42px;\
      background: transparent;\
      border: none;\
      display: flex; align-items: center; justify-content: center;\
      flex-shrink: 0;\
    }\
    .epg-ch-logo-img { max-width: 100%; max-height: 100%; object-fit: contain; }\
    .epg-ch-logo-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }\
    .epg-schedule-panel { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 10px; }\
    .epg-schedule-item { display: flex; align-items: center; gap: 18px; padding: 16px 22px; background: #2b303a; border: 2px solid rgba(255, 255, 255, 0.12); border-radius: 14px; cursor: pointer; transition: background 0.12s ease; min-height: 58px; }\
    .epg-schedule-item.past { opacity: 0.4; }\
    .epg-schedule-item.focused { background: #3f4756 !important; border-color: #ffffff !important; color: #ffffff !important; box-shadow: none !important; opacity: 1 !important; }\
    .epg-time-range { font-size: 16px; font-weight: 800; color: #fb923c; flex-shrink: 0; }\
    .epg-item-title { flex: 1; font-size: 18px; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
    .epg-live-badge { padding: 5px 12px; background: #ef4444; color: #ffffff; font-size: 13px; font-weight: 900; border-radius: 6px; flex-shrink: 0; }\
';

export function injectStyles() {
  var styleEl = document.getElementById('app-custom-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'app-custom-styles';
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = globalStyles;
}
