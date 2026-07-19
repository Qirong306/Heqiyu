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
    
    document.body.style.overflow = 'hidden';
    
    renderCozyRoom();
    renderCozyDanmakuHistory();
    startCozyDanmakuLoop();
    updateCozyMusicDisplay();
}

function closeCozySpace() {
    var overlay = document.getElementById('cozyOverlay');
    if (overlay) {
        overlay.remove();
    }
    document.body.style.overflow = '';
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

// ==================== 渲染主界面（全屏） ====================

function renderCozySpace() {
    var existing = document.getElementById('cozyOverlay');
    if (existing) existing.remove();
    
    var overlay = document.createElement('div');
    overlay.id = 'cozyOverlay';
    overlay.className = 'fullscreen-overlay active';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:var(--bg);z-index:500;display:flex;flex-direction:column;';
    
    // ---- 顶部栏 ----
    var header = document.createElement('div');
    header.className = 'fullscreen-header';
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--header-bg);border-bottom:1.5px solid var(--border);flex-shrink:0;min-height:48px;';
    header.innerHTML = 
        '<div style="display:flex;align-items:center;gap:8px;">' +
            '<button onclick="closeCozySpace()" class="fullscreen-back" style="background:none;border:none;cursor:pointer;color:var(--text);padding:4px 6px;display:flex;align-items:center;font-family:var(--font-main);font-size:14px;">' +
                '<span class="back-arrow" style="display:inline-block;width:20px;height:20px;position:relative;">' +
                    '<span style="position:absolute;top:50%;left:2px;transform:translateY(-50%);width:10px;height:2px;background:var(--text);border-radius:1px;"></span>' +
                    '<span style="position:absolute;top:50%;left:2px;transform:translateY(-50%) rotate(-45deg);width:6px;height:6px;border-left:2px solid var(--text);border-bottom:2px solid var(--text);border-radius:0 0 0 2px;"></span>' +
                '</span>' +
                ' 返回' +
            '</button>' +
            '<span class="fullscreen-title" style="font-size:17px;font-weight:400;color:var(--text);letter-spacing:1px;">暖屋</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
            '<span style="font-size:13px;color:var(--text-secondary);" id="cozyWarmthDisplay">温暖值: ' + (appData.cozyRoom.warmth || 100) + '</span>' +
            '<button onclick="closeCozySpace()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text-secondary);padding:4px 8px;">✕</button>' +
        '</div>';
    overlay.appendChild(header);
    
    // ---- 暖屋主体（Canvas 区域） ----
    var body = document.createElement('div');
    body.className = 'fullscreen-body';
    body.id = 'cozyBody';
    body.style.cssText = 'flex:1;position:relative;overflow:hidden;padding:0;';
    
    // Canvas 容器 - 铺满整个 body
    var canvasContainer = document.createElement('div');
    canvasContainer.id = 'cozyCanvasContainer';
    canvasContainer.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;z-index:0;';
    body.appendChild(canvasContainer);
    
    // 弹幕层
    var danmakuLayer = document.createElement('div');
    danmakuLayer.className = 'cozy-danmaku-layer';
    danmakuLayer.id = 'cozyDanmakuLayer';
    danmakuLayer.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;pointer-events:none;overflow:hidden;';
    body.appendChild(danmakuLayer);
    
    // 专注输入条
    var focusBar = document.createElement('div');
    focusBar.className = 'cozy-focus-bar';
    focusBar.id = 'cozyFocusBar';
    focusBar.style.cssText = 'position:absolute;bottom:70px;left:50%;transform:translateX(-50%);z-index:2;display:none;align-items:center;gap:6px;background:var(--panel-bg);padding:8px 12px;border-radius:20px;border:2px solid var(--border);width:80%;max-width:320px;';
    focusBar.innerHTML = 
        '<span class="cozy-focus-timer" id="cozyFocusTimerDisplay" style="font-size:14px;font-weight:bold;color:var(--text);min-width:40px;"></span>' +
        '<input type="text" id="cozyFocusInput" placeholder="说点什么..." maxlength="50" style="flex:1;border:none;background:transparent;font-family:var(--font-main);font-size:14px;color:var(--text);outline:none;padding:4px 0;" onkeydown="if(event.key===\'Enter\')sendCozyDanmaku()">' +
        '<button onclick="sendCozyDanmaku()" style="padding:4px 14px;border-radius:14px;border:none;background:var(--accent);color:var(--text);font-family:var(--font-main);font-size:13px;cursor:pointer;">发送</button>' +
        '<button onclick="closeCozyFocusBar()" style="background:none;border:none;font-size:16px;cursor:pointer;color:var(--text-secondary);padding:0 4px;">✕</button>';
    body.appendChild(focusBar);
    
    overlay.appendChild(body);
    
    // ---- 底部功能栏 ----
    var footer = document.createElement('div');
    footer.className = 'cozy-footer';
    footer.style.cssText = 'display:flex;justify-content:space-around;align-items:center;padding:8px 12px;background:var(--header-bg);border-top:1.5px solid var(--border);flex-shrink:0;';
    footer.innerHTML = 
        '<button onclick="openCozyShop()" style="background:none;border:none;cursor:pointer;font-family:var(--font-main);font-size:13px;color:var(--text);display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 8px;">' +
            '<span style="font-size:18px;">🏪</span>' +
            '<span>商城</span>' +
        '</button>' +
        '<button onclick="openCozyMessages()" style="background:none;border:none;cursor:pointer;font-family:var(--font-main);font-size:13px;color:var(--text);display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 8px;">' +
            '<span style="font-size:18px;">💬</span>' +
            '<span>留言</span>' +
        '</button>' +
        '<button onclick="toggleCozyFocus()" style="background:none;border:none;cursor:pointer;font-family:var(--font-main);font-size:13px;color:var(--text);display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 8px;" id="cozyFocusBtn">' +
            '<span style="font-size:18px;">🎯</span>' +
            '<span>专注</span>' +
        '</button>' +
        '<button onclick="openCozyDaily()" style="background:none;border:none;cursor:pointer;font-family:var(--font-main);font-size:13px;color:var(--text);display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 8px;">' +
            '<span style="font-size:18px;">🎁</span>' +
            '<span>奖励</span>' +
        '</button>';
    overlay.appendChild(footer);
    
    document.body.appendChild(overlay);
    
    // 渲染 Canvas
    setTimeout(function() {
        if (typeof renderCozyCanvas === 'function') {
            renderCozyCanvas();
        }
    }, 100);
}

