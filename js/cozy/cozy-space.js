// ==================== 暖屋主界面（Canvas 手绘版） ====================

var cozyFocusActive = false;
var cozyFocusTimer = null;
var cozyDanmakuTimer = null;
var cozyMusicPlayerOpen = false;
var cozyFocusSeconds = 0;
var cozyFocusInterval = null;

// ==================== 打开/关闭暖屋 ====================

function openCozySpace() {
    if (!appData.cozyRoom) {
        initCozyData();
    }
    
    ensureCozyDefaultSetup();
    checkOtherPurchases();
    renderCozySpace();
    
    var overlay = document.getElementById('cozyOverlay');
    if (overlay) {
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    // Canvas 渲染在 renderCozySpace 中已调用
    renderCozyRoom();
    renderCozyDanmakuHistory();
    startCozyDanmakuLoop();
    updateCozyMusicDisplay();
}

function closeCozySpace() {
    var overlay = document.getElementById('cozyOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    stopCozyDanmakuLoop();
    closeCozyFocusBar();
}

// ==================== 确保初始完整搭配 ====================

function ensureCozyDefaultSetup() {
    var room = appData.cozyRoom;
    var hasItems = false;
    for (var key in room.purchased) {
        if (room.purchased[key] && room.purchased[key].length > 0) {
            hasItems = true;
            break;
        }
    }
    
    if (!hasItems) {
        room.wall = 'warm';
        room.window = 'arch';
        room.floor = 'wood';
        room.weather = 'sunny';
        room.warmth = 100;
        room.purchased = {
            wall: ['warm'],
            window: ['arch'],
            floor: ['wood'],
            weather: ['sunny']
        };
        saveData();
    }
}

// ==================== 渲染主界面 ====================

function renderCozySpace() {
    var existing = document.getElementById('cozyOverlay');
    if (existing) existing.remove();
    
    var overlay = document.createElement('div');
    overlay.id = 'cozyOverlay';
    overlay.className = 'cozy-overlay';
    
    // ---- 顶部栏 ----
    var header = document.createElement('div');
    header.className = 'cozy-header';
    header.innerHTML = 
        '<div class="cozy-header-left">' +
            '<span class="cozy-header-weather" id="cozyWeatherLabel">' + getWeatherLabel() + '</span>' +
            '<span class="cozy-header-title">小暖屋</span>' +
        '</div>' +
        '<div class="cozy-header-actions">' +
            '<div class="cozy-music-mini" id="cozyMusicMini">' +
                '<button class="cozy-music-btn" onclick="toggleCozyMusic()" id="cozyMusicToggle">' +
                    '<span class="music-icon"></span>' +
                '</button>' +
                '<span class="cozy-music-name" id="cozyMusicName">未播放</span>' +
                '<div class="cozy-music-controls" id="cozyMusicControls" style="display:none;">' +
                    '<button class="cozy-music-cmd" onclick="cozyMusicPrev()">◀</button>' +
                    '<button class="cozy-music-cmd" onclick="cozyMusicPlayPause()" id="cozyMusicPlayBtn">▶</button>' +
                    '<button class="cozy-music-cmd" onclick="cozyMusicNext()">▶</button>' +
                '</div>' +
            '</div>' +
            '<span class="cozy-header-warmth" id="cozyWarmthDisplay">温暖 ' + (appData.cozyRoom.warmth || 100) + '</span>' +
            '<button onclick="closeCozySpace()" class="cozy-close-btn" title="关闭">✕</button>' +
        '</div>';
    overlay.appendChild(header);
    
    // ---- 暖屋主体 ----
    var body = document.createElement('div');
    body.className = 'cozy-body';
    body.id = 'cozyBody';
    
    // ===== Canvas 暖屋容器（替换原来的墙/窗/地面） =====
    var canvasContainer = document.createElement('div');
    canvasContainer.id = 'cozyCanvasContainer';
    canvasContainer.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;z-index:0;';
    body.appendChild(canvasContainer);
    
    // 弹幕层
    var danmakuLayer = document.createElement('div');
    danmakuLayer.className = 'cozy-danmaku-layer';
    danmakuLayer.id = 'cozyDanmakuLayer';
    body.appendChild(danmakuLayer);
    
    // 专注输入条
    var focusBar = document.createElement('div');
    focusBar.className = 'cozy-focus-bar';
    focusBar.id = 'cozyFocusBar';
    focusBar.innerHTML = 
        '<input type="text" id="cozyFocusInput" placeholder="说点什么..." maxlength="50" onkeydown="if(event.key===\'Enter\')sendCozyDanmaku()">' +
        '<button onclick="sendCozyDanmaku()">发送</button>' +
        '<button onclick="closeCozyFocusBar()" class="cozy-focus-close">✕</button>';
    body.appendChild(focusBar);
    
    overlay.appendChild(body);
    
    // ---- 底部功能栏 ----
    var footer = document.createElement('div');
    footer.className = 'cozy-footer';
    footer.innerHTML = 
        '<button onclick="openCozyShop()"><span class="icon-shop"></span>商城</button>' +
        '<button onclick="openCozyMessages()"><span class="icon-msg"></span>留言</button>' +
        '<button onclick="toggleCozyFocus()"><span class="icon-focus"></span>专注</button>' +
        '<button onclick="openCozyDaily()"><span class="icon-gift"></span>奖励</button>';
    overlay.appendChild(footer);
    
    document.body.appendChild(overlay);
    
    // ===== 渲染 Canvas =====
    setTimeout(function() {
        if (typeof renderCozyCanvas === 'function') {
            renderCozyCanvas();
        }
    }, 100);
}

// ==================== 渲染房间（刷新用） ====================

function renderCozyRoom() {
    // 更新天气标签
    var label = document.getElementById('cozyWeatherLabel');
    if (label) {
        var map = {
            sunny: '晴天',
            cloudy: '多云',
            rainy: '下雨',
            snowy: '下雪',
            night: '夜晚',
            sunset: '晚霞'
        };
        label.textContent = map[appData.cozyRoom.weather] || '晴天';
    }
    
    // 更新温暖值
    updateWarmthDisplay();
    
    // 刷新 Canvas
    if (typeof renderCozyCanvas === 'function') {
        setTimeout(renderCozyCanvas, 50);
    }
}

// ==================== 迷你音乐播放器 ====================

function toggleCozyMusic() {
    cozyMusicPlayerOpen = !cozyMusicPlayerOpen;
    var controls = document.getElementById('cozyMusicControls');
    if (controls) {
        controls.style.display = cozyMusicPlayerOpen ? 'flex' : 'none';
    }
    updateCozyMusicDisplay();
}

function updateCozyMusicDisplay() {
    var nameEl = document.getElementById('cozyMusicName');
    if (!nameEl) return;
    
    var playlist = appData.playlist || [];
    var currentIndex = typeof musicCurrentIndex !== 'undefined' ? musicCurrentIndex : -1;
    
    if (currentIndex >= 0 && currentIndex < playlist.length) {
        var song = playlist[currentIndex];
        nameEl.textContent = song.title || '未知歌曲';
    } else {
        nameEl.textContent = '未播放';
    }
    
    var playBtn = document.getElementById('cozyMusicPlayBtn');
    if (playBtn) {
        var isPlaying = typeof musicAudio !== 'undefined' && musicAudio && !musicAudio.paused;
        playBtn.textContent = isPlaying ? '■' : '▶';
    }
}

function cozyMusicPlayPause() {
    if (typeof musicAudio === 'undefined' || !musicAudio) {
        if (typeof openMusicPlayer === 'function') {
            openMusicPlayer();
            setTimeout(updateCozyMusicDisplay, 500);
        }
        return;
    }
    
    if (musicAudio.paused) {
        musicAudio.play();
    } else {
        musicAudio.pause();
    }
    updateCozyMusicDisplay();
}

function cozyMusicNext() {
    if (typeof nextSong === 'function') {
        nextSong();
        setTimeout(updateCozyMusicDisplay, 300);
    }
}

function cozyMusicPrev() {
    if (typeof prevSong === 'function') {
        prevSong();
        setTimeout(updateCozyMusicDisplay, 300);
    }
}

// ==================== 天气标签 ====================

function getWeatherLabel() {
    var map = {
        sunny: '晴天',
        cloudy: '多云',
        rainy: '下雨',
        snowy: '下雪',
        night: '夜晚',
        sunset: '晚霞'
    };
    return map[appData.cozyRoom.weather] || '晴天';
}

// ==================== 其他函数 ====================

function updateWarmthDisplay() {
    var el = document.getElementById('cozyWarmthDisplay');
    if (el) el.textContent = '温暖 ' + (appData.cozyRoom.warmth || 100);
}

function checkOtherPurchases() {
    var purchases = appData.cozyRoom.otherPurchases || [];
    var newItems = purchases.filter(function(p) { return p.isNew; });
    if (newItems.length > 0) {
        newItems.forEach(function(p) {
            showToast('对方更换了 ' + p.name);
            p.isNew = false;
        });
        saveData();
    }
}

// ==================== 专注模式 ====================

function toggleCozyFocus() {
    var bar = document.getElementById('cozyFocusBar');
    if (!bar) return;
    
    if (cozyFocusActive) {
        stopCozyFocus();
    } else {
        startCozyFocus();
    }
}

function startCozyFocus() {
    var bar = document.getElementById('cozyFocusBar');
    if (!bar) return;
    
    cozyFocusActive = true;
    cozyFocusSeconds = 0;
    
    bar.classList.add('show');
    bar.classList.add('focus-mode');
    
    updateCozyFocusTimer();
    
    if (cozyFocusInterval) clearInterval(cozyFocusInterval);
    cozyFocusInterval = setInterval(function() {
        cozyFocusSeconds++;
        updateCozyFocusTimer();
    }, 1000);
    
    var input = document.getElementById('cozyFocusInput');
    if (input) setTimeout(function() { input.focus(); }, 100);
    
    updateCozyFocusButton(true);
    addSystemMsg('开始专注模式');
}

function stopCozyFocus() {
    cozyFocusActive = false;
    
    if (cozyFocusInterval) {
        clearInterval(cozyFocusInterval);
        cozyFocusInterval = null;
    }
    
    var bar = document.getElementById('cozyFocusBar');
    if (bar) {
        bar.classList.remove('show');
        bar.classList.remove('focus-mode');
    }
    
    var timerEl = document.getElementById('cozyFocusTimerDisplay');
    if (timerEl) timerEl.textContent = '';
    
    updateCozyFocusButton(false);
    
    var minutes = Math.floor(cozyFocusSeconds / 60);
    var seconds = cozyFocusSeconds % 60;
    var timeStr = minutes > 0 ? minutes + '分' + seconds + '秒' : seconds + '秒';
    if (cozyFocusSeconds > 0) {
        addSystemMsg('专注结束，共 ' + timeStr);
        showToast('专注 ' + timeStr);
    }
    
    cozyFocusSeconds = 0;
}

function updateCozyFocusTimer() {
    var timerEl = document.getElementById('cozyFocusTimerDisplay');
    if (!timerEl) {
        var bar = document.getElementById('cozyFocusBar');
        if (bar) {
            var existing = bar.querySelector('.cozy-focus-timer');
            if (existing) existing.remove();
            
            var newTimer = document.createElement('span');
            newTimer.className = 'cozy-focus-timer';
            newTimer.id = 'cozyFocusTimerDisplay';
            newTimer.style.cssText = 'color:#4a3728;font-size:15px;font-weight:bold;min-width:44px;';
            bar.insertBefore(newTimer, bar.firstChild);
            timerEl = newTimer;
        }
    }
    
    if (timerEl) {
        var mins = Math.floor(cozyFocusSeconds / 60);
        var secs = cozyFocusSeconds % 60;
        timerEl.textContent = (mins > 0 ? mins + ':' : '') + (secs < 10 ? '0' : '') + secs;
    }
}

function updateCozyFocusButton(active) {
    var footerBtns = document.querySelectorAll('.cozy-footer button');
    for (var i = 0; i < footerBtns.length; i++) {
        var btn = footerBtns[i];
        if (btn.textContent.indexOf('专注') !== -1 || btn.innerHTML.indexOf('专注') !== -1) {
            if (active) {
                btn.style.background = '#e8a87c';
                btn.style.borderColor = '#4a3728';
                btn.style.color = '#4a3728';
            } else {
                btn.style.background = '';
                btn.style.borderColor = '';
                btn.style.color = '';
            }
            break;
        }
    }
}

function openCozyFocusBar() {
    if (!cozyFocusActive) {
        startCozyFocus();
    } else {
        var bar = document.getElementById('cozyFocusBar');
        if (bar) bar.classList.add('show');
        var input = document.getElementById('cozyFocusInput');
        if (input) setTimeout(function() { input.focus(); }, 100);
    }
}

function closeCozyFocusBar() {
    if (cozyFocusActive) {
        stopCozyFocus();
    } else {
        var bar = document.getElementById('cozyFocusBar');
        if (bar) bar.classList.remove('show');
    }
}

function sendCozyDanmaku() {
    var input = document.getElementById('cozyFocusInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    
    addCozyDanmaku(text, 'me');
    showCozyDanmaku(text, 'me');
    input.value = '';
    
    if (Math.random() < 0.2) {
        var replies = getAllReplies();
        if (replies.length > 0) {
            var reply = replies[Math.floor(Math.random() * replies.length)];
            setTimeout(function() {
                addCozyDanmaku(reply, 'other');
                showCozyDanmaku(reply, 'other');
            }, 800 + Math.random() * 1500);
        }
    }
}

function showCozyDanmaku(text, from) {
    var layer = document.getElementById('cozyDanmakuLayer');
    if (!layer) return;
    
    var el = document.createElement('div');
    el.className = 'cozy-danmaku from-' + from;
    el.textContent = (from === 'me' ? '我：' : '对方：') + text;
    
    var top = 5 + Math.random() * 60;
    el.style.top = top + 'px';
    var duration = 6 + Math.random() * 4;
    el.style.animationDuration = duration + 's';
    el.style.animationDelay = (Math.random() * 0.5) + 's';
    
    layer.appendChild(el);
    setTimeout(function() {
        if (el.parentNode) el.remove();
    }, (duration + 2) * 1000);
}

function renderCozyDanmakuHistory() {
    var history = appData.cozyRoom.focus.danmaku || [];
    var recent = history.slice(-10);
    recent.forEach(function(item) {
        showCozyDanmaku(item.text, item.from);
    });
}

function startCozyDanmakuLoop() {
    if (cozyDanmakuTimer) return;
    cozyDanmakuTimer = setInterval(function() {
        if (Math.random() < 0.05) {
            var replies = getAllReplies();
            if (replies.length > 0) {
                var text = replies[Math.floor(Math.random() * replies.length)];
                addCozyDanmaku(text, 'other');
                showCozyDanmaku(text, 'other');
            }
        }
    }, 10000);
}

function stopCozyDanmakuLoop() {
    if (cozyDanmakuTimer) {
        clearInterval(cozyDanmakuTimer);
        cozyDanmakuTimer = null;
    }
}

// ==================== 弹窗工具 ====================

function openCozyModal(html) {
    var existing = document.getElementById('cozyModalOverlay');
    if (existing) existing.remove();
    
    var overlay = document.createElement('div');
    overlay.id = 'cozyModalOverlay';
    overlay.className = 'cozy-modal-overlay show';
    overlay.innerHTML = '<div class="cozy-modal">' + html + '</div>';
    overlay.onclick = function(e) {
        if (e.target === this) closeCozyModal();
    };
    document.body.appendChild(overlay);
}

function closeCozyModal() {
    var el = document.getElementById('cozyModalOverlay');
    if (el) el.remove();
}

// ==================== 留言板 ====================

function openCozyMessages() {
    var messages = appData.cozyRoom.messages || [];
    
    var html = '<h3>暖屋留言</h3>';
    var subText = messages.length > 0 ? '共 ' + messages.length + ' 条留言' : '写下第一条留言吧';
    html += '<div class="sub">' + subText + '</div>';
    
    html += '<div class="msg-list">';
    if (messages.length === 0) {
        html += '<div style="text-align:center;color:#b8a99a;padding:20px;">还没有留言</div>';
    } else {
        var reversed = messages.slice().reverse();
        for (var i = 0; i < Math.min(reversed.length, 20); i++) {
            var msg = reversed[i];
            var fromLabel = msg.from === 'me' ? '我' : '对方';
            var timeStr = formatTimeShort(msg.time);
            html += '<div class="msg-item">' +
                '<span class="from">' + fromLabel + '</span>' +
                '<span class="time">' + timeStr + '</span>' +
                '<div style="margin-top:4px;">' + escapeHTML(msg.content) + '</div>' +
                '</div>';
        }
        if (messages.length > 20) {
            html += '<div style="text-align:center;color:#b8a99a;font-size:12px;padding:4px;">仅显示最近20条</div>';
        }
    }
    html += '</div>';
    
    html += '<div style="display:flex;gap:6px;margin-top:8px;">' +
        '<input type="text" id="cozyMessageInput" placeholder="写留言..." maxlength="200" style="flex:1;padding:8px 14px;border:2px solid #4a3728;border-radius:16px;font-family:inherit;font-size:13px;background:white;outline:none;" onkeydown="if(event.key===\'Enter\')sendCozyMessage()">' +
        '<button onclick="sendCozyMessage()" style="padding:8px 18px;border-radius:16px;border:2px solid #4a3728;background:#f5ede4;color:#4a3728;font-family:inherit;font-size:13px;cursor:pointer;">发送</button>' +
        '</div>';
    
    html += '<button onclick="closeCozyModal()" style="margin-top:12px;padding:8px 24px;border-radius:20px;border:2px solid #4a3728;background:transparent;font-family:inherit;font-size:13px;cursor:pointer;color:#4a3728;">关闭</button>';
    
    openCozyModal(html);
    
    setTimeout(function() {
        var input = document.getElementById('cozyMessageInput');
        if (input) input.focus();
    }, 200);
}

function sendCozyMessage() {
    var input = document.getElementById('cozyMessageInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) {
        showToast('请输入留言内容');
        return;
    }
    
    addCozyMessage(text, 'me');
    input.value = '';
    openCozyMessages();
    addSystemMsg('我在暖屋留了言：' + text);
    
    if (Math.random() < 0.1) {
        var replies = getAllReplies();
        if (replies.length > 0) {
            var reply = replies[Math.floor(Math.random() * replies.length)];
            setTimeout(function() {
                addCozyMessage(reply, 'other');
                showToast('对方在暖屋回复了留言');
                addSystemMsg('对方在暖屋回复了留言：' + reply);
            }, 2000 + Math.random() * 2000);
        }
    }
}

// ==================== 导出到全局 ====================
window.openCozySpace = openCozySpace;
window.closeCozySpace = closeCozySpace;
window.sendCozyDanmaku = sendCozyDanmaku;
window.toggleCozyFocus = toggleCozyFocus;
window.closeCozyFocusBar = closeCozyFocusBar;
window.openCozyModal = openCozyModal;
window.closeCozyModal = closeCozyModal;
window.openCozyMessages = openCozyMessages;
window.sendCozyMessage = sendCozyMessage;
window.toggleCozyMusic = toggleCozyMusic;
window.cozyMusicPlayPause = cozyMusicPlayPause;
window.cozyMusicNext = cozyMusicNext;
window.cozyMusicPrev = cozyMusicPrev;
window.updateCozyMusicDisplay = updateCozyMusicDisplay;
window.ensureCozyDefaultSetup = ensureCozyDefaultSetup;
window.renderCozyRoom = renderCozyRoom;

console.log('暖屋主界面已加载（Canvas 手绘版）');
