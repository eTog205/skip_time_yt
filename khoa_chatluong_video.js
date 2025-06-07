// ==UserScript==
// @name        Đặt chất lượng cho YouTube
// @namespace   UserScripts
// @match       https://www.youtube.com/watch*
// @version     0.7.0
// @description Tự động chọn hoặc thủ công chọn chất lượng video
// @grant       none
// @run-at      document-start
// ==/UserScript==

(() => {
  const QUALITY_KEY = "yt_quality_override";
  let qualityOverride = localStorage.getItem(QUALITY_KEY) || "";

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

  const setQuality = (player, level) => {
    if (!level) return;
    player.setPlaybackQualityRange?.(level, level);
    player.setPlaybackQuality?.(level);
    console.log("✅ Đặt chất lượng:", level);
  };

  const setBestQuality = (player) => {
    const levels = player.getAvailableQualityLevels?.();
    if (Array.isArray(levels) && levels.length) {
      console.log("📋 Danh sách chất lượng video có thể chọn:");
      levels.forEach((q, i) => {
        console.log(`  ${i + 1}. ${q}`);
      });

      const select = document.getElementById("yt-quality-toggle");
      if (select) {
        // Xóa tất cả option cũ trừ "on" nếu có
        [...select.options].forEach(opt => {
  if (opt.value !== "on") {
    select.removeChild(opt);
  }
});


        // Thêm lại tất cả chất lượng thực tế
        levels.forEach((level) => {
          if (!["on"].includes(level)) {
            const opt = document.createElement("option");
            opt.value = level;
            opt.textContent = level === "auto" ? "⛔ Auto (Mặc định)" : `🟢 ${level}`;
            if (level === qualityOverride) opt.selected = true;
            select.appendChild(opt);
          }
        });
      }

      // Áp dụng chất lượng theo lựa chọn hiện tại
      if (qualityOverride === "on") {
        const best = levels.find((q) => q !== "auto");
        if (best) setQuality(player, best);
      } else if (levels.includes(qualityOverride)) {
        setQuality(player, qualityOverride);
      }
    }
  };

  const applyAutoQualityNow = () => {
    const player = getPlayer();
    if (player && qualityOverride) {
      setBestQuality(player);
    }
  };

  const setupQualityMonitor = async () => {
    const video = await waitForVideoElement();
    const player = getPlayer();
    if (!player) return;

    video.addEventListener("loadeddata", () => {
      setTimeout(() => setBestQuality(player), 200);
    });
  };

  function createControlDropdown() {
    const select = document.createElement("select");
    select.id = "yt-quality-toggle";
    Object.assign(select.style, {
      position: "fixed",
      top: "10px",
      left: "13.4vw",
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

    const firstOption = document.createElement("option");
    firstOption.value = "on";
    firstOption.textContent = "🔁 Tự động chất lượng cao nhất";
    select.appendChild(firstOption);

    // Lựa chọn hiện tại
    if (qualityOverride && qualityOverride !== "on") {
      const opt = document.createElement("option");
      opt.value = qualityOverride;
      opt.textContent = qualityOverride === "auto"
        ? "⛔ Auto (Mặc định)"
        : `🟢 ${qualityOverride}`;
      select.appendChild(opt);
    }

    select.value = qualityOverride || "on";

    select.addEventListener("change", () => {
      const selected = select.value;
      localStorage.setItem(QUALITY_KEY, selected);
      qualityOverride = selected;
      console.log("📶 Trạng thái:", selected);
      applyAutoQualityNow();
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
