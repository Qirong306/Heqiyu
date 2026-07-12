// ==================== 暖屋主界面（优化版：CSS图形家具 + 嵌入音乐） ====================

var cozyFocusActive = false;
var cozyFocusTimer = null;
var cozyDanmakuTimer = null;
var cozyMusicPlayerOpen = false;

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
    
    renderCozyFurniture();
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
        room.weather = 'sunny';
        room.window = 'arch';
        room.floor = 'wood';
        room.sofa = 'fabric';
        room.bed = 'wooden';
        room.bookshelf = 'tall';
        room.desk = 'simple';
        room.flower = 'wicker';
        room.doll = 'bear';
        room.pillow = 'round';
        room.warmth = 100;
        room.purchased = {
            weather: ['sunny'],
            window: ['arch'],
            floor: ['wood'],
            sofa: ['fabric'],
            bed: ['wooden'],
            bookshelf: ['tall'],
            desk: ['simple'],
            flower: ['wicker'],
            doll: ['bear'],
            pillow: ['round']
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
    
    // ---- 顶部栏（含迷你音乐播放器） ----
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
    
    var weatherLayer = document.createElement('div');
    weatherLayer.className = 'cozy-weather-layer weather-' + appData.cozyRoom.weather;
    weatherLayer.id = 'cozyWeatherLayer';
    body.appendChild(weatherLayer);
    
    var effectContainer = document.createElement('div');
    effectContainer.id = 'cozyWeatherEffect';
    body.appendChild(effectContainer);
    renderWeatherEffect();
    
    var windowEl = document.createElement('div');
    windowEl.className = 'cozy-window';
    windowEl.innerHTML = '<div class="window-frame ' + appData.cozyRoom.window + '"><div class="window-view"><div class="window-glare"></div></div></div>';
    body.appendChild(windowEl);
    
    var floor = document.createElement('div');
    floor.className = 'cozy-floor floor-' + appData.cozyRoom.floor;
    body.appendChild(floor);
    
    var furniture = document.createElement('div');
    furniture.className = 'cozy-furniture';
    furniture.id = 'cozyFurniture';
    body.appendChild(furniture);
    
    var danmakuLayer = document.createElement('div');
    danmakuLayer.className = 'cozy-danmaku-layer';
    danmakuLayer.id = 'cozyDanmakuLayer';
    body.appendChild(danmakuLayer);
    
    var focusBar = document.createElement('div');
    focusBar.className = 'cozy-focus-bar';
    focusBar.id = 'cozyFocusBar';
    focusBar.innerHTML = 
        '<input type="text" id="cozyFocusInput" placeholder="说点什么..." maxlength="50" onkeydown="if(event.key===\'Enter\')sendCozyDanmaku()">' +
        '<button onclick="sendCozyDanmaku()">发送</button>' +
        '<button onclick="closeCozyFocusBar()" class="cozy-focus-close">✕</button>';
    body.appendChild(focusBar);
    
    overlay.appendChild(body);
    
    // ---- 底部功能栏（删除了「设置」按钮） ----
    var footer = document.createElement('div');
    footer.className = 'cozy-footer';
    footer.innerHTML = 
        '<button onclick="openCozyShop()"><span class="icon-shop"></span>商城</button>' +
        '<button onclick="openCozyMessages()"><span class="icon-msg"></span>留言</button>' +
        '<button onclick="toggleCozyFocus()"><span class="icon-focus"></span>专注</button>' +
        '<button onclick="openCozyDaily()"><span class="icon-gift"></span>奖励</button>';
    overlay.appendChild(footer);
    
    document.body.appendChild(overlay);
}

// ==================== 渲染家具（CSS 图形版，无文字） ====================

function renderCozyFurniture() {
    var container = document.getElementById('cozyFurniture');
    if (!container) return;
    
    var furnitureMap = {
        sofa: { class: 'f-sofa' },
        bed: { class: 'f-bed' },
        bookshelf: { class: 'f-bookshelf' },
        desk: { class: 'f-desk' },
        flower: { class: 'f-flower' },
        doll: { class: 'f-doll' },
        pillow: { class: 'f-pillow' }
    };
    
    var html = '';
    for (var key in furnitureMap) {
        var currentId = appData.cozyRoom[key] || '';
        var owned = isCozyOwned(key, currentId);
        
        html += '<div class="furniture-item ' + furnitureMap[key].class + '" onclick="openCozyItemDetail(\'' + key + '\')" data-category="' + key + '">' +
            '<div class="f-graphic f-graphic-' + key + ' f-graphic-' + key + '-' + currentId + '"></div>' +
            (owned ? '' : '<span class="f-badge">?</span>') +
            '</div>';
    }
    
    container.innerHTML = html;
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

// ==================== 天气 ====================

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

function renderWeatherEffect() {
    var container = document.getElementById('cozyWeatherEffect');
    if (!container) return;
    
    var weather = appData.cozyRoom.weather;
    container.innerHTML = '';
    
    if (weather === 'rainy') {
        container.className = 'rain-container';
        for (var i = 0; i < 60; i++) {
            var drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = Math.random() * 100 + '%';
            drop.style.height = (10 + Math.random() * 20) + 'px';
            drop.style.animationDuration = (0.5 + Math.random() * 0.8) + 's';
            drop.style.animationDelay = Math.random() * 2 + 's';
            container.appendChild(drop);
        }
    } else if (weather === 'snowy') {
        container.className = 'snow-container';
        for (var j = 0; j < 40; j++) {
            var flake = document.createElement('div');
            flake.className = 'snow-flake';
            flake.textContent = '❖';
            flake.style.left = Math.random() * 100 + '%';
            flake.style.fontSize = (10 + Math.random() * 16) + 'px';
            flake.style.animationDuration = (4 + Math.random() * 6) + 's';
            flake.style.animationDelay = Math.random() * 4 + 's';
            container.appendChild(flake);
        }
    } else if (weather === 'night') {
        container.className = 'star-container';
        for (var k = 0; k < 30; k++) {
            var star = document.createElement('div');
            star.className = 'star';
            star.textContent = '✦';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = (10 + Math.random() * 40) + '%';
            star.style.fontSize = (8 + Math.random() * 12) + 'px';
            star.style.animationDelay = Math.random() * 2 + 's';
            container.appendChild(star);
        }
    } else {
        container.className = '';
    }
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
            showToast('对方添置了 ' + p.name);
            p.isNew = false;
        });
        saveData();
    }
}

