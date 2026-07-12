// ==================== 暖屋主界面（墙/窗/地面/天气版 - 墙面和天气分离） ====================

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
    
    renderCozyRoom();
    renderCozyDanmakuHistory();
    startCozyDanmakuLoop();
    updateCozyMusicDisplay();
    updateWeatherDisplay();
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
    
    // 墙面（用户选择的颜色）- 独立
    var wallLayer = document.createElement('div');
    wallLayer.className = 'cozy-wall-layer wall-' + appData.cozyRoom.wall;
    wallLayer.id = 'cozyWallLayer';
    body.appendChild(wallLayer);
    
    // 天气特效（在窗户后面/外面）- 独立
    var effectContainer = document.createElement('div');
    effectContainer.id = 'cozyWeatherEffect';
    body.appendChild(effectContainer);
    
    // 窗户（SVG手绘）
    var windowEl = document.createElement('div');
    windowEl.className = 'cozy-window';
    windowEl.id = 'cozyWindow';
    body.appendChild(windowEl);
    renderWindow();
    
    // 天气效果在窗户后面渲染（先渲染天气再渲染窗户，天气在窗户后面）
    renderWeatherEffect();
    
    // 地面
    var floor = document.createElement('div');
    floor.className = 'cozy-floor floor-' + appData.cozyRoom.floor;
    body.appendChild(floor);
    
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
}

// ==================== 渲染窗户（SVG手绘） ====================

