// ==================== 暖屋主界面（墙/窗/地面/天气版 - 手绘线稿） ====================

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
    
    // 墙面（背景）
    var wallLayer = document.createElement('div');
    wallLayer.className = 'cozy-wall-layer wall-' + appData.cozyRoom.wall;
    wallLayer.id = 'cozyWallLayer';
    body.appendChild(wallLayer);
    
    // 天气特效
    var effectContainer = document.createElement('div');
    effectContainer.id = 'cozyWeatherEffect';
    body.appendChild(effectContainer);
    renderWeatherEffect();
    
    // 窗户（用SVG手绘线稿）
    var windowEl = document.createElement('div');
    windowEl.className = 'cozy-window';
    windowEl.id = 'cozyWindow';
    body.appendChild(windowEl);
    renderWindow();
    
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

// ==================== 渲染窗户（SVG手绘线稿） ====================

function renderWindow() {
    var container = document.getElementById('cozyWindow');
    if (!container) return;
    
    var style = appData.cozyRoom.window || 'arch';
    var svg = '';
    
    if (style === 'arch') {
        svg = `
            <svg viewBox="0 0 200 150" style="width:100%;height:100%;">
                <!-- 窗外景色 -->
                <rect x="10" y="10" width="180" height="130" fill="rgba(200,220,240,0.08)"/>
                <!-- 窗框 - 手绘线条 -->
                <path d="M10 40 Q10 10 40 10 L160 10 Q190 10 190 40 L190 140 L10 140 Z" 
                      stroke="#4a3728" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <!-- 窗框内侧细线 -->
                <path d="M16 44 Q16 16 44 16 L156 16 Q184 16 184 44 L184 134 L16 134 Z" 
                      stroke="#4a3728" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                <!-- 拱形顶部装饰线 -->
                <path d="M40 16 Q100 0 160 16" stroke="#4a3728" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                <!-- 竖窗格 - 左 -->
                <path d="M70 16 L70 134" stroke="#4a3728" stroke-width="2" fill="none" stroke-linecap="round"/>
                <!-- 竖窗格 - 右 -->
                <path d="M130 16 L130 134" stroke="#4a3728" stroke-width="2" fill="none" stroke-linecap="round"/>
                <!-- 横窗格 - 上 -->
                <path d="M10 65 L190 65" stroke="#4a3728" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                <!-- 横窗格 - 下 -->
                <path d="M10 100 L190 100" stroke="#4a3728" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                <!-- 玻璃反光 -->
                <path d="M30 30 L60 30 L40 60 Z" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" fill="rgba(255,255,255,0.05)"/>
                <!-- 窗台 -->
                <path d="M5 140 L195 140" stroke="#4a3728" stroke-width="3.5" stroke-linecap="round"/>
                <path d="M10 144 L190 144" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <!-- 窗台装饰 -->
                <path d="M30 142 L170 142" stroke="#4a3728" stroke-width="1" stroke-linecap="round"/>
            </svg>
        `;
    } else if (style === 'grid') {
        svg = `
            <svg viewBox="0 0 200 150" style="width:100%;height:100%;">
                <rect x="10" y="10" width="180" height="130" fill="rgba(200,220,240,0.06)"/>
                <!-- 外框 -->
                <path d="M10 10 L190 10 L190 140 L10 140 Z" 
                      stroke="#4a3728" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 16 L184 16 L184 134 L16 134 Z" 
                      stroke="#4a3728" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                <!-- 方格 - 竖 -->
                <path d="M60 16 L60 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M100 16 L100 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M140 16 L140 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <!-- 方格 - 横 -->
                <path d="M16 50 L184 50" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M16 84 L184 84" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M16 118 L184 118" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <!-- 玻璃反光 -->
                <path d="M25 25 L55 25 L40 50 Z" stroke="rgba(255,255,255,0.12)" fill="rgba(255,255,255,0.04)"/>
                <!-- 窗台 -->
                <path d="M5 140 L195 140" stroke="#4a3728" stroke-width="3.5" stroke-linecap="round"/>
                <path d="M10 144 L190 144" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
    } else if (style === 'french') {
        svg = `
            <svg viewBox="0 0 200 150" style="width:100%;height:100%;">
                <rect x="10" y="10" width="180" height="130" fill="rgba(200,220,240,0.06)"/>
                <!-- 外框 - 法式细框 -->
                <path d="M10 10 L190 10 L190 140 L10 140 Z" 
                      stroke="#4a3728" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 16 L184 16 L184 134 L16 134 Z" 
                      stroke="#4a3728" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                <!-- 中间竖框 -->
                <path d="M100 16 L100 134" stroke="#4a3728" stroke-width="2.5" stroke-linecap="round"/>
                <!-- 横档 -->
                <path d="M16 75 L184 75" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
                <!-- 装饰线条 -->
                <path d="M40 16 Q70 10 100 16 Q130 10 160 16" stroke="#4a3728" stroke-width="1" fill="none" stroke-linecap="round"/>
                <path d="M40 134 Q70 140 100 134 Q130 140 160 134" stroke="#4a3728" stroke-width="1" fill="none" stroke-linecap="round"/>
                <!-- 玻璃反光 -->
                <path d="M25 30 L50 30 L38 55 Z" stroke="rgba(255,255,255,0.12)" fill="rgba(255,255,255,0.04)"/>
                <path d="M125 30 L150 30 L138 55 Z" stroke="rgba(255,255,255,0.08)" fill="rgba(255,255,255,0.03)"/>
                <!-- 窗台 -->
                <path d="M5 140 L195 140" stroke="#4a3728" stroke-width="3" stroke-linecap="round"/>
                <path d="M10 144 L190 144" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
        `;
    } else if (style === 'bay') {
        svg = `
            <svg viewBox="0 0 200 150" style="width:100%;height:100%;">
                <rect x="10" y="10" width="180" height="130" fill="rgba(200,220,240,0.06)"/>
                <!-- 飘窗 - 外框 -->
                <path d="M5 20 L195 20 L195 140 L5 140 Z" 
                      stroke="#4a3728" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <!-- 飘窗 - 内框 -->
                <path d="M15 28 L185 28 L185 134 L15 134 Z" 
                      stroke="#4a3728" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                <!-- 飘窗 - 顶部装饰 -->
                <path d="M15 28 L185 28" stroke="#4a3728" stroke-width="2.5" stroke-linecap="round"/>
                <!-- 竖窗格 -->
                <path d="M70 28 L70 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M130 28 L130 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <!-- 横窗格 -->
                <path d="M15 70 L185 70" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M15 105 L185 105" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
                <!-- 飘窗台 -->
                <path d="M0 140 L200 140" stroke="#4a3728" stroke-width="4" stroke-linecap="round"/>
                <path d="M5 146 L195 146" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <!-- 飘窗台装饰 -->
                <path d="M30 142 L170 142" stroke="#4a3728" stroke-width="1" stroke-linecap="round"/>
                <!-- 玻璃反光 -->
                <path d="M25 35 L50 35 L38 60 Z" stroke="rgba(255,255,255,0.12)" fill="rgba(255,255,255,0.04)"/>
            </svg>
        `;
    } else if (style === 'round') {
        svg = `
            <svg viewBox="0 0 200 150" style="width:100%;height:100%;">
                <rect x="10" y="10" width="180" height="130" fill="rgba(200,220,240,0.04)"/>
                <!-- 圆窗 - 外圆 -->
                <circle cx="100" cy="75" r="60" stroke="#4a3728" stroke-width="3.5" fill="none"/>
                <!-- 圆窗 - 内圆 -->
                <circle cx="100" cy="75" r="54" stroke="#4a3728" stroke-width="1.5" fill="none"/>
                <!-- 十字窗格 -->
                <path d="M100 21 L100 129" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M46 75 L154 75" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <!-- 装饰弧线 -->
                <path d="M70 28 Q85 45 100 45 Q115 45 130 28" stroke="#4a3728" stroke-width="1" fill="none" stroke-linecap="round"/>
                <path d="M70 122 Q85 105 100 105 Q115 105 130 122" stroke="#4a3728" stroke-width="1" fill="none" stroke-linecap="round"/>
                <!-- 玻璃反光 -->
                <path d="M70 40 L95 40 L82 65 Z" stroke="rgba(255,255,255,0.12)" fill="rgba(255,255,255,0.04)"/>
                <!-- 窗台 -->
                <path d="M20 130 L180 130" stroke="#4a3728" stroke-width="3" stroke-linecap="round"/>
                <path d="M25 134 L175 134" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
        `;
    } else if (style === 'gothic') {
        svg = `
            <svg viewBox="0 0 200 150" style="width:100%;height:100%;">
                <rect x="10" y="10" width="180" height="130" fill="rgba(200,220,240,0.06)"/>
                <!-- 哥特窗 - 尖顶外框 -->
                <path d="M10 50 L10 140 L190 140 L190 50 Q190 20 170 10 Q150 0 130 10 Q110 20 100 5 Q90 20 70 10 Q50 0 30 10 Q10 20 10 50 Z" 
                      stroke="#4a3728" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <!-- 内框 -->
                <path d="M18 55 L18 134 L182 134 L182 55 Q182 28 166 20 Q150 12 134 20 Q118 28 100 16 Q82 28 66 20 Q50 12 34 20 Q18 28 18 55 Z" 
                      stroke="#4a3728" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <!-- 尖顶装饰 -->
                <path d="M100 5 L100 16" stroke="#4a3728" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M60 14 Q80 8 100 14 Q120 8 140 14" stroke="#4a3728" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                <!-- 竖窗格 -->
                <path d="M70 22 L70 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <path d="M130 22 L130 134" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
                <!-- 横窗格 -->
                <path d="M18 70 L182 70" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M18 105 L182 105" stroke="#4a3728" stroke-width="1.8" stroke-linecap="round"/>
                <!-- 玻璃反光 -->
                <path d="M30 30 L55 30 L42 55 Z" stroke="rgba(255,255,255,0.12)" fill="rgba(255,255,255,0.04)"/>
                <!-- 窗台 -->
                <path d="M5 140 L195 140" stroke="#4a3728" stroke-width="3.5" stroke-linecap="round"/>
                <path d="M10 144 L190 144" stroke="#4a3728" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
    }
    
    container.innerHTML = svg;
}