function updateWeather() {
    var layer = document.getElementById('cozyWeatherLayer');
    if (layer) {
        layer.className = 'cozy-weather-layer weather-' + appData.cozyRoom.weather;
    }
    var label = document.getElementById('cozyWeatherLabel');
    if (label) label.textContent = getWeatherLabel();
    renderWeatherEffect();
}

// ==================== 专注模式（计时 + 弹幕，暖屋可见） ====================

var cozyFocusSeconds = 0;
var cozyFocusInterval = null;

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
            newTimer.style.cssText = 'color:white;font-size:16px;font-weight:bold;min-width:60px;';
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
                btn.style.borderColor = '#e8a87c';
                btn.style.color = 'white';
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

// ==================== 家具详情 ====================

function openCozyItemDetail(category) {
    var current = appData.cozyRoom[category] || '';
    var label = getCozyLabel(category);
    var options = getCozyOptions(category);
    
    var html = '<h3>' + label + '</h3>';
    html += '<div class="sub">点击切换样式</div>';
    html += '<div style="display:flex;flex-direction:column;gap:6px;">';
    
    options.forEach(function(opt) {
        var owned = isCozyOwned(category, opt.id);
        var active = (current === opt.id);
        var priceText = opt.price === 0 ? '初始' : opt.price + '温暖值';
        
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:' + 
            (active ? '#e8d5c4' : '#fffcf8') + 
            ';border-radius:12px;border:2px solid ' + (active ? '#d4b8a0' : '#e8d5c4') + ';">' +
            '<span>' + opt.name + 
            (active ? ' ✓' : '') + 
            ' <span style="font-size:11px;color:#8b7355;">' + priceText + '</span></span>' +
            (owned ? 
                '<button onclick="switchCozyStyleFromDetail(\'' + category + '\',\'' + opt.id + '\')" style="padding:4px 14px;border-radius:14px;border:none;background:#c8b8a8;color:white;font-family:inherit;font-size:12px;cursor:pointer;">' + (active ? '使用中' : '切换') + '</button>' :
                '<button onclick="buyCozyItemFromDetail(\'' + category + '\',\'' + opt.id + '\')" style="padding:4px 14px;border-radius:14px;border:none;background:#e8a87c;color:white;font-family:inherit;font-size:12px;cursor:pointer;">购买</button>'
            ) +
            '</div>';
    });
    
    html += '</div>';
    html += '<button onclick="closeCozyModal()" style="margin-top:12px;padding:8px 24px;border-radius:20px;border:2px solid #e8d5c4;background:transparent;font-family:inherit;font-size:13px;cursor:pointer;color:#4a3728;">关闭</button>';
    
    openCozyModal(html);
}

function switchCozyStyleFromDetail(category, id) {
    if (switchCozyStyle(category, id)) {
        renderCozyFurniture();
        if (category === 'weather') updateWeather();
        closeCozyModal();
        showToast('已切换');
    }
}

function buyCozyItemFromDetail(category, id) {
    if (buyCozyItem(category, id)) {
        renderCozyFurniture();
        updateWarmthDisplay();
        if (category === 'weather') updateWeather();
        closeCozyModal();
    }
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
        '<input type="text" id="cozyMessageInput" placeholder="写留言..." maxlength="200" style="flex:1;padding:8px 14px;border:2px solid #e8d5c4;border-radius:16px;font-family:inherit;font-size:13px;background:white;outline:none;" onkeydown="if(event.key===\'Enter\')sendCozyMessage()">' +
        '<button onclick="sendCozyMessage()" style="padding:8px 18px;border-radius:16px;border:none;background:#e8a87c;color:white;font-family:inherit;font-size:13px;cursor:pointer;">发送</button>' +
        '</div>';
    
    html += '<button onclick="closeCozyModal()" style="margin-top:12px;padding:8px 24px;border-radius:20px;border:2px solid #e8d5c4;background:transparent;font-family:inherit;font-size:13px;cursor:pointer;color:#4a3728;">关闭</button>';
    
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

// ==================== 导出到全局 ====================
window.openCozySpace = openCozySpace;
window.closeCozySpace = closeCozySpace;
window.openCozyItemDetail = openCozyItemDetail;
window.switchCozyStyleFromDetail = switchCozyStyleFromDetail;
window.buyCozyItemFromDetail = buyCozyItemFromDetail;
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

console.log('暖屋主界面已加载（优化版：CSS图形家具 + 嵌入音乐）');
