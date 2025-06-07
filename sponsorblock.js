// ==UserScript==
// @name         YouTube Auto Skip Sponsor (SponsorBlock) + Segment Coloring
// @namespace    eTog205-skip
// @version      1.7
// @description  Tự động bỏ qua sponsor, intro, outro... và hiển thị đoạn bị skip bằng màu trên thanh tiến trình YouTube 🎨 (Hợp đoạn gần nhau)
// @author       Gỗ
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// @updateURL    https://raw.githubusercontent.com/eTog205/ch-nqu-ngc-o-sponsorblock-/main/sponsorblock.js
// @downloadURL  https://raw.githubusercontent.com/eTog205/ch-nqu-ngc-o-sponsorblock-/main/sponsorblock.js
// ==/UserScript==

(function () {
	"use strict";

	const SPONSORBLOCK_API = "https://sponsor.ajay.app/api/skipSegments?videoID=";
	const CATEGORY_COLORS = {
		sponsor: "#000ED4FF",
		selfpromo: "#008fd6",
		interaction: "#cc00ff",
		intro: "#00FFF2FF",
		outro: "#00FF2AFF",
		music_offtopic: "#C8FF00FF",
	};

	let segments = [];
	let currentVideoId = null;

	function getVideoID() {
		return new URLSearchParams(window.location.search).get("v");
	}

	function clearMarkers() {
		const barContainer = document.querySelector(".ytp-progress-list");
		if (barContainer) {
			barContainer
				.querySelectorAll(".ytp-sponsorblock-marker")
				.forEach((e) => e.remove());
			console.log("[SponsorBlock] 🧹 Đã xoá marker cũ");
		}
	}

	function mergeCloseSegments(segments, maxGap = 2.0) {
		if (!segments || segments.length === 0) return [];

		const sorted = [...segments].sort((a, b) => a.segment[0] - b.segment[0]);

		const merged = [];
		let current = sorted[0];

		for (let i = 1; i < sorted.length; i++) {
			const next = sorted[i];
			const [end1] = current.segment.slice(-1);
			const [start2] = next.segment;

			if (start2 - end1 <= maxGap) {
				current = {
					category: current.category,
					segment: [current.segment[0], next.segment[1]],
				};
			} else {
				merged.push(current);
				current = next;
			}
		}

		merged.push(current);
		return merged;
	}

	function fetchSegments(videoID) {
		const url = `${SPONSORBLOCK_API}${videoID}&categories=["sponsor","selfpromo","interaction","intro","outro","music_offtopic"]`;
		console.log(`[SponsorBlock] 📡 Gửi API cho videoID: ${videoID}`);
		return fetch(url)
			.then((res) => {
				if (!res.ok) throw new Error("Không lấy được dữ liệu từ API");
				return res.json();
			})
			.catch((err) => {
				console.error("[SponsorBlock] ❌ API lỗi:", err);
				return [];
			});
	}

	function checkAndSkip() {
		const video = document.querySelector("video");
		if (!video || segments.length === 0) return;

		const time = video.currentTime;
		const epsilon = 0.4;

		for (const item of segments) {
			if (!item.segment || item.segment.length < 2) continue;
			const [start, end] = item.segment;

			if (end - start < 0.3) continue;

			if (time >= start && time <= end - epsilon) {
				console.log(
					`[SponsorBlock] ⏩ Skip từ ${time.toFixed(2)} → ${end.toFixed(2)}`
				);
				video.currentTime = end;
				break;
			}
		}
	}

	function drawSegmentsOnProgressBar(duration) {
		const barContainer = document.querySelector(".ytp-progress-list");
		if (!barContainer || !duration || segments.length === 0) return;

		clearMarkers();
		console.log(
			`[SponsorBlock] 🎨 Vẽ ${segments.length} đoạn lên thanh tiến trình`
		);

		for (const item of segments) {
			if (!item.segment || item.segment.length < 2) {
				console.warn("[SponsorBlock] ❌ Bỏ qua đoạn lỗi:", item);
				continue;
			}

			const [start, end] = item.segment;
			const cat = item.category || "sponsor";
			const color = CATEGORY_COLORS[cat] || "#ffffff";

			const left = (start / duration) * 100;
			const width = ((end - start) / duration) * 100;

			const marker = document.createElement("div");
			marker.className = "ytp-sponsorblock-marker";
			Object.assign(marker.style, {
				position: "absolute",
				top: "0",
				left: `${left.toFixed(3)}%`,
				width: `${width.toFixed(3)}%`,
				height: "100%",
				backgroundColor: color,
				pointerEvents: "none",
				zIndex: "9999",
				mixBlendMode: "normal",
			});

			barContainer.appendChild(marker);
			console.log(
				`[SponsorBlock] ✔️ Đoạn: [${start.toFixed(2)} – ${end.toFixed(
					2
				)}] (${cat})`
			);
		}
	}

	function init(videoID) {
		currentVideoId = videoID;
		segments = [];
		console.log(`[SponsorBlock] 🔄 Bắt đầu xử lý video: ${videoID}`);
		clearMarkers();

		fetchSegments(videoID).then((data) => {
			const merged = mergeCloseSegments(data || []);
			segments = merged;
			console.log(`[SponsorBlock] ✅ Có ${segments.length} đoạn sau khi gộp`);

			if (!segments.length) return;

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

	setInterval(() => {
		const vid = getVideoID();
		if (vid && vid !== currentVideoId) {
			init(vid);
		}

		checkAndSkip();
	}, 500);
})();