// ==================== 渲染房间 ====================

function renderCozyRoom() {
    var wallLayer = document.getElementById('cozyWallLayer');
    if (wallLayer) {
        wallLayer.className = 'cozy-wall-layer wall-' + appData.cozyRoom.wall;
    }
    
    renderWindow();
    
    var floor = document.querySelector('.cozy-floor');
    if (floor) {
        floor.className = 'cozy-floor floor-' + appData.cozyRoom.floor;
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
    container.className = '';
    
    if (weather === 'sunny') {
        container.className = 'sunny-container';
        container.innerHTML = `
            <svg viewBox="0 0 220 200" style="position:absolute;top:0;right:0;width:55%;height:55%;">
                <!-- 太阳光芒 - 手绘粗细不均 -->
                <g stroke="#8a7a6a" stroke-linecap="round" fill="none">
                    <line x1="110" y1="10" x2="110" y2="35" stroke-width="2.8"/>
                    <line x1="110" y1="165" x2="110" y2="190" stroke-width="2"/>
                    <line x1="10" y1="100" x2="35" y2="100" stroke-width="2.8"/>
                    <line x1="185" y1="100" x2="210" y2="100" stroke-width="2"/>
                    <line x1="35" y1="35" x2="52" y2="52" stroke-width="2.2"/>
                    <line x1="168" y1="148" x2="185" y2="165" stroke-width="1.8"/>
                    <line x1="168" y1="52" x2="185" y2="35" stroke-width="2.5"/>
                    <line x1="35" y1="165" x2="52" y2="148" stroke-width="1.8"/>
                    <!-- 短光芒 -->
                    <line x1="75" y1="15" x2="80" y2="38" stroke-width="1.5"/>
                    <line x1="145" y1="15" x2="140" y2="38" stroke-width="1.5"/>
                    <line x1="15" y1="75" x2="38" y2="80" stroke-width="1.5"/>
                    <line x1="15" y1="125" x2="38" y2="120" stroke-width="1.5"/>
                    <line x1="195" y1="75" x2="172" y2="80" stroke-width="1.5"/>
                    <line x1="195" y1="125" x2="172" y2="120" stroke-width="1.5"/>
                </g>
                <!-- 太阳主体 -->
                <circle cx="110" cy="100" r="38" fill="#f5e8c8" stroke="#8a7a6a" stroke-width="3"/>
                <!-- 太阳内部手绘光影 -->
                <path d="M88 82 Q100 76 110 82 Q120 76 132 82" stroke="#d4c8a8" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                <path d="M88 100 Q100 94 110 100 Q120 94 132 100" stroke="#d4c8a8" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                <path d="M88 118 Q100 112 110 118 Q120 112 132 118" stroke="#d4c8a8" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                <!-- 高光 -->
                <circle cx="92" cy="85" r="5" fill="rgba(255,255,255,0.3)"/>
                <circle cx="128" cy="115" r="3" fill="rgba(255,255,255,0.15)"/>
            </svg>
        `;
        
    } else if (weather === 'cloudy') {
        container.className = 'cloudy-container';
        container.innerHTML = `
            <svg viewBox="0 0 320 160" style="position:absolute;top:0;left:0;width:100%;height:60%;">
                <!-- 云朵1 - 手绘 -->
                <g stroke="#8a7a6a" stroke-linecap="round" fill="none">
                    <ellipse cx="85" cy="70" rx="55" ry="30" stroke-width="2.8" fill="rgba(220,215,208,0.25)"/>
                    <ellipse cx="130" cy="55" rx="42" ry="25" stroke-width="2.2" fill="rgba(220,215,208,0.25)"/>
                    <ellipse cx="50" cy="60" rx="30" ry="20" stroke-width="2" fill="rgba(220,215,208,0.25)"/>
                    <ellipse cx="115" cy="75" rx="35" ry="18" stroke-width="1.8" fill="rgba(220,215,208,0.2)"/>
                    <!-- 云朵内部线条 -->
                    <path d="M45 65 Q65 58 85 65 Q105 58 125 65" stroke="#b0a898" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                    <path d="M55 78 Q75 70 95 78" stroke="#b0a898" stroke-width="1" fill="none" stroke-linecap="round"/>
                </g>
                <!-- 云朵2 -->
                <g stroke="#8a7a6a" stroke-linecap="round" fill="none">
                    <ellipse cx="240" cy="65" rx="48" ry="26" stroke-width="2.5" fill="rgba(220,215,208,0.2)"/>
                    <ellipse cx="275" cy="52" rx="35" ry="20" stroke-width="2" fill="rgba(220,215,208,0.2)"/>
                    <ellipse cx="210" cy="58" rx="28" ry="18" stroke-width="1.8" fill="rgba(220,215,208,0.2)"/>
                    <path d="M205 62 Q220 56 240 62 Q260 56 275 62" stroke="#b0a898" stroke-width="1" fill="none" stroke-linecap="round"/>
                </g>
                <!-- 云朵3 - 远景 -->
                <g stroke="#b0a898" stroke-linecap="round" fill="none">
                    <ellipse cx="160" cy="100" rx="50" ry="20" stroke-width="1.5" fill="rgba(200,195,190,0.15)"/>
                    <ellipse cx="185" cy="90" rx="30" ry="16" stroke-width="1.2" fill="rgba(200,195,190,0.15)"/>
                </g>
            </svg>
        `;
        
    } else if (weather === 'rainy') {
        container.className = 'rain-container';
        // 雨滴用CSS动画，加上手绘雨云
        container.innerHTML = `
            <svg viewBox="0 0 300 100" style="position:absolute;top:0;left:0;width:100%;height:35%;">
                <g stroke="#8a7a6a" stroke-linecap="round" fill="none">
                    <ellipse cx="80" cy="50" rx="60" ry="28" stroke-width="2.5" fill="rgba(180,195,210,0.2)"/>
                    <ellipse cx="130" cy="38" rx="45" ry="22" stroke-width="2" fill="rgba(180,195,210,0.2)"/>
                    <ellipse cx="45" cy="42" rx="32" ry="18" stroke-width="1.8" fill="rgba(180,195,210,0.2)"/>
                    <ellipse cx="200" cy="45" rx="50" ry="22" stroke-width="2" fill="rgba(180,195,210,0.15)"/>
                    <ellipse cx="240" cy="35" rx="35" ry="18" stroke-width="1.8" fill="rgba(180,195,210,0.15)"/>
                    <!-- 雨丝线 -->
                    <path d="M45 70 L35 90" stroke="#8a9aa8" stroke-width="1.2" stroke-linecap="round"/>
                    <path d="M70 68 L60 88" stroke="#8a9aa8" stroke-width="1" stroke-linecap="round"/>
                    <path d="M95 72 L85 92" stroke="#8a9aa8" stroke-width="1.2" stroke-linecap="round"/>
                    <path d="M120 70 L110 90" stroke="#8a9aa8" stroke-width="1" stroke-linecap="round"/>
                    <path d="M145 74 L135 94" stroke="#8a9aa8" stroke-width="1.2" stroke-linecap="round"/>
                    <path d="M185 68 L175 88" stroke="#8a9aa8" stroke-width="1" stroke-linecap="round"/>
                    <path d="M210 72 L200 92" stroke="#8a9aa8" stroke-width="1.2" stroke-linecap="round"/>
                    <path d="M235 70 L225 90" stroke="#8a9aa8" stroke-width="1" stroke-linecap="round"/>
                    <path d="M260 74 L250 94" stroke="#8a9aa8" stroke-width="1.2" stroke-linecap="round"/>
                </g>
            </svg>
        `;
        // 添加CSS雨滴
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
        container.innerHTML = `
            <svg viewBox="0 0 300 100" style="position:absolute;top:0;left:0;width:100%;height:35%;">
                <g stroke="#b8b8b8" stroke-linecap="round" fill="none">
                    <ellipse cx="80" cy="50" rx="60" ry="28" stroke-width="2" fill="rgba(220,225,230,0.2)"/>
                    <ellipse cx="130" cy="38" rx="45" ry="22" stroke-width="1.8" fill="rgba(220,225,230,0.2)"/>
                    <ellipse cx="45" cy="42" rx="32" ry="18" stroke-width="1.5" fill="rgba(220,225,230,0.2)"/>
                    <ellipse cx="210" cy="45" rx="55" ry="24" stroke-width="1.8" fill="rgba(220,225,230,0.15)"/>
                    <ellipse cx="260" cy="38" rx="35" ry="18" stroke-width="1.5" fill="rgba(220,225,230,0.15)"/>
                </g>
            </svg>
        `;
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
            <svg viewBox="0 0 220 200" style="position:absolute;top:0;right:0;width:55%;height:55%;">
                <!-- 月亮 - 手绘 -->
                <circle cx="120" cy="55" r="32" fill="#ece8dc" stroke="#8a7a6a" stroke-width="2.8"/>
                <!-- 月亮表面纹理 -->
                <circle cx="112" cy="48" r="6" fill="rgba(180,175,165,0.15)"/>
                <circle cx="128" cy="60" r="4" fill="rgba(180,175,165,0.12)"/>
                <circle cx="118" cy="68" r="3" fill="rgba(180,175,165,0.10)"/>
                <!-- 月亮光晕 -->
                <circle cx="120" cy="55" r="38" stroke="#8a7a6a" stroke-width="0.8" fill="none" opacity="0.15"/>
                <!-- 星星 - 手绘 -->
                <g stroke="#b8a898" stroke-linecap="round" fill="none">
                    <path d="M30 30 L30 40 M25 35 L35 35" stroke-width="1.2"/>
                    <path d="M50 18 L50 26 M46 22 L54 22" stroke-width="1"/>
                    <path d="M160 25 L160 33 M156 29 L164 29" stroke-width="1.2"/>
                    <path d="M180 45 L180 53 M176 49 L184 49" stroke-width="1"/>
                    <path d="M40 50 L40 56 M37 53 L43 53" stroke-width="0.8"/>
                    <path d="M195 20 L195 26 M192 23 L198 23" stroke-width="0.8"/>
                    <path d="M70 10 L70 16 M67 13 L73 13" stroke-width="0.8"/>
                    <path d="M145 10 L145 16 M142 13 L148 13" stroke-width="0.8"/>
                    <path d="M25 70 L25 76 M22 73 L28 73" stroke-width="0.8"/>
                    <path d="M190 70 L190 76 M187 73 L193 73" stroke-width="0.8"/>
                    <path d="M60 35 L60 39 M58 37 L62 37" stroke-width="0.6"/>
                    <path d="M165 40 L165 44 M163 42 L167 42" stroke-width="0.6"/>
                </g>
            </svg>
        `;
        
    } else if (weather === 'sunset') {
        container.className = 'sunset-container';
        container.innerHTML = `
            <svg viewBox="0 0 300 160" style="position:absolute;top:0;left:0;width:100%;height:60%;">
                <!-- 夕阳 - 手绘 -->
                <circle cx="220" cy="80" r="35" fill="#f0c8a8" stroke="#c8a088" stroke-width="2.5"/>
                <circle cx="220" cy="80" r="28" fill="#f5d8b8" stroke="none"/>
                <circle cx="220" cy="80" r="20" fill="#fae8d0" stroke="none"/>
                <!-- 夕阳光晕 -->
                <circle cx="220" cy="80" r="48" stroke="#d4b098" stroke-width="0.8" fill="none" opacity="0.2"/>
                <!-- 晚霞云 -->
                <g stroke="#b09888" stroke-linecap="round" fill="none">
                    <ellipse cx="60" cy="60" rx="50" ry="18" stroke-width="1.8" fill="rgba(200,160,140,0.15)"/>
                    <ellipse cx="100" cy="50" rx="40" ry="15" stroke-width="1.5" fill="rgba(200,160,140,0.12)"/>
                    <ellipse cx="140" cy="55" rx="45" ry="16" stroke-width="1.5" fill="rgba(200,160,140,0.12)"/>
                    <ellipse cx="260" cy="58" rx="35" ry="14" stroke-width="1.5" fill="rgba(200,160,140,0.12)"/>
                    <!-- 云内部线 -->
                    <path d="M45 62 Q70 55 95 62" stroke="#b0a090" stroke-width="0.8" fill="none"/>
                    <path d="M110 58 Q130 50 155 58" stroke="#b0a090" stroke-width="0.8" fill="none"/>
                    <path d="M180 60 Q200 52 230 60" stroke="#b0a090" stroke-width="0.8" fill="none"/>
                </g>
                <!-- 飞鸟 -->
                <g stroke="#8a7a6a" stroke-linecap="round" fill="none">
                    <path d="M80 30 Q85 25 90 30 Q95 25 100 30" stroke-width="1.2"/>
                    <path d="M110 22 Q114 18 118 22 Q122 18 126 22" stroke-width="1"/>
                    <path d="M200 28 Q204 24 208 28 Q212 24 216 28" stroke-width="1"/>
                </g>
            </svg>
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

console.log('暖屋主界面已加载（手绘线稿版）');
