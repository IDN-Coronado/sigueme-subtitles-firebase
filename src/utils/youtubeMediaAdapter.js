/**
 * HTMLMediaElement-like adapter over YT.Player so existing MediaConsoleControls
 * and mediaSync can drive YouTube the same way as <video>/<audio>.
 *
 * @param {object} player YT.Player instance
 * @param {{ startSeconds?: number }} [options]
 */
export function createYouTubeMediaAdapter(player, options = {}) {
  const listeners = new Map();
  let loop = false;
  let muted = false;
  let volume = 1;
  let timePollId = null;
  let destroyed = false;
  const startSeconds =
    Number.isFinite(options.startSeconds) && options.startSeconds > 0
      ? Math.floor(options.startSeconds)
      : 0;

  const emit = (type) => {
    const set = listeners.get(type);
    if (!set) return;
    set.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore listener errors
      }
    });
  };

  const getState = () => {
    try {
      return player.getPlayerState();
    } catch {
      return -1;
    }
  };

  const isPlaying = () => getState() === window.YT?.PlayerState?.PLAYING;

  const seekTo = (seconds) => {
    try {
      player.seekTo(seconds, true);
      emit("timeupdate");
    } catch {
      // not seekable yet
    }
  };

  const applyMuteVolume = () => {
    try {
      if (muted || volume <= 0) player.mute();
      else {
        player.unMute();
        player.setVolume(Math.round(Math.max(0, Math.min(1, volume)) * 100));
      }
    } catch {
      // player not ready
    }
  };

  const stopTimePoll = () => {
    if (timePollId != null) {
      window.clearInterval(timePollId);
      timePollId = null;
    }
  };

  const startTimePoll = () => {
    stopTimePoll();
    timePollId = window.setInterval(() => {
      if (destroyed) return;
      if (isPlaying()) emit("timeupdate");
    }, 250);
  };

  const onStateChange = (event) => {
    const YT = window.YT;
    if (!YT) return;
    const state = event.data;

    if (state === YT.PlayerState.PLAYING) {
      startTimePoll();
      emit("play");
      emit("timeupdate");
    } else if (state === YT.PlayerState.PAUSED) {
      stopTimePoll();
      emit("pause");
      emit("timeupdate");
    } else if (state === YT.PlayerState.ENDED) {
      stopTimePoll();
      if (loop) {
        seekTo(startSeconds);
        try {
          player.playVideo();
        } catch {
          // ignore
        }
        return;
      }
      emit("ended");
      emit("pause");
    }
  };

  player.addEventListener("onStateChange", onStateChange);

  const adapter = {
    get paused() {
      const YT = window.YT;
      if (!YT) return true;
      const state = getState();
      return state !== YT.PlayerState.PLAYING;
    },
    get ended() {
      return getState() === window.YT?.PlayerState?.ENDED;
    },
    get currentTime() {
      try {
        return player.getCurrentTime() || 0;
      } catch {
        return 0;
      }
    },
    set currentTime(value) {
      if (typeof value !== "number" || !Number.isFinite(value)) return;
      // Stop / reset (0) returns to the URL start offset when present.
      const target = value <= 0 ? startSeconds : value;
      seekTo(target);
    },
    get duration() {
      try {
        const d = player.getDuration();
        return Number.isFinite(d) ? d : 0;
      } catch {
        return 0;
      }
    },
    get loop() {
      return loop;
    },
    set loop(value) {
      loop = !!value;
    },
    get muted() {
      return muted;
    },
    set muted(value) {
      muted = !!value;
      applyMuteVolume();
    },
    get defaultMuted() {
      return muted;
    },
    set defaultMuted(value) {
      muted = !!value;
      applyMuteVolume();
    },
    get volume() {
      return volume;
    },
    set volume(value) {
      volume = Number.isFinite(value) ? value : volume;
      applyMuteVolume();
    },
    get readyState() {
      return 4;
    },
    play() {
      try {
        applyMuteVolume();
        player.playVideo();
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    },
    pause() {
      try {
        player.pauseVideo();
      } catch {
        // ignore
      }
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    /** Notify listeners that metadata is available (duration, etc.). */
    notifyReady() {
      applyMuteVolume();
      if (startSeconds > 0) seekTo(startSeconds);
      emit("loadedmetadata");
      emit("durationchange");
      emit("loadeddata");
      emit("timeupdate");
    },
    destroy() {
      destroyed = true;
      stopTimePoll();
      listeners.clear();
      try {
        player.removeEventListener("onStateChange", onStateChange);
      } catch {
        // ignore
      }
    },
  };

  return adapter;
}
