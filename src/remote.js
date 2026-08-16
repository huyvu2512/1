/**
 * Bộ ánh xạ phím điều khiển Samsung Smart TV Remote
 */
export const TV_KEYS = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  ENTER: 13,
  RETURN: 10009,
  BACK_PC: 27,
  RED: 403,
  GREEN: 404,
  YELLOW: 405,
  BLUE: 406,
  PLAY: 415,
  PAUSE: 19,
  STOP: 413,
  PLAY_PAUSE: 10252,
  INFO: 457
};

/**
 * Đăng ký các phím mở rộng với hệ điều hành Tizen
 */
export function registerTizenKeys() {
  try {
    if (window.tizen && window.tizen.tvinputdevice) {
      const keysToRegister = [
        'ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue', 
        'MediaPlay', 'MediaPause', 'MediaStop', 'MediaPlayPause'
      ];
      keysToRegister.forEach((keyName) => {
        try {
          window.tizen.tvinputdevice.registerKey(keyName);
        } catch (e) {}
      });
    }
  } catch (err) {}
}