function renderWindow() {
    var container = document.getElementById('cozyWindow');
    if (!container) return;
    
    var style = appData.cozyRoom.window || 'arch';
    var svg = '';
    
    if (style === 'arch') {
        svg = `
            <svg viewBox="0 0 200 150" style="width:100%;height:100%;">
                <rect x="10" y="10" width="180" height="130" fill="rgba(200,220,240,0.06)"/>
                <path d="M10 40 Q10 10 40 10 L160 10 Q190 10 190 40 L190 140 L10 140 Z" 
                      stroke="#4a3728" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 44 Q16 16 44 16 L156 16 Q184 16 184 44 L184 134 L16 134 Z" 
                      stroke="#4a3728" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                <path d="M40 16 Q100 0 160 16" stroke="#4a3728" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                <path d="M70 16 L70 134" stroke="#4a3728" stroke-width="2" fill="none" stroke-linecap="round"/>
                <path d="M130 16 L130 134" stroke="#4a3728" stroke-width="2" fill="none" stroke-linecap="round"/>
                <path d="M10 65 L190 65" stroke="#4a3728" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                <path d="M10 100 L190 100" stroke="#4a3728" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                <path d="M30 30 L60 30 L40 60 Z" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" fill="rgba(255,255,255,0.05)"/>
                <path d="M5 140 L195 140" stroke="#4a3728" stroke-width="3.5" stroke-linecap="round"/>
                <path d="M10 144 L190 144" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M30 142 L170 142" stroke="#4a3728" stroke-width="1" stroke-linecap="round"/>
            </svg>
        `;
    } else if (style === 'grid') {
        svg = `
            <svg viewBox="0 0 200 150" style="width:100%;height:100%;">
                <rect x="10" y="10" width="180" height="130" fill="rgba(200,220,240,0.06)"/>
                <path d="M10 10 L190 10 L190 140 L10 140 Z" 
                      stroke="#4a3728" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 16 L184 16 L184 134 L16 134 Z" 
                      stroke="#4a3728" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                <path d="M60 16 L60 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M100 16 L100 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M140 16 L140 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M16 50 L184 50" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M16 84 L184 84" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M16 118 L184 118" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M25 25 L55 25 L40 50 Z" stroke="rgba(255,255,255,0.12)" fill="rgba(255,255,255,0.04)"/>
                <path d="M5 140 L195 140" stroke="#4a3728" stroke-width="3.5" stroke-linecap="round"/>
                <path d="M10 144 L190 144" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
    } else if (style === 'french') {
        svg = `
            <svg viewBox="0 0 200 150" style="width:100%;height:100%;">
                <rect x="10" y="10" width="180" height="130" fill="rgba(200,220,240,0.06)"/>
                <path d="M10 10 L190 10 L190 140 L10 140 Z" 
                      stroke="#4a3728" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 16 L184 16 L184 134 L16 134 Z" 
                      stroke="#4a3728" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                <path d="M100 16 L100 134" stroke="#4a3728" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M16 75 L184 75" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M40 16 Q70 10 100 16 Q130 10 160 16" stroke="#4a3728" stroke-width="1" fill="none" stroke-linecap="round"/>
                <path d="M40 134 Q70 140 100 134 Q130 140 160 134" stroke="#4a3728" stroke-width="1" fill="none" stroke-linecap="round"/>
                <path d="M25 30 L50 30 L38 55 Z" stroke="rgba(255,255,255,0.12)" fill="rgba(255,255,255,0.04)"/>
                <path d="M125 30 L150 30 L138 55 Z" stroke="rgba(255,255,255,0.08)" fill="rgba(255,255,255,0.03)"/>
                <path d="M5 140 L195 140" stroke="#4a3728" stroke-width="3" stroke-linecap="round"/>
                <path d="M10 144 L190 144" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
        `;
    } else if (style === 'bay') {
        svg = `
            <svg viewBox="0 0 200 150" style="width:100%;height:100%;">
                <rect x="10" y="10" width="180" height="130" fill="rgba(200,220,240,0.06)"/>
                <path d="M5 20 L195 20 L195 140 L5 140 Z" 
                      stroke="#4a3728" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15 28 L185 28 L185 134 L15 134 Z" 
                      stroke="#4a3728" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                <path d="M15 28 L185 28" stroke="#4a3728" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M70 28 L70 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M130 28 L130 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M15 70 L185 70" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M15 105 L185 105" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M0 140 L200 140" stroke="#4a3728" stroke-width="4" stroke-linecap="round"/>
                <path d="M5 146 L195 146" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M30 142 L170 142" stroke="#4a3728" stroke-width="1" stroke-linecap="round"/>
                <path d="M25 35 L50 35 L38 60 Z" stroke="rgba(255,255,255,0.12)" fill="rgba(255,255,255,0.04)"/>
            </svg>
        `;
    } else if (style === 'round') {
        svg = `
            <svg viewBox="0 0 200 150" style="width:100%;height:100%;">
                <rect x="10" y="10" width="180" height="130" fill="rgba(200,220,240,0.04)"/>
                <circle cx="100" cy="75" r="60" stroke="#4a3728" stroke-width="3.5" fill="none"/>
                <circle cx="100" cy="75" r="54" stroke="#4a3728" stroke-width="1.5" fill="none"/>
                <path d="M100 21 L100 129" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M46 75 L154 75" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M70 28 Q85 45 100 45 Q115 45 130 28" stroke="#4a3728" stroke-width="1" fill="none" stroke-linecap="round"/>
                <path d="M70 122 Q85 105 100 105 Q115 105 130 122" stroke="#4a3728" stroke-width="1" fill="none" stroke-linecap="round"/>
                <path d="M70 40 L95 40 L82 65 Z" stroke="rgba(255,255,255,0.12)" fill="rgba(255,255,255,0.04)"/>
                <path d="M20 130 L180 130" stroke="#4a3728" stroke-width="3" stroke-linecap="round"/>
                <path d="M25 134 L175 134" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
        `;
    } else if (style === 'gothic') {
        svg = `
            <svg viewBox="0 0 200 150" style="width:100%;height:100%;">
                <rect x="10" y="10" width="180" height="130" fill="rgba(200,220,240,0.06)"/>
                <path d="M10 50 L10 140 L190 140 L190 50 Q190 20 170 10 Q150 0 130 10 Q110 20 100 5 Q90 20 70 10 Q50 0 30 10 Q10 20 10 50 Z" 
                      stroke="#4a3728" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18 55 L18 134 L182 134 L182 55 Q182 28 166 20 Q150 12 134 20 Q118 28 100 16 Q82 28 66 20 Q50 12 34 20 Q18 28 18 55 Z" 
                      stroke="#4a3728" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M100 5 L100 16" stroke="#4a3728" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M60 14 Q80 8 100 14 Q120 8 140 14" stroke="#4a3728" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                <path d="M70 22 L70 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M130 22 L130 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M18 70 L182 70" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M18 105 L182 105" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M30 30 L55 30 L42 55 Z" stroke="rgba(255,255,255,0.12)" fill="rgba(255,255,255,0.04)"/>
                <path d="M5 140 L195 140" stroke="#4a3728" stroke-width="3.5" stroke-linecap="round"/>
                <path d="M10 144 L190 144" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
    }
    
    container.innerHTML = svg;
}

