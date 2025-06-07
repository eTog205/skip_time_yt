// ==UserScript==
// @name        YouTube: Auto Max Quality (with Live Toggle)
// @namespace   UserScripts
// @match       https://www.youtube.com/*
// @version     0.4.3
// @description Tự động chọn chất lượng video cao nhất
// @grant       none
// @run-at      document-start
// ==/UserScript==

(() => {
  const STORAGE_KEY = "yt_auto_max_enabled";

  let isEnabled = localStorage.getItem(STORAGE_KEY) !== "off";

  const waitForVideoElement = () =>
    new Promise((resolve) => {
      const check = () => {
        const video = document.querySelector("video");
        if (video) resolve(video);
        else requestAnimationFrame(check);
      };
      check();
    });

  const getPlayer = () => {
    const player = document.getElementById("movie_player");
    return player && typeof player.getAvailableQualityLevels === "function"
      ? player
      : null;
  };

  const setBestQuality = (player) => {
    const levels = player.getAvailableQualityLevels?.();
    if (Array.isArray(levels) && levels.length) {
      const best = levels.find((q) => q !== "auto");
      if (best) {
        player.setPlaybackQualityRange?.(best, best);
        player.setPlaybackQuality?.(best);
        console.log("✅ Auto set quality to", best);
      }
    }
  };

  const applyAutoQualityNow = () => {
    const player = getPlayer();
    if (player && isEnabled) {
      setBestQuality(player);
    }
  };

  const setupQualityMonitor = async () => {
    const video = await waitForVideoElement();
    const player = getPlayer();
    if (!player) return;

    video.addEventListener("loadeddata", () => {
      if (isEnabled) {
        setTimeout(() => setBestQuality(player), 200);
      }
    });
  };

  function createControlDropdown() {
    const select = document.createElement("select");
    select.id = "yt-quality-toggle";
    Object.assign(select.style, {
  position: "fixed",
  top: "10px",
  left: "13.4vw", // Vị trí động theo % chiều rộng
  zIndex: "9999",
  padding: "6px 12px",
  fontSize: "14px",
  backgroundColor: "#282828",
  color: "#ffffff",
  border: "1px solid #555",
  borderRadius: "4px",
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
});

    const options = {
      on: "🔁 Bật Auto Max",
      off: "⛔ Tắt",
    };

    for (const [value, label] of Object.entries(options)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    }

    select.value = isEnabled ? "on" : "off";

    select.addEventListener("change", () => {
      const selected = select.value;
      localStorage.setItem(STORAGE_KEY, selected);
      isEnabled = selected === "on";
      console.log("📶 Trạng thái Auto Max:", isEnabled ? "Bật" : "Tắt");

      if (isEnabled) {
        applyAutoQualityNow();
      }
    });

    document.body.appendChild(select);
  }

  if (!location.href.includes("/embed/")) {
    window.addEventListener("yt-navigate-finish", () => {
      setupQualityMonitor();
    });

    window.addEventListener("load", () => {
      createControlDropdown();
      setupQualityMonitor();
    });
  }
})();
