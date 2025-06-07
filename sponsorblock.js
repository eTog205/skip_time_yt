// ==UserScript==
// @name         YouTube Auto Skip Sponsor (SponsorBlock) + Segment Coloring
// @namespace    eTog205-skip
// @version      1.2
// @description  Tự động bỏ qua sponsor, intro, outro... và hiển thị đoạn bị skip bằng màu trên thanh tiến trình YouTube 🎨
// @author       Gỗ
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const SPONSORBLOCK_API = "https://sponsor.ajay.app/api/skipSegments?videoID=";
  const CATEGORY_COLORS = {
    sponsor: "#00d400",
    selfpromo: "#008fd6",
    interaction: "#cc00ff",
    intro: "#ffff00",
    outro: "#ff0000",
    music_offtopic: "#00ffff",
  };

  let currentVideoId = "";
  let segments = [];

  function getVideoID() {
    return new URLSearchParams(window.location.search).get("v");
  }

  function fetchSegments(videoID) {
    return fetch(
      `${SPONSORBLOCK_API}${videoID}&categories=["sponsor","selfpromo","interaction","intro","outro","music_offtopic"]`
    )
      .then((res) => res.json())
      .catch(() => []);
  }

  function checkAndSkip() {
    const video = document.querySelector("video");
    if (!video || segments.length === 0) return;

    const time = video.currentTime;
    for (const item of segments) {
      if (!item.segment || item.segment.length < 2) continue;
      const [start, end] = item.segment;
      if (time >= start && time < end) {
        video.currentTime = end;
        break;
      }
    }
  }

  function drawSegmentsOnProgressBar(duration) {
    const barContainer = document.querySelector(".ytp-progress-list");
    if (!barContainer || !duration || segments.length === 0) return;

    barContainer
      .querySelectorAll(".ytp-sponsorblock-marker")
      .forEach((e) => e.remove());

    for (const item of segments) {
      if (!item.segment || item.segment.length < 2) continue;

      const [start, end] = item.segment;
      const cat = item.category || "sponsor";
      const color = CATEGORY_COLORS[cat] || "#ffffff";

      const left = (start / duration) * 100;
      const width = ((end - start) / duration) * 100;

      const marker = document.createElement("div");
      marker.className = "ytp-sponsorblock-marker";
      Object.assign(marker.style, {
        position: "absolute",
        height: "100%",
        left: `${left.toFixed(3)}%`,
        width: `${width.toFixed(3)}%`,
        backgroundColor: color,
        pointerEvents: "none",
        zIndex: "10",
      });

      barContainer.appendChild(marker);
    }
  }

  function init() {
    const newId = getVideoID();
    if (newId && newId !== currentVideoId) {
      currentVideoId = newId;
      segments = [];

      fetchSegments(currentVideoId).then((data) => {
        segments = data;
        console.log(`[SponsorBlock] 🎯 Đã tải ${segments.length} đoạn`);

        const waitForVideo = setInterval(() => {
          const video = document.querySelector("video");
          const bar = document.querySelector(".ytp-progress-list");

          if (video?.duration && bar) {
            drawSegmentsOnProgressBar(video.duration);
            clearInterval(waitForVideo);
          }
        }, 500);
      });
    }
  }

  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      init();
    }
    checkAndSkip();
  }, 500);
})();
