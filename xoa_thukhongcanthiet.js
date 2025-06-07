// ==UserScript==
// @name         Xóa những thứ không cần thiết
// @namespace    UserScripts
// @version      1.4
// @description  Xóa nút chuông thông báo và nút Tạo/Upload trên YouTube, ...
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
	"use strict";

	const selectors = [
		"ytd-notification-topbar-button-renderer",
		"ytd-button-renderer.style-scope.ytd-masthead",
		"ytd-menu-renderer > div:nth-child(2) button-view-model button",
		"ytd-video-owner-renderer > div:nth-child(3)",
		"ytd-merch-shelf-renderer > div",
		"ytd-menu-popup-renderer ytd-menu-service-item-renderer:first-of-type tp-yt-paper-item",
	];

	const removeIfExists = () => {
		let removedAny = false;
		selectors.forEach((sel) => {
			document.querySelectorAll(sel).forEach((el) => {
				el.remove();
				removedAny = true;
				console.log(`✅ Đã xóa: ${sel}`);
			});
		});
		return removedAny;
	};

	const observer = new MutationObserver(() => {
		removeIfExists();
	});

	const tryRemoveAndObserve = () => {
		removeIfExists();

		observer.observe(document.body, { childList: true, subtree: true });

		setTimeout(() => {
			observer.disconnect();
			console.log("⏱️ Dừng theo dõi sau 5 giây.");
		}, 5000);
	};

	window.addEventListener("load", () => {
		setTimeout(tryRemoveAndObserve, 500);
	});
})();