// ==================== 渲染房间 ====================

function renderCozyRoom() {
    // 墙面 - 用户选择的颜色
    var wallLayer = document.getElementById('cozyWallLayer');
    if (wallLayer) {
        wallLayer.className = 'cozy-wall-layer wall-' + appData.cozyRoom.wall;
    }
    
    // 窗户
    renderWindow();
    
    // 地面
    var floor = document.querySelector('.cozy-floor');
    if (floor) {
        floor.className = 'cozy-floor floor-' + appData.cozyRoom.floor;
    }
    
    // 天气
    updateWeatherDisplay();
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

// ==================== 天气（独立于墙面） ====================

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
    container.className = '';
    
    // ===== 天气元素在窗户外面 =====
    // 注意：天气元素的位置在窗户的上方和两侧，不遮挡窗户
    
    if (weather === 'sunny') {
        container.className = 'sunny-container';
        container.innerHTML = `
            <div class="sun"></div>
            <div class="sun-ray"></div>
            <div class="sun-ray"></div>
            <div class="sun-ray"></div>
            <div class="sun-ray"></div>
            <div class="sun-ray"></div>
            <div class="sun-ray"></div>
            <div class="sun-ray"></div>
            <div class="sun-ray"></div>
        `;
        
    } else if (weather === 'cloudy') {
        container.className = 'cloudy-container';
        container.innerHTML = `
            <div class="cloud"></div>
            <div class="cloud"></div>
            <div class="cloud"></div>
        `;
        
    } else if (weather === 'rainy') {
        container.className = 'rain-container';
        for (var r = 0; r < 60; r++) {
            var drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = Math.random() * 100 + '%';
            drop.style.height = (6 + Math.random() * 14) + 'px';
            drop.style.animationDuration = (0.3 + Math.random() * 0.5) + 's';
            drop.style.animationDelay = Math.random() * 2 + 's';
            container.appendChild(drop);
        }
        
    } else if (weather === 'snowy') {
        container.className = 'snow-container';
        for (var s = 0; s < 40; s++) {
            var flake = document.createElement('div');
            flake.className = 'snow-flake';
            flake.textContent = '❄';
            flake.style.left = Math.random() * 100 + '%';
            flake.style.fontSize = (8 + Math.random() * 12) + 'px';
            flake.style.animationDuration = (5 + Math.random() * 7) + 's';
            flake.style.animationDelay = Math.random() * 5 + 's';
            flake.style.opacity = 0.2 + Math.random() * 0.3;
            container.appendChild(flake);
        }
        
    } else if (weather === 'night') {
        container.className = 'night-container';
        container.innerHTML = `
            <div class="moon"></div>
            <div class="star"></div>
            <div class="star"></div>
            <div class="star"></div>
            <div class="star"></div>
            <div class="star"></div>
            <div class="star"></div>
            <div class="star"></div>
            <div class="star"></div>
            <div class="star"></div>
            <div class="star"></div>
            <div class="star"></div>
            <div class="star"></div>
            <div class="star"></div>
            <div class="star"></div>
        `;
        
    } else if (weather === 'sunset') {
        container.className = 'sunset-container';
        container.innerHTML = `
            <div class="setting-sun"></div>
            <div class="sunset-cloud"></div>
            <div class="sunset-cloud"></div>
            <div class="sunset-cloud"></div>
        `;
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
            showToast('对方更换了 ' + p.name);
            p.isNew = false;
        });
        saveData();
    }
}

function updateWeatherDisplay() {
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
    renderWeatherEffect();
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
window.updateWeatherDisplay = updateWeatherDisplay;
window.renderWindow = renderWindow;

console.log('暖屋主界面已加载');
