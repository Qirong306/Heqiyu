// ==================== 暖屋主界面 ====================

var cozyFocusActive = false;
var cozyFocusTimer = null;
var cozyDanmakuTimer = null;

// ==================== 打开/关闭暖屋 ====================

function openCozySpace() {
    // 初始化数据
    if (!appData.cozyRoom) {
        initCozyData();
    }
    
    // 检查对方购买
    checkOtherPurchases();
    
    // 创建暖屋 DOM
    renderCozySpace();
    
    // 显示
    var overlay = document.getElementById('cozyOverlay');
    if (overlay) {
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    // 渲染家具
    renderCozyFurniture();
    
    // 渲染弹幕历史
    renderCozyDanmakuHistory();
    
    // 启动弹幕轮询
    startCozyDanmakuLoop();
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

// ==================== 渲染主界面 ====================

function renderCozySpace() {
    // 移除已有
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
            '<span class="cozy-header-title">小暖屋</span>' +
            '<span class="cozy-header-weather" id="cozyWeatherLabel">' + getWeatherLabel() + '</span>' +
        '</div>' +
        '<div class="cozy-header-actions">' +
            '<span class="cozy-header-warmth">' + getWarmthDisplay() + '</span>' +
            '<button onclick="openMusicPlayer()" title="音乐">🎵</button>' +
            '<button onclick="closeCozySpace()" title="关闭">✕</button>' +
        '</div>';
    overlay.appendChild(header);
    
    // ---- 暖屋主体 ----
    var body = document.createElement('div');
    body.className = 'cozy-body';
    body.id = 'cozyBody';
    
    // 天气层
    var weatherLayer = document.createElement('div');
    weatherLayer.className = 'cozy-weather-layer weather-' + appData.cozyRoom.weather;
    weatherLayer.id = 'cozyWeatherLayer';
    body.appendChild(weatherLayer);
    
    // 天气特效容器
    var effectContainer = document.createElement('div');
    effectContainer.id = 'cozyWeatherEffect';
    body.appendChild(effectContainer);
    renderWeatherEffect();
    
    // 窗户
    var windowEl = document.createElement('div');
    windowEl.className = 'cozy-window';
    windowEl.innerHTML = '<div class="window-frame ' + appData.cozyRoom.window + '"><div class="window-view"></div></div>';
    body.appendChild(windowEl);
    
    // 地板
    var floor = document.createElement('div');
    floor.className = 'cozy-floor floor-' + appData.cozyRoom.floor;
    body.appendChild(floor);
    
    // 家具容器
    var furniture = document.createElement('div');
    furniture.className = 'cozy-furniture';
    furniture.id = 'cozyFurniture';
    body.appendChild(furniture);
    
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
        '<button onclick="closeCozyFocusBar()" style="background:rgba(255,255,255,0.1);padding:8px 12px;">✕</button>';
    body.appendChild(focusBar);
    
    overlay.appendChild(body);
    
    // ---- 底部功能栏 ----
    var footer = document.createElement('div');
    footer.className = 'cozy-footer';
    footer.innerHTML = 
        '<button onclick="openCozyShop()"><span class="icon">🛒</span>商城</button>' +
        '<button onclick="openCozyMessages()"><span class="icon">💬</span>留言</button>' +
        '<button onclick="toggleCozyFocus()"><span class="icon">⏳</span>专注</button>' +
        '<button onclick="openCozyDaily()"><span class="icon">🎁</span>奖励</button>' +
        '<button onclick="openCozySettings()"><span class="icon">⚙️</span>设置</button>';
    overlay.appendChild(footer);
    
    document.body.appendChild(overlay);
}

// ==================== 渲染家具 ====================

function renderCozyFurniture() {
    var container = document.getElementById('cozyFurniture');
    if (!container) return;
    
    var furnitureMap = {
        sofa: { class: 'f-sofa', label: '沙发' },
        bed: { class: 'f-bed', label: '床' },
        bookshelf: { class: 'f-bookshelf', label: '书架' },
        desk: { class: 'f-desk', label: '书桌' },
        flower: { class: 'f-flower', label: '花' },
        doll: { class: 'f-doll', label: '玩偶' },
        pillow: { class: 'f-pillow', label: '枕头' }
    };
    
    var html = '';
    for (var key in furnitureMap) {
        var currentId = appData.cozyRoom[key] || '';
        var name = getOptionName(key, currentId);
        var owned = isCozyOwned(key, currentId);
        
        html += '<div class="furniture-item ' + furnitureMap[key].class + '" onclick="openCozyItemDetail(\'' + key + '\')" data-category="' + key + '">' +
            '<span class="f-name">' + name + '</span>' +
            (owned ? '' : '<span class="f-badge">?</span>') +
            '</div>';
    }
    
    container.innerHTML = html;
}

// ==================== 天气效果 ====================

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
        var flakes = ['●', '○', '❖'];
        for (var j = 0; j < 40; j++) {
            var flake = document.createElement('div');
            flake.className = 'snow-flake';
            flake.textContent = flakes[Math.floor(Math.random() * flakes.length)];
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

// ==================== 温暖值 ====================

function getWarmthDisplay() {
    return '温暖 ' + (appData.cozyRoom.warmth || 0);
}

function updateWarmthDisplay() {
    var el = document.querySelector('.cozy-header-warmth');
    if (el) el.textContent = getWarmthDisplay();
}

// ==================== 对方购买检查 ====================

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

// ==================== 专注弹幕 ====================

function toggleCozyFocus() {
    var bar = document.getElementById('cozyFocusBar');
    if (!bar) return;
    
    if (bar.classList.contains('show')) {
        closeCozyFocusBar();
    } else {
        openCozyFocusBar();
    }
}

function openCozyFocusBar() {
    var bar = document.getElementById('cozyFocusBar');
    if (bar) {
        bar.classList.add('show');
        var input = document.getElementById('cozyFocusInput');
        if (input) setTimeout(function() { input.focus(); }, 100);
    }
    cozyFocusActive = true;
}

function closeCozyFocusBar() {
    var bar = document.getElementById('cozyFocusBar');
    if (bar) bar.classList.remove('show');
    cozyFocusActive = false;
}

function sendCozyDanmaku() {
    var input = document.getElementById('cozyFocusInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    
    // 添加到数据
    addCozyDanmaku(text, 'me');
    
    // 显示弹幕
    showCozyDanmaku(text, 'me');
    
    input.value = '';
    
    // 模拟对方回复（20%概率）
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
    
    // 随机垂直位置
    var top = 5 + Math.random() * 60;
    el.style.top = top + 'px';
    
    // 随机速度
    var duration = 6 + Math.random() * 4;
    el.style.animationDuration = duration + 's';
    
    // 随机延迟（避免全部一起出现）
    el.style.animationDelay = (Math.random() * 0.5) + 's';
    
    layer.appendChild(el);
    
    // 自动移除
    setTimeout(function() {
        if (el.parentNode) el.remove();
    }, (duration + 2) * 1000);
}

function renderCozyDanmakuHistory() {
    var history = appData.cozyRoom.focus.danmaku || [];
    // 只显示最近10条
    var recent = history.slice(-10);
    recent.forEach(function(item) {
        showCozyDanmaku(item.text, item.from);
    });
}

function startCozyDanmakuLoop() {
    if (cozyDanmakuTimer) return;
    cozyDanmakuTimer = setInterval(function() {
        // 对方自动发弹幕（5%概率）
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

// ==================== 家具详情（点击家具） ====================

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
    html += '<button class="cozy-modal-close" onclick="closeCozyModal()" style="margin-top:12px;padding:8px 24px;border-radius:20px;border:2px solid #e8d5c4;background:transparent;font-family:inherit;font-size:13px;cursor:pointer;color:#4a3728;">关闭</button>';
    
    openCozyModal(html);
}

function switchCozyStyleFromDetail(category, id) {
    if (switchCozyStyle(category, id)) {
        renderCozyFurniture();
        // 如果是天气，更新天气效果
        if (category === 'weather') {
            updateWeather();
        }
        closeCozyModal();
        showToast('已切换');
    }
}

function buyCozyItemFromDetail(category, id) {
    if (buyCozyItem(category, id)) {
        renderCozyFurniture();
        updateWarmthDisplay();
        if (category === 'weather') {
            updateWeather();
        }
        closeCozyModal();
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

// ==================== 暖屋设置（从设置入口进入） ====================

function openCozySettings() {
    closeModal('settingsOverlay');
    
    var html = '<h3>暖屋设置</h3>';
    html += '<div class="sub">管理暖屋的所有配置</div>';
    
    // 温暖值
    html += '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e8d5c4;">' +
        '<span>当前温暖值</span>' +
        '<span style="font-weight:bold;">' + appData.cozyRoom.warmth + '</span>' +
        '</div>';
    
    // 奖励池管理
    html += '<div style="margin-top:12px;">';
    html += '<div style="font-weight:bold;margin-bottom:6px;">每日奖励池</div>';
    var pool = appData.cozyRoom.daily.pool || [];
    pool.forEach(function(item, i) {
        html += '<div style="display:flex;justify-content:space-between;padding:6px 10px;background:#fffcf8;border-radius:8px;margin-bottom:4px;">' +
            '<span>' + item + '</span>' +
            '<button onclick="removeRewardPoolItem(' + i + ')" style="background:none;border:none;color:#d48888;cursor:pointer;font-size:16px;">✕</button>' +
            '</div>';
    });
    html += '<div style="display:flex;gap:6px;margin-top:6px;">' +
        '<input type="text" id="newRewardInput" placeholder="新奖励名称" style="flex:1;padding:6px 12px;border:2px solid #e8d5c4;border-radius:12px;font-family:inherit;background:white;">' +
        '<button onclick="addRewardPoolItem()" style="padding:6px 14px;border-radius:12px;border:none;background:#e8a87c;color:white;font-family:inherit;cursor:pointer;">添加</button>' +
        '</div>';
    html += '</div>';
    
    // 重置
    html += '<div style="margin-top:12px;display:flex;gap:8px;">' +
        '<button onclick="resetCozyDefault()" style="padding:6px 16px;border-radius:12px;border:2px solid #d48888;background:transparent;color:#d48888;font-family:inherit;cursor:pointer;">恢复默认</button>' +
        '</div>';
    
    html += '<button onclick="closeCozyModal()" style="margin-top:12px;padding:8px 24px;border-radius:20px;border:2px solid #e8d5c4;background:transparent;font-family:inherit;font-size:13px;cursor:pointer;color:#4a3728;">关闭</button>';
    
    openCozyModal(html);
}

function addRewardPoolItem() {
    var input = document.getElementById('newRewardInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) { showToast('请输入奖励名称'); return; }
    appData.cozyRoom.daily.pool.push(text);
    saveData();
    input.value = '';
    openCozySettings();
    showToast('已添加');
}

function removeRewardPoolItem(index) {
    appData.cozyRoom.daily.pool.splice(index, 1);
    saveData();
    openCozySettings();
}

function resetCozyDefault() {
    if (!confirm('确定恢复默认暖屋配置吗？')) return;
    appData.cozyRoom.weather = 'sunny';
    appData.cozyRoom.window = 'arch';
    appData.cozyRoom.floor = 'wood';
    appData.cozyRoom.sofa = 'fabric';
    appData.cozyRoom.bed = 'wooden';
    appData.cozyRoom.bookshelf = 'tall';
    appData.cozyRoom.desk = 'simple';
    appData.cozyRoom.flower = 'wicker';
    appData.cozyRoom.doll = 'bear';
    appData.cozyRoom.pillow = 'round';
    appData.cozyRoom.warmth = 100;
    appData.cozyRoom.purchased = {
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
    appData.cozyRoom.daily.pool = ['温暖值 +5', '温暖值 +10', '温暖值 +15', '家具折扣券', '小星星', '一杯虚拟咖啡', '今日好心情', '阳光明媚'];
    saveData();
    closeCozyModal();
    closeCozySpace();
    showToast('已恢复默认');
    setTimeout(openCozySpace, 300);
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

// ==================== 导入到全局 ====================
window.openCozySpace = openCozySpace;
window.closeCozySpace = closeCozySpace;
window.openCozySettings = openCozySettings;
window.openCozyItemDetail = openCozyItemDetail;
window.switchCozyStyleFromDetail = switchCozyStyleFromDetail;
window.buyCozyItemFromDetail = buyCozyItemFromDetail;
window.sendCozyDanmaku = sendCozyDanmaku;
window.toggleCozyFocus = toggleCozyFocus;
window.closeCozyFocusBar = closeCozyFocusBar;
window.addRewardPoolItem = addRewardPoolItem;
window.removeRewardPoolItem = removeRewardPoolItem;
window.resetCozyDefault = resetCozyDefault;
window.openCozyModal = openCozyModal;
window.closeCozyModal = closeCozyModal;

console.log('暖屋主界面已加载（纯文字 + CSS 图标版）');
