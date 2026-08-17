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
      background-color: #000000;\
      overflow: hidden;\
      font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;\
      color: #ffffff;\
      font-size: 20px;\
    }\
    #app-container {\
      position: relative;\
      width: 100vw;\
      height: 100vh;\
      background-color: #000000;\
      overflow: hidden;\
    }\
    #video-screen {\
      position: absolute;\
      top: 0; left: 0;\
      width: 100vw; height: 100vh;\
      background-color: #000000;\
      object-fit: contain;\
      z-index: 1;\
      transition: all 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);\
    }\
    #video-screen.pip-right {\
      left: 28vw !important;\
      width: 72vw !important;\
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
    #center-state-layer.pip-right { left: 28vw !important; width: 72vw !important; }\
    .center-state-circle {\
      width: 100px; height: 100px;\
      border-radius: 50%;\
      background: rgba(15, 23, 42, 0.75);\
      border: 2px solid rgba(255, 255, 255, 0.2);\
      display: flex; align-items: center; justify-content: center;\
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);\
    }\
    .center-state-circle svg { width: 50px; height: 50px; fill: #ffffff; }\
    #video-spinner-layer {\
      position: absolute;\
      top: 0; left: 0;\
      width: 100vw; height: 100vh;\
      display: none;\
      align-items: center; justify-content: center;\
      z-index: 12; pointer-events: none;\
    }\
    #video-spinner-layer.active { display: flex !important; }\
    #video-spinner-layer.pip-right { left: 28vw !important; width: 72vw !important; }\
    .white-video-spinner {\
      width: 60px; height: 60px;\
      border: 5px solid rgba(255, 255, 255, 0.2);\
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
      background: rgba(0, 0, 0, 0.9);\
    }\
    #video-error-layer.active { display: flex !important; }\
    #video-error-layer.pip-right { left: 28vw !important; width: 72vw !important; }\
    .error-container-box { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }\
    .error-title-main { font-size: 32px; font-weight: 900; letter-spacing: -0.5px; font-style: italic; }\
    .err-white { color: #ffffff; }\
    .err-cyan { color: #00e5ff; }\
    .error-channel-text { font-size: 18px; font-weight: 700; color: #ef4444; letter-spacing: 0.8px; }\
    #tivimate-drawer {\
      position: absolute;\
      top: 0; left: 0;\
      width: 28vw;\
      height: 100vh;\
      background-color: #0b0d14;\
      border-right: 1px solid rgba(255, 255, 255, 0.08);\
      z-index: 20;\
      display: flex;\
      flex-direction: column;\
      transform: translateX(-100%);\
      transition: transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);\
      box-shadow: 10px 0 30px rgba(0, 0, 0, 0.9);\
    }\
    #tivimate-drawer.open { transform: translateX(0) !important; }\
    .drawer-header {\
      padding: 20px 18px 14px 18px;\
      background: #0e111a;\
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);\
    }\
    .drawer-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }\
    .app-title-badge { font-size: 22px; font-weight: 900; font-style: italic; letter-spacing: -0.5px; }\
    .title-white { color: #ffffff; }\
    .title-cyan { color: #00e5ff; margin-left: 2px; }\
    .win-clock-badge { display: flex; flex-direction: column; align-items: flex-end; }\
    .win-time { font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; }\
    .win-date { font-size: 13px; font-weight: 600; color: #94a3b8; }\
    .drawer-search-wrapper { margin-bottom: 14px; }\
    .search-input-box {\
      display: flex; align-items: center; gap: 10px;\
      padding: 10px 16px;\
      background: #151923;\
      border: 1.5px solid rgba(255, 255, 255, 0.1);\
      border-radius: 12px;\
      transition: all 0.15s ease;\
    }\
    .search-input-box:focus-within, .search-input-box.focused {\
      background: #1c2230;\
      border-color: #ffffff;\
      box-shadow: 0 0 14px rgba(255, 255, 255, 0.3);\
    }\
    .search-icon { width: 20px; height: 20px; color: #94a3b8; flex-shrink: 0; }\
    .search-input-box.focused .search-icon, .search-input-box:focus-within .search-icon { color: #f97316; }\
    #channel-search-input { flex: 1; background: transparent; border: none; outline: none; color: #ffffff; font-size: 16px; font-weight: 600; font-family: inherit; }\
    #channel-search-input::placeholder { color: #64748b; font-weight: 500; }\
    .search-clear-btn { background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 2px; display: flex; align-items: center; justify-content: center; border-radius: 50%; width: 24px; height: 24px; transition: all 0.1s ease; }\
    .search-clear-btn:hover { background: rgba(255, 255, 255, 0.1); color: #ffffff; }\
    .search-clear-btn svg { width: 16px; height: 16px; }\
    .category-nav-bar { display: flex; align-items: center; gap: 10px; overflow-x: auto; white-space: nowrap; padding: 2px 0 4px 0; scrollbar-width: none; }\
    .category-nav-bar::-webkit-scrollbar { display: none; }\
    .cat-chip {\
      padding: 8px 18px;\
      background: #171b26;\
      border: 1px solid rgba(255, 255, 255, 0.09);\
      border-radius: 18px;\
      font-size: 15px;\
      font-weight: 700;\
      color: #94a3b8;\
      white-space: nowrap;\
      cursor: pointer;\
      transition: all 0.12s ease;\
    }\
    .cat-chip:hover { background: #232938; color: #ffffff; }\
    .cat-chip.active {\
      background: #272e3f;\
      border: 2px solid #ffffff;\
      color: #ffffff;\
      box-shadow: 0 2px 10px rgba(255, 255, 255, 0.18);\
    }\
    .drawer-channel-list { flex: 1; overflow-y: auto; padding: 12px 16px; }\
    .drawer-channel-list::-webkit-scrollbar { width: 5px; }\
    .drawer-channel-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }\
    .channel-row-item {\
      display: flex; align-items: center; gap: 16px;\
      padding: 10px 16px;\
      margin-bottom: 6px;\
      height: 80px;\
      min-height: 80px;\
      background: #13161f;\
      border: 2px solid transparent;\
      border-radius: 12px;\
      cursor: pointer;\
      transition: all 0.1s ease;\
    }\
    .channel-row-item:hover { background: #1c202d; }\
    .channel-row-item.focused {\
      background: #232938 !important;\
      border-color: #ffffff !important;\
      box-shadow: 0 0 18px rgba(255, 255, 255, 0.25) !important;\
    }\
    .ch-logo-container {\
      width: 64px; height: 44px;\
      background: #000000;\
      border-radius: 8px;\
      display: flex; align-items: center; justify-content: center;\
      flex-shrink: 0; overflow: hidden;\
      border: 1px solid rgba(255, 255, 255, 0.08);\
    }\
    .ch-logo-img { max-width: 90%; max-height: 90%; object-fit: contain; }\
    .ch-logo-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }\
    .ch-content-col { flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0; gap: 3px; }\
    .ch-name-orange { font-size: 18px; font-weight: 800; color: #f97316; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
    .ch-name-plain { font-size: 18px; font-weight: 700; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
    .ch-program-gray { font-size: 15px; font-weight: 600; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
    .ch-timeline-row { display: flex; align-items: center; gap: 10px; margin-top: 3px; }\
    .ch-time-text { font-size: 13px; font-weight: 700; color: #64748b; flex-shrink: 0; }\
    .ch-timeline-bar-bg { flex: 1; height: 4px; background: rgba(255, 255, 255, 0.12); border-radius: 2px; overflow: hidden; }\
    .ch-timeline-bar-fill { height: 100%; background: #f97316; border-radius: 2px; }\
    .skeleton-box {\
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.05) 75%);\
      background-size: 200% 100%;\
      animation: shimmerAnim 1.4s infinite;\
      border-radius: 3px;\
    }\
    @keyframes shimmerAnim { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }\
    .skeleton-title { width: 65%; height: 14px; margin: 3px 0; }\
    .skeleton-timeline { width: 100%; height: 4px; margin-top: 3px; }\
    #dl-osd-banner {\
      position: absolute;\
      bottom: 28px; left: 36px; right: 36px;\
      background: rgba(13, 17, 23, 0.94);\
      border: 1px solid rgba(255, 255, 255, 0.14);\
      border-radius: 18px;\
      padding: 18px 28px 16px 28px;\
      z-index: 25;\
      display: flex; flex-direction: column; gap: 14px;\
      opacity: 0; transform: translateY(20px);\
      transition: all 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);\
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.85);\
      pointer-events: none;\
    }\
    #dl-osd-banner.active { opacity: 1 !important; transform: translateY(0) !important; pointer-events: auto !important; }\
    #dl-osd-banner.pip-right { left: calc(28vw + 24px) !important; right: 28px !important; bottom: 24px !important; padding: 16px 24px !important; }\
    .osd-main-row { display: flex; align-items: center; justify-content: space-between; }\
    .osd-left-info { display: flex; align-items: center; gap: 18px; min-width: 0; flex: 1; }\
    .osd-logo-box { width: 72px; height: 48px; background: #000000; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }\
    .osd-logo-box img { max-width: 90%; max-height: 90%; object-fit: contain; }\
    .osd-text-col { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }\
    .osd-ch-name { font-size: 26px; font-weight: 900; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.3px; }\
    .osd-prog-name { font-size: 18px; font-weight: 700; color: #f97316; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
    .osd-right-info { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }\
    .osd-live-tag { padding: 5px 12px; background: #ef4444; color: #ffffff; font-size: 14px; font-weight: 900; border-radius: 6px; letter-spacing: 0.5px; }\
    .osd-specs-text { font-size: 15px; font-weight: 700; color: #94a3b8; }\
    .osd-timeline-row { display: flex; align-items: center; gap: 14px; }\
    .osd-time-bound { font-size: 14px; font-weight: 700; color: #94a3b8; flex-shrink: 0; }\
    .osd-timeline-track { flex: 1; height: 5px; background: rgba(255, 255, 255, 0.15); border-radius: 3px; overflow: hidden; }\
    .osd-timeline-fill { height: 100%; background: #f97316; border-radius: 3px; }\
    .osd-action-pills-row { display: flex; align-items: center; gap: 14px; margin-top: 4px; }\
    .bottom-pill-btn { display: flex; align-items: center; gap: 10px; padding: 10px 20px; background: rgba(255, 255, 255, 0.08); border: 2px solid transparent; border-radius: 28px; color: #cbd5e1; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.12s ease; }\
    .bottom-pill-btn svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2.2; }\
    .bottom-pill-btn:hover { background: rgba(255, 255, 255, 0.16); color: #ffffff; }\
    .bottom-pill-btn.focused { background: #ffffff !important; border-color: #ffffff !important; color: #0b0d14 !important; box-shadow: 0 0 18px rgba(255, 255, 255, 0.4) !important; }\
    .bottom-pill-btn.focused svg { stroke: #0b0d14 !important; }\
    #quality-audio-dialog { position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.7); z-index: 40; display: none; align-items: center; justify-content: center; }\
    #quality-audio-dialog.active { display: flex !important; }\
    .dialog-card { background: #0f141f; border: 2px solid rgba(255, 255, 255, 0.15); border-radius: 20px; padding: 28px 32px; min-width: 440px; max-width: 520px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9); animation: dialogPop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }\
    @keyframes dialogPop { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }\
    .dialog-title { font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }\
    .dialog-list { display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto; }\
    .dialog-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: rgba(255, 255, 255, 0.05); border: 2px solid transparent; border-radius: 12px; font-size: 17px; font-weight: 700; color: #cbd5e1; cursor: pointer; transition: all 0.12s ease; }\
    .dialog-item.focused { background: #272e3f !important; border-color: #ffffff !important; color: #ffffff !important; box-shadow: 0 0 16px rgba(255, 255, 255, 0.3) !important; }\
    .dialog-item.active { color: #f97316; }\
    .epg-schedule-card { min-width: 50vw !important; max-width: 60vw !important; height: 70vh !important; display: flex !important; flex-direction: column !important; padding: 24px 28px !important; }\
    .epg-dialog-body { display: flex; gap: 18px; flex: 1; min-height: 0; overflow: hidden; }\
    .epg-channel-sidebar { width: 300px; flex-shrink: 0; border-right: 1px solid rgba(255, 255, 255, 0.1); overflow-y: auto; padding-right: 12px; display: flex; flex-direction: column; gap: 8px; }\
    .epg-ch-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-radius: 12px; background: rgba(255, 255, 255, 0.04); color: #cbd5e1; font-size: 16px; font-weight: 700; cursor: pointer; border: 2px solid transparent; transition: all 0.12s ease; min-height: 54px; }\
    .epg-ch-item.selected { background: rgba(249, 115, 22, 0.15); color: #f97316; border-color: rgba(249, 115, 22, 0.4); }\
    .epg-ch-item.focused { background: #ffffff !important; border-color: #ffffff !important; color: #0b0d14 !important; box-shadow: 0 0 16px rgba(255, 255, 255, 0.4) !important; }\
    .epg-ch-logo { width: 50px; height: 32px; object-fit: contain; background: #000; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.1); flex-shrink: 0; }\
    .epg-schedule-panel { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 8px; }\
    .epg-schedule-item { display: flex; align-items: center; gap: 16px; padding: 14px 20px; background: rgba(255, 255, 255, 0.04); border: 2px solid transparent; border-radius: 12px; cursor: pointer; transition: all 0.12s ease; min-height: 54px; }\
    .epg-schedule-item.past { opacity: 0.35; }\
    .epg-schedule-item.focused { background: #272e3f !important; border-color: #ffffff !important; color: #ffffff !important; box-shadow: 0 0 16px rgba(255, 255, 255, 0.3) !important; opacity: 1 !important; }\
    .epg-time-range { font-size: 15px; font-weight: 800; color: #f97316; flex-shrink: 0; }\
    .epg-item-title { flex: 1; font-size: 16px; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
    .epg-live-badge { padding: 4px 10px; background: #ef4444; color: #ffffff; font-size: 12px; font-weight: 900; border-radius: 5px; flex-shrink: 0; }\
';

export function injectStyles() {
  var styleEl = document.createElement('style');
  styleEl.id = 'app-custom-styles';
  styleEl.innerHTML = globalStyles;
  document.head.appendChild(styleEl);
}
