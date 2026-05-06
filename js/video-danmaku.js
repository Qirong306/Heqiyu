/**
 * video-danmaku.js
 * 视频弹幕聊天模块
 * 功能：视频播放 + Canvas弹幕 + 聊天消息同步 + 自动评论 + 词库管理
 */
const VideoDanmaku = (function() {
    'use strict';

    // ==================== 默认弹幕词库 ====================
    const DEFAULT_LINES = [
        '这个画面绝了',
        '哈哈哈哈笑死',
        '好甜好甜',
        '等等我错过了什么',
        '再来一遍',
        '前方高能',
        '名场面来了',
        '已上线，陪你一起看',
        '信号满格',
        '这波不亏',
        '已截图保存',
        '进度条撑住',
        '这里太好看了',
        '有人吗有人吗',
        '深夜档在此',
        '再看亿遍',
        '此处应有掌声',
        '我笑了',
        '太真实了',
        '这是什么神仙'
    ];

    const WORD_BANK_KEY = 'vd_comment_lines';

    // ==================== 词库管理 ====================
    function loadWordBank() {
        try {
            const saved = localStorage.getItem(WORD_BANK_KEY);
            if (saved) {
                const arr = JSON.parse(saved);
                if (Array.isArray(arr) && arr.length > 0) return arr;
            }
        } catch(e) {}
        return DEFAULT_LINES.slice();
    }

    function saveWordBank(lines) {
        try {
            localStorage.setItem(WORD_BANK_KEY, JSON.stringify(lines));
        } catch(e) {}
    }

    function getWordBank() {
        if (!getWordBank._cache) {
            getWordBank._cache = loadWordBank();
        }
        return getWordBank._cache;
    }

    function refreshWordBankCache() {
        getWordBank._cache = loadWordBank();
    }

    function randomLine() {
        const lines = getWordBank();
        return lines[Math.floor(Math.random() * lines.length)];
    }

    function openWordBankModal() {
        const lines = getWordBank();
        let listHtml = '';
        lines.forEach(function(line, i) {
            listHtml += '<div class="vd-wb-item"><span>' + line + '</span><button class="vd-wb-del" data-idx="' + i + '">x</button></div>';
        });

        const html =
            '<div class="vd-wb-overlay" id="vd-wb-overlay">' +
            '<div class="vd-wb-modal">' +
            '<div class="vd-wb-header">' +
            '<span>弹幕词库 (' + lines.length + '条)</span>' +
            '<button class="vd-wb-close" id="vd-wb-close">x</button>' +
            '</div>' +
            '<div class="vd-wb-add-row">' +
            '<input type="text" id="vd-wb-new-word" placeholder="添加新词条..." maxlength="30">' +
            '<button id="vd-wb-add-btn">添加</button>' +
            '</div>' +
            '<div class="vd-wb-list">' + (listHtml || '<div class="vd-wb-empty">还没有词条</div>') + '</div>' +
            '<div class="vd-wb-footer">' +
            '<button id="vd-wb-reset">恢复默认</button>' +
            '<button id="vd-wb-done">完成</button>' +
            '</div>' +
            '</div>' +
            '</div>';

        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('vd-wb-close').onclick = closeWordBankModal;
        document.getElementById('vd-wb-done').onclick = closeWordBankModal;
        document.getElementById('vd-wb-overlay').onclick = function(e) {
            if (e.target === this) closeWordBankModal();
        };

        document.getElementById('vd-wb-add-btn').onclick = function() {
            const input = document.getElementById('vd-wb-new-word');
            const word = input.value.trim();
            if (!word) return;
            if (word.length > 30) { showToast('词条不能超过30个字'); return; }
            const lines = getWordBank();
            lines.push(word);
            saveWordBank(lines);
            refreshWordBankCache();
            input.value = '';
            closeWordBankModal();
            openWordBankModal();
        };

        document.getElementById('vd-wb-new-word').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') document.getElementById('vd-wb-add-btn').click();
        });

        document.getElementById('vd-wb-reset').onclick = function() {
            if (!confirm('恢复默认词库？当前词库将被覆盖。')) return;
            saveWordBank(DEFAULT_LINES.slice());
            refreshWordBankCache();
            closeWordBankModal();
            openWordBankModal();
            showToast('已恢复默认词库');
        };

        document.querySelectorAll('.vd-wb-del').forEach(function(btn) {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-idx'));
                const lines = getWordBank();
                if (lines.length <= 1) { showToast('至少保留一条'); return; }
                lines.splice(idx, 1);
                saveWordBank(lines);
                refreshWordBankCache();
                closeWordBankModal();
                openWordBankModal();
            };
        });
    }

    function closeWordBankModal() {
        const overlay = document.getElementById('vd-wb-overlay');
        if (overlay) overlay.remove();
    }

    // ==================== 状态管理 ====================
    let state = {
        isOpen: false,
        container: null,
        video: null,
        canvas: null,
        ctx: null,
        danmakuList: [],
        maxDanmaku: 20,
        animationId: null,
        lastCommentSecond: -1,
        commentInterval: 20,
        fontSize: 20,
        speed: 2,
        isPlaying: false
    };

    let els = {};

    // ==================== 工具函数 ====================
    function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    // ==================== 弹幕引擎 ====================
    function initCanvas() {
        state.canvas = els.canvas;
        state.ctx = state.canvas.getContext('2d');
        resizeCanvas();
    }

    function resizeCanvas() {
        if (!state.canvas || !els.videoContainer) return;
        var rect = els.videoContainer.getBoundingClientRect();
        state.canvas.width = rect.width;
        state.canvas.height = rect.height;
        state.canvas.style.width = rect.width + 'px';
        state.canvas.style.height = rect.height + 'px';
    }

    function createDanmaku(text, color) {
        if (!state.canvas) return;
        var colors = ['#ffffff', '#ff6b9d', '#4ecdc4', '#ffe66d', '#a8d8ea', '#ffd3b6'];
        return {
            text: text,
            x: state.canvas.width,
            y: randomInt(30, state.canvas.height - 30),
            speed: state.speed + Math.random() * 1.5,
            color: color || colors[Math.floor(Math.random() * colors.length)],
            opacity: 0.85,
            fontSize: state.fontSize + randomInt(-2, 4),
            id: Date.now() + Math.random()
        };
    }

    function addDanmaku(text, color) {
        if (state.danmakuList.length >= state.maxDanmaku) {
            state.danmakuList.shift();
        }
        var dm = createDanmaku(text, color);
        state.danmakuList.push(dm);
    }

    function updateDanmaku() {
        if (!state.ctx || !state.canvas) return;
        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);

        for (var i = state.danmakuList.length - 1; i >= 0; i--) {
            var dm = state.danmakuList[i];
            dm.x -= dm.speed;

            state.ctx.save();
            state.ctx.font = 'bold ' + dm.fontSize + 'px "Ma Shan Zheng", "PingFang SC", "Microsoft YaHei", sans-serif';
            state.ctx.fillStyle = dm.color;
            state.ctx.globalAlpha = dm.opacity;
            state.ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            state.ctx.lineWidth = 2.5;
            state.ctx.strokeText(dm.text, dm.x, dm.y);
            state.ctx.fillText(dm.text, dm.x, dm.y);
            state.ctx.restore();

            var textWidth = state.ctx.measureText(dm.text).width;
            if (dm.x + textWidth < 0) {
                state.danmakuList.splice(i, 1);
            }
        }

        state.animationId = requestAnimationFrame(updateDanmaku);
    }

    function startDanmakuLoop() {
        if (state.animationId) return;
        updateDanmaku();
    }

    function stopDanmakuLoop() {
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }
    }

    function clearDanmaku() {
        state.danmakuList = [];
        if (state.ctx && state.canvas) {
            state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        }
    }

    // ==================== 视频控制 ====================
    function loadVideo(source) {
        if (!state.video) return;
        state.video.pause();
        if (state.video.src && state.video.src.indexOf('blob:') === 0) {
            URL.revokeObjectURL(state.video.src);
        }
        state.video.src = source;
        state.video.load();
        clearDanmaku();
        state.lastCommentSecond = -1;
        updateVideoSourceDisplay(source);
        state.video.play().catch(function() {});
    }

    function updateVideoSourceDisplay(source) {
        if (els.sourceLabel) {
            if (source.indexOf('blob:') === 0) {
                els.sourceLabel.textContent = '本地文件';
            } else if (source.indexOf('example') > -1 || source.indexOf('sample') > -1) {
                els.sourceLabel.textContent = '示例视频';
            } else {
                els.sourceLabel.textContent = '在线视频';
            }
        }
    }

    function handleUrlLoad() {
        var url = els.urlInput.value.trim();
        if (!url) { showToast('请输入视频链接'); return; }
        if (url.indexOf('.mp4') === -1) { showToast('请输入 .mp4 格式的视频链接'); return; }
        loadVideo(url);
    }

    function handleFileUpload(file) {
        if (!file) return;
        if (file.type.indexOf('mp4') === -1 && file.name.indexOf('.mp4') === -1) {
            showToast('请选择 .mp4 格式的视频'); return;
        }
        loadVideo(URL.createObjectURL(file));
    }

    function handleExampleVideo() {
        loadVideo('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    }

    // ==================== 聊天消息 ====================
    function sendUserMessage(text) {
        if (!text.trim()) return;
        if (typeof vdAddMessage === 'function') {
            vdAddMessage(text.trim(), 'me');
        }
        addDanmaku(text.trim(), '#ffffff');
    }

    function sendOtherMessage(text) {
        if (typeof vdAddMessage === 'function') {
            vdAddMessage(text, 'other');
        }
        addDanmaku(text, '#ff6b9d');
    }

    // ==================== 自动评论 ====================
    function handleVideoTimeUpdate() {
        if (!state.video || !state.isPlaying) return;
        var currentSecond = Math.floor(state.video.currentTime);
        var intervalIndex = Math.floor(currentSecond / state.commentInterval);
        if (intervalIndex > state.lastCommentSecond) {
            state.lastCommentSecond = intervalIndex;
            autoComment();
        }
    }

    function autoComment() {
        var line = randomLine();
        var otherName = (typeof appData !== 'undefined' && appData.otherName) ? appData.otherName : 'TA';
        sendOtherMessage(otherName + ': ' + line);
    }

    // ==================== Toast ====================
    function showToast(message) {
        if (typeof window.showToast === 'function') {
            window.showToast(message);
            return;
        }
        var t = document.getElementById('vd-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'vd-toast';
            t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:10px 20px;border-radius:20px;z-index:10000;font-size:14px;pointer-events:none;transition:opacity 0.3s;';
            document.body.appendChild(t);
        }
        t.textContent = message;
        t.style.opacity = '1';
        clearTimeout(t._timeout);
        t._timeout = setTimeout(function() { t.style.opacity = '0'; }, 2000);
    }

    // ==================== 视频事件 ====================
    function bindVideoEvents() {
        if (!state.video) return;
        state.video.addEventListener('play', function() { state.isPlaying = true; startDanmakuLoop(); });
        state.video.addEventListener('pause', function() { state.isPlaying = false; stopDanmakuLoop(); });
        state.video.addEventListener('ended', function() {
            state.isPlaying = false; stopDanmakuLoop();
            if (typeof vdAddMessage === 'function') {
                vdAddMessage('(视频播放完毕)', 'other');
            }
        });
        state.video.addEventListener('timeupdate', handleVideoTimeUpdate);
        state.video.addEventListener('seeked', function() {
            state.lastCommentSecond = Math.floor(state.video.currentTime / state.commentInterval);
        });
        state.video.addEventListener('error', function() { showToast('视频加载失败'); });
    }

    function setupDragDrop() {
        if (!els.videoContainer) return;
        els.videoContainer.addEventListener('dragover', function(e) { e.preventDefault(); els.videoContainer.classList.add('vd-dragover'); });
        els.videoContainer.addEventListener('dragleave', function() { els.videoContainer.classList.remove('vd-dragover'); });
        els.videoContainer.addEventListener('drop', function(e) {
            e.preventDefault(); els.videoContainer.classList.remove('vd-dragover');
            if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
        });
    }

    function bindUIEvents() {
        els.btnClose.addEventListener('click', close);
        els.btnLoadUrl.addEventListener('click', handleUrlLoad);
        els.urlInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleUrlLoad(); });
        els.btnExample.addEventListener('click', handleExampleVideo);
        els.fileInput.addEventListener('change', function(e) { if (e.target.files[0]) handleFileUpload(e.target.files[0]); });
        els.btnSend.addEventListener('click', function() { sendUserMessage(els.chatInput.value); els.chatInput.value = ''; });
        els.chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendUserMessage(els.chatInput.value); els.chatInput.value = ''; }
        });
        els.btnWordBank.addEventListener('click', openWordBankModal);
        document.addEventListener('keydown', handleKeyboard);
        window.addEventListener('resize', function() { resizeCanvas(); });
    }

    function handleKeyboard(e) {
        if (!state.isOpen) return;
        if (e.key === 'Escape') { close(); return; }
        if (e.key === ' ' && document.activeElement !== els.chatInput && document.activeElement !== els.urlInput) {
            e.preventDefault();
            if (state.video && state.video.src && state.video.src !== window.location.href) {
                if (state.video.paused) state.video.play().catch(function() {});
                else state.video.pause();
            }
        }
    }

    function cacheElements() {
        els.container = document.getElementById('video-danmaku-container');
        els.videoContainer = document.getElementById('vd-video-container');
        els.video = document.getElementById('vd-video');
        els.canvas = document.getElementById('vd-canvas');
        els.placeholder = document.getElementById('vd-placeholder');
        els.sourceLabel = document.getElementById('vd-source-label');
        els.urlInput = document.getElementById('vd-url-input');
        els.chatInput = document.getElementById('vd-chat-input');
        els.btnClose = document.getElementById('vd-btn-close');
        els.btnLoadUrl = document.getElementById('vd-btn-load-url');
        els.btnExample = document.getElementById('vd-btn-example');
        els.btnSend = document.getElementById('vd-btn-send');
        els.fileInput = document.getElementById('vd-file-input');
        els.btnWordBank = document.getElementById('vd-btn-wordbank');
    }

    function setupVideoObserver() {
        if (!state.video || !els.placeholder) return;
        var observer = new MutationObserver(function() {
            if (state.video.src && state.video.src !== window.location.href) {
                els.placeholder.style.display = 'none';
            } else {
                els.placeholder.style.display = 'flex';
            }
        });
        observer.observe(state.video, { attributes: true, attributeFilter: ['src'] });
    }

    // ==================== 公开接口 ====================
    function open() {
        if (state.isOpen) return;
        if (!document.getElementById('video-danmaku-container')) return;

        cacheElements();
        state.video = els.video;
        state.container = els.container;
        initCanvas();
        bindVideoEvents();
        bindUIEvents();
        setupDragDrop();
        setupVideoObserver();

        state.isOpen = true;
        els.container.classList.add('vd-open');
        document.body.style.overflow = 'hidden';
        setTimeout(resizeCanvas, 100);

        if (state.video && !state.video.paused) startDanmakuLoop();

        // 在主聊天发一条系统消息
        var otherName = (typeof appData !== 'undefined' && appData.otherName) ? appData.otherName : 'TA';
        if (typeof addSystemMsg === 'function') {
            addSystemMsg('你和 ' + otherName + ' 开始一起看视频了');
        }
    }

    function close() {
        if (!state.isOpen) return;
        state.isOpen = false;
        if (els.container) els.container.classList.remove('vd-open');
        document.body.style.overflow = '';
        stopDanmakuLoop();
        if (state.video && !state.video.paused) state.video.pause();
    }

    function destroy() {
        close();
        stopDanmakuLoop();
        clearDanmaku();
        if (state.video) {
            state.video.pause();
            if (state.video.src && state.video.src.indexOf('blob:') === 0) URL.revokeObjectURL(state.video.src);
            state.video.src = '';
        }
    }

    return {
        open: open,
        close: close,
        destroy: destroy,
        addDanmaku: addDanmaku,
        clearDanmaku: clearDanmaku,
        sendMessage: sendUserMessage,
        loadVideo: loadVideo
    };

})();
