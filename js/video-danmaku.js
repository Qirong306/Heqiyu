/**
 * video-danmaku.js
 * 视频弹幕聊天模块
 * 功能：视频播放 + Canvas弹幕 + 聊天消息同步 + 自动评论
 * 角色：使用主应用当前聊天对象（appData.otherName + appData.otherAvatar）
 */

const VideoDanmaku = (function() {
    'use strict';

    // ==================== 自动评论词库 ====================
    const COMMENT_LINES = [
        '这个画面绝了',
        '哈哈哈哈笑死',
        '不是吧这也太离谱了',
        '好甜好甜',
        '等等我错过了什么',
        '再来一遍',
        '前方高能',
        '这个转场我可以',
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
        '我笑了'
    ];

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

    // ==================== DOM 元素缓存 ====================
    let els = {};

    // ==================== 工具函数 ====================
    function $(sel) { return document.querySelector(sel); }
    function $$(sel) { return document.querySelectorAll(sel); }
    function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    // ==================== 弹幕引擎 ====================
    function initCanvas() {
        state.canvas = els.canvas;
        state.ctx = state.canvas.getContext('2d');
        resizeCanvas();
    }

    function resizeCanvas() {
        if (!state.canvas || !els.videoContainer) return;
        const rect = els.videoContainer.getBoundingClientRect();
        state.canvas.width = rect.width;
        state.canvas.height = rect.height;
        state.canvas.style.width = rect.width + 'px';
        state.canvas.style.height = rect.height + 'px';
    }

    function createDanmaku(text, color) {
        if (!state.canvas) return;
        const colors = ['#ffffff', '#ff6b9d', '#4ecdc4', '#ffe66d', '#a8d8ea', '#ffd3b6'];
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
        const dm = createDanmaku(text, color);
        state.danmakuList.push(dm);
    }

    function updateDanmaku() {
        if (!state.ctx || !state.canvas) return;

        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);

        for (let i = state.danmakuList.length - 1; i >= 0; i--) {
            const dm = state.danmakuList[i];
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

            const textWidth = state.ctx.measureText(dm.text).width;
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
        if (state.video.src && state.video.src.startsWith('blob:')) {
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
        const url = els.urlInput.value.trim();
        if (!url) {
            showToast('请输入视频链接');
            return;
        }
        if (url.indexOf('.mp4') === -1 && url.indexOf('mp4') === -1) {
            showToast('请输入 .mp4 格式的视频链接');
            return;
        }
        loadVideo(url);
    }

    function handleFileUpload(file) {
        if (!file) return;
        if (file.type.indexOf('mp4') === -1 && file.name.indexOf('.mp4') === -1) {
            showToast('请选择 .mp4 格式的视频');
            return;
        }
        const url = URL.createObjectURL(file);
        loadVideo(url);
    }

    function handleExampleVideo() {
        const exampleUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        loadVideo(exampleUrl);
    }

    // ==================== 聊天消息（写入主聊天） ====================
    function sendUserMessage(text) {
        if (!text.trim()) return;
        // 写入主聊天
        if (typeof vdAddMessage === 'function') {
            vdAddMessage(text.trim(), 'me');
        }
        // 发弹幕
        addDanmaku(text.trim(), '#ffffff');
    }

    function sendOtherMessage(text) {
        // 写入主聊天
        if (typeof vdAddMessage === 'function') {
            vdAddMessage(text, 'other');
        }
        // 发弹幕
        addDanmaku(text, '#ff6b9d');
    }

    // ==================== 自动评论 ====================
    function handleVideoTimeUpdate() {
        if (!state.video || !state.isPlaying) return;
        const currentSecond = Math.floor(state.video.currentTime);
        const intervalIndex = Math.floor(currentSecond / state.commentInterval);
        if (intervalIndex > state.lastCommentSecond) {
            state.lastCommentSecond = intervalIndex;
            autoComment();
        }
    }

    function autoComment() {
        const line = randomItem(COMMENT_LINES);
        const otherName = (typeof appData !== 'undefined' && appData.otherName) ? appData.otherName : 'TA';
        const fullText = otherName + ': ' + line;
        sendOtherMessage(fullText);
    }

    // ==================== Toast ====================
    function showToast(message) {
        if (typeof window.showToast === 'function') {
            window.showToast(message);
            return;
        }
        let toast = document.getElementById('vd-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'vd-toast';
            toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:10px 20px;border-radius:20px;z-index:10000;font-size:14px;pointer-events:none;transition:opacity 0.3s;';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(function() { toast.style.opacity = '0'; }, 2000);
    }

    // ==================== 视频事件绑定 ====================
    function bindVideoEvents() {
        if (!state.video) return;

        state.video.addEventListener('play', function() {
            state.isPlaying = true;
            startDanmakuLoop();
        });

        state.video.addEventListener('pause', function() {
            state.isPlaying = false;
            stopDanmakuLoop();
        });

        state.video.addEventListener('ended', function() {
            state.isPlaying = false;
            stopDanmakuLoop();
            if (typeof vdAddMessage === 'function') {
                vdAddMessage('(视频播放完毕)', 'other');
            }
        });

        state.video.addEventListener('timeupdate', handleVideoTimeUpdate);

        state.video.addEventListener('seeked', function() {
            state.lastCommentSecond = Math.floor(state.video.currentTime / state.commentInterval);
        });

        state.video.addEventListener('error', function() {
            showToast('视频加载失败，请检查链接或文件');
        });
    }

    // ==================== 文件拖拽 ====================
    function setupDragDrop() {
        if (!els.videoContainer) return;
        els.videoContainer.addEventListener('dragover', function(e) {
            e.preventDefault();
            els.videoContainer.classList.add('vd-dragover');
        });
        els.videoContainer.addEventListener('dragleave', function() {
            els.videoContainer.classList.remove('vd-dragover');
        });
        els.videoContainer.addEventListener('drop', function(e) {
            e.preventDefault();
            els.videoContainer.classList.remove('vd-dragover');
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
        });
    }

    // ==================== UI 事件绑定 ====================
    function bindUIEvents() {
        els.btnClose.addEventListener('click', close);

        els.btnLoadUrl.addEventListener('click', handleUrlLoad);
        els.urlInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') handleUrlLoad();
        });

        els.btnExample.addEventListener('click', handleExampleVideo);

        els.fileInput.addEventListener('change', function(e) {
            if (e.target.files[0]) handleFileUpload(e.target.files[0]);
        });

        els.btnSend.addEventListener('click', function() {
            sendUserMessage(els.chatInput.value);
            els.chatInput.value = '';
        });
        els.chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendUserMessage(els.chatInput.value);
                els.chatInput.value = '';
            }
        });

        document.addEventListener('keydown', handleKeyboard);
        window.addEventListener('resize', function() { resizeCanvas(); });
    }

    function handleKeyboard(e) {
        if (!state.isOpen) return;
        if (e.key === 'Escape') { close(); return; }
        if (e.key === ' ' && document.activeElement !== els.chatInput && document.activeElement !== els.urlInput) {
            e.preventDefault();
            if (state.video && state.video.src && state.video.src !== window.location.href) {
                if (state.video.paused) {
                    state.video.play().catch(function() {});
                } else {
                    state.video.pause();
                }
            }
        }
    }

    // ==================== 缓存 DOM 元素 ====================
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
    }

    // ==================== 视频占位切换 ====================
    function setupVideoObserver() {
        if (!state.video || !els.placeholder) return;
        const observer = new MutationObserver(function() {
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

        if (state.video && !state.video.paused) {
            startDanmakuLoop();
        }
    }

    function close() {
        if (!state.isOpen) return;
        state.isOpen = false;
        if (els.container) {
            els.container.classList.remove('vd-open');
        }
        document.body.style.overflow = '';
        stopDanmakuLoop();
        if (state.video && !state.video.paused) {
            state.video.pause();
        }
    }

    function destroy() {
        close();
        stopDanmakuLoop();
        clearDanmaku();
        if (state.video) {
            state.video.pause();
            if (state.video.src && state.video.src.startsWith('blob:')) {
                URL.revokeObjectURL(state.video.src);
            }
            state.video.src = '';
        }
    }

    // ==================== 暴露 API ====================
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