// ==================== 渲染房间（刷新用） ====================

function renderCozyRoom() {
    updateWarmthDisplay();
    if (typeof renderCozyCanvas === 'function') {
        setTimeout(renderCozyCanvas, 50);
    }
}

// ==================== 更新温暖值显示 ====================

function updateWarmthDisplay() {
    var el = document.getElementById('cozyWarmthDisplay');
    if (el) {
        el.textContent = '温暖值: ' + (appData.cozyRoom.warmth || 100);
    }
}

// ==================== 其他函数 ====================

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
    
    bar.style.display = 'flex';
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
        bar.style.display = 'none';
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
    if (!timerEl) return;
    
    var mins = Math.floor(cozyFocusSeconds / 60);
    var secs = cozyFocusSeconds % 60;
    if (mins > 0) {
        timerEl.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
    } else {
        timerEl.textContent = secs + 's';
    }
}

function updateCozyFocusButton(active) {
    var btn = document.getElementById('cozyFocusBtn');
    if (!btn) return;
    if (active) {
        btn.style.color = 'var(--accent-dark)';
    } else {
        btn.style.color = '';
    }
}

function openCozyFocusBar() {
    if (!cozyFocusActive) {
        startCozyFocus();
    } else {
        var bar = document.getElementById('cozyFocusBar');
        if (bar) bar.style.display = 'flex';
        var input = document.getElementById('cozyFocusInput');
        if (input) setTimeout(function() { input.focus(); }, 100);
    }
}

function closeCozyFocusBar() {
    if (cozyFocusActive) {
        stopCozyFocus();
    } else {
        var bar = document.getElementById('cozyFocusBar');
        if (bar) bar.style.display = 'none';
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
    el.style.cssText = 'position:absolute;white-space:nowrap;font-size:14px;color:' + (from === 'me' ? '#ffeaa7' : '#ffffff') + ';text-shadow:0 0 8px rgba(0,0,0,0.5);pointer-events:none;animation:cozyDanmakuMove ' + (6 + Math.random() * 4) + 's linear forwards;top:' + (5 + Math.random() * 60) + '%;';
    
    layer.appendChild(el);
    setTimeout(function() {
        if (el.parentNode) el.remove();
    }, 10000);
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
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);z-index:600;display:flex;justify-content:center;align-items:center;';
    overlay.innerHTML = '<div style="background:var(--panel-bg);border-radius:22px;width:88%;max-width:400px;max-height:78vh;overflow-y:auto;padding:20px;box-shadow:0 12px 40px rgba(0,0,0,0.15);">' + html + '</div>';
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
    
    var html = '<h3 style="text-align:center;font-size:19px;margin-bottom:6px;color:var(--text);letter-spacing:2px;font-weight:400;">暖屋留言</h3>';
    var subText = messages.length > 0 ? '共 ' + messages.length + ' 条留言' : '写下第一条留言吧';
    html += '<div style="text-align:center;font-size:12px;color:var(--text-system);margin-bottom:16px;letter-spacing:1px;">' + subText + '</div>';
    
    html += '<div style="max-height:300px;overflow-y:auto;margin-bottom:12px;">';
    if (messages.length === 0) {
        html += '<div style="text-align:center;color:var(--text-system);padding:20px;">还没有留言</div>';
    } else {
        var reversed = messages.slice().reverse();
        for (var i = 0; i < Math.min(reversed.length, 20); i++) {
            var msg = reversed[i];
            var fromLabel = msg.from === 'me' ? '我' : '对方';
            var timeStr = formatTimeShort(msg.time);
            html += '<div style="background:var(--item-bg);border-radius:10px;padding:10px;margin-bottom:6px;border:1px solid var(--border);">' +
                '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);">' +
                '<span style="font-weight:bold;color:var(--accent);">' + fromLabel + '</span>' +
                '<span>' + timeStr + '</span>' +
                '</div>' +
                '<div style="margin-top:4px;font-size:13px;color:var(--text);">' + escapeHTML(msg.content) + '</div>' +
                '</div>';
        }
        if (messages.length > 20) {
            html += '<div style="text-align:center;color:var(--text-system);font-size:12px;padding:4px;">仅显示最近20条</div>';
        }
    }
    html += '</div>';
    
    html += '<div style="display:flex;gap:6px;margin-top:8px;">' +
        '<input type="text" id="cozyMessageInput" placeholder="写留言..." maxlength="200" style="flex:1;padding:8px 14px;border:2px solid var(--border);border-radius:16px;font-family:var(--font-main);font-size:13px;background:var(--input-box);color:var(--text);outline:none;" onkeydown="if(event.key===\'Enter\')sendCozyMessage()">' +
        '<button onclick="sendCozyMessage()" style="padding:8px 18px;border-radius:16px;border:none;background:var(--accent);color:var(--text);font-family:var(--font-main);font-size:13px;cursor:pointer;">发送</button>' +
        '</div>';
    
    html += '<button onclick="closeCozyModal()" style="display:block;margin:14px auto 0;padding:8px 24px;border:1.5px solid var(--border);border-radius:20px;background:var(--item-bg);cursor:pointer;font-size:13px;color:var(--text-secondary);font-family:var(--font-main);letter-spacing:1px;">关闭</button>';
    
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

// ==================== 暖屋弹幕数据 ====================

function addCozyDanmaku(text, from) {
    if (!appData.cozyRoom.focus) {
        appData.cozyRoom.focus = { danmaku: [] };
    }
    appData.cozyRoom.focus.danmaku.push({ text: text, from: from, time: Date.now() });
    if (appData.cozyRoom.focus.danmaku.length > 100) {
        appData.cozyRoom.focus.danmaku.splice(0, 20);
    }
    saveData();
}

function addCozyMessage(text, from) {
    if (!appData.cozyRoom.messages) {
        appData.cozyRoom.messages = [];
    }
    appData.cozyRoom.messages.push({ content: text, from: from, time: Date.now() });
    if (appData.cozyRoom.messages.length > 50) {
        appData.cozyRoom.messages.splice(0, 10);
    }
    saveData();
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
        playBtn.textContent = isPlaying ? '⏹' : '▶';
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

// ==================== 暖屋商城（占位） ====================

function openCozyShop() {
    showToast('暖屋商城开发中...');
}

// ==================== 暖屋每日奖励（占位） ====================

function openCozyDaily() {
    showToast('暖屋每日奖励开发中...');
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
window.updateWarmthDisplay = updateWarmthDisplay;
window.openCozyShop = openCozyShop;
window.openCozyDaily = openCozyDaily;

console.log('暖屋主界面已加载（全屏修复版）');
