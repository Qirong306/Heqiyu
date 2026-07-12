// ==================== 暖屋 Canvas 手绘版 ====================

// ==================== 主渲染函数 ====================

function renderCozyCanvas() {
    var container = document.getElementById('cozyCanvasContainer');
    if (!container) return;
    
    // 清空容器
    container.innerHTML = '';
    
    // 创建 Canvas
    var canvas = document.createElement('canvas');
    canvas.id = 'cozyCanvas';
    canvas.width = container.clientWidth || 400;
    canvas.height = container.clientHeight || 500;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);
    
    var ctx = canvas.getContext('2d');
    var W = canvas.width;
    var H = canvas.height;
    
    // 获取当前配置
    var wallColor = appData.cozyRoom.wall || 'warm';
    var windowStyle = appData.cozyRoom.window || 'arch';
    var floorStyle = appData.cozyRoom.floor || 'wood';
    var weather = appData.cozyRoom.weather || 'sunny';
    
    // 墙面颜色映射
    var wallColors = {
        'warm': { main: '#f5ede4', light: '#faf5ef', dark: '#e8dcc8' },
        'mint': { main: '#d4e8d8', light: '#e4f0e8', dark: '#c0d8c8' },
        'lavender': { main: '#e0dce8', light: '#ece8f0', dark: '#d0c8d8' },
        'peach': { main: '#f5e0d8', light: '#faf0e8', dark: '#e8d0c8' },
        'sky': { main: '#d4e4f0', light: '#e4eef5', dark: '#c0d4e0' },
        'cream': { main: '#f5f0e8', light: '#faf8f0', dark: '#e8e0d8' },
        'sage': { main: '#dce4d0', light: '#e8eedc', dark: '#ccd4c0' },
        'dusty': { main: '#e8dcd8', light: '#f0e8e0', dark: '#d8ccc8' }
    };
    var colors = wallColors[wallColor] || wallColors['warm'];
    
    // 地板颜色映射
    var floorColors = {
        'wood': { main: '#d4c0b0', light: '#e0d0c0', dark: '#c0ac9c' },
        'carpet': { main: '#d8ccc4', light: '#e4dcd4', dark: '#c8bcb4' },
        'tile': { main: '#e0dcd4', light: '#e8e4dc', dark: '#d0ccc4' },
        'tatami': { main: '#d4c8b4', light: '#e0d8c4', dark: '#c4b8a4' },
        'marble': { main: '#e8e4dc', light: '#f0ece4', dark: '#d8d4cc' },
        'brick': { main: '#d0c0b0', light: '#dcccb8', dark: '#c0b0a0' }
    };
    var floorCol = floorColors[floorStyle] || floorColors['wood'];
    
    // ---- 1. 绘制墙面 ----
    drawWall(ctx, W, H, colors);
    
    // ---- 2. 绘制地板（透视） ----
    drawFloor(ctx, W, H, floorCol, floorStyle);
    
    // ---- 3. 绘制窗户（透视 + 手绘风格） ----
    drawWindow(ctx, W, H, windowStyle, weather);
    
    // ---- 4. 绘制天气（在窗户外面/上方） ----
    drawWeather(ctx, W, H, weather);
    
    // ---- 5. 绘制光影和氛围 ----
    drawAtmosphere(ctx, W, H, weather);
}

// ==================== 1. 绘制墙面 ====================

function drawWall(ctx, W, H, colors) {
    // 墙面渐变（从上到下，有光照感）
    var grad = ctx.createLinearGradient(0, 0, 0, H * 0.75);
    grad.addColorStop(0, colors.light);
    grad.addColorStop(0.5, colors.main);
    grad.addColorStop(1, colors.dark);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H * 0.78);
    
    // 墙面纹理（轻微噪点，模拟手绘纸质感）
    for (var i = 0; i < 200; i++) {
        var x = Math.random() * W;
        var y = Math.random() * H * 0.75;
        var r = Math.random() * 3 + 0.5;
        var alpha = Math.random() * 0.04 + 0.01;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
        ctx.fill();
    }
    
    // 墙角阴影（底部暗角）
    var vignette = ctx.createRadialGradient(W/2, H*0.7, 0, W/2, H*0.7, W*0.6);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.04)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, H*0.3, W, H*0.5);
}

// ==================== 2. 绘制地板（透视） ====================

function drawFloor(ctx, W, H, floorCol, floorStyle) {
    var floorY = H * 0.72;
    var vanishX = W / 2;
    var vanishY = H * 0.45;
    
    // 地板区域（透视梯形）
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(W, floorY);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    
    var grad = ctx.createLinearGradient(0, floorY, 0, H);
    grad.addColorStop(0, floorCol.light);
    grad.addColorStop(0.3, floorCol.main);
    grad.addColorStop(1, floorCol.dark);
    ctx.fillStyle = grad;
    ctx.fill();
    
    // 地板纹理（透视木纹/线条）
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1.2;
    
    if (floorStyle === 'wood') {
        // 木纹 - 从灭点辐射的线条 + 横纹
        for (var i = 1; i <= 12; i++) {
            var y = floorY + (H - floorY) * (i / 13);
            var widthFactor = 1 + (y - floorY) / (H - floorY) * 0.8;
            var startX = vanishX - (W/2 - 20) * widthFactor * 0.9;
            var endX = vanishX + (W/2 - 20) * widthFactor * 0.9;
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }
        // 竖纹
        for (var j = 1; j <= 8; j++) {
            var t = j / 9;
            var x = 20 + t * (W - 40);
            var y1 = floorY + (H - floorY) * 0.1 * (1 + t * 0.5);
            var y2 = H;
            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x + (x - vanishX) * 0.3, y2);
            ctx.stroke();
        }
    } else if (floorStyle === 'tile') {
        // 瓷砖 - 网格透视
        for (var i = 1; i <= 8; i++) {
            var y = floorY + (H - floorY) * (i / 9);
            var widthFactor = 1 + (y - floorY) / (H - floorY) * 0.7;
            var startX = vanishX - (W/2) * widthFactor * 0.85;
            var endX = vanishX + (W/2) * widthFactor * 0.85;
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }
        for (var j = 1; j <= 6; j++) {
            var t = j / 7;
            var x = 30 + t * (W - 60);
            var y1 = floorY + (H - floorY) * 0.05;
            var y2 = H;
            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x + (x - vanishX) * 0.25, y2);
            ctx.stroke();
        }
    } else if (floorStyle === 'carpet') {
        // 地毯 - 柔和纹理
        for (var i = 0; i < 80; i++) {
            var x = Math.random() * W;
            var y = floorY + Math.random() * (H - floorY);
            var r = Math.random() * 8 + 2;
            var alpha = Math.random() * 0.03;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
            ctx.fill();
        }
    } else if (floorStyle === 'tatami') {
        // 榻榻米 - 网格
        for (var i = 1; i <= 10; i++) {
            var y = floorY + (H - floorY) * (i / 11);
            var widthFactor = 1 + (y - floorY) / (H - floorY) * 0.6;
            var startX = vanishX - (W/2 - 30) * widthFactor * 0.85;
            var endX = vanishX + (W/2 - 30) * widthFactor * 0.85;
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }
        for (var j = 1; j <= 5; j++) {
            var t = j / 6;
            var x = 40 + t * (W - 80);
            var y1 = floorY + (H - floorY) * 0.05;
            var y2 = H;
            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x + (x - vanishX) * 0.2, y2);
            ctx.stroke();
        }
    }
    
    // 地板与墙面交界阴影
    var shadowGrad = ctx.createLinearGradient(0, floorY - 10, 0, floorY + 20);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
    shadowGrad.addColorStop(0.5, 'rgba(0,0,0,0.04)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(0, floorY - 10, W, 30);
}

// ==================== 3. 绘制窗户（手绘风格） ====================

function drawWindow(ctx, W, H, windowStyle, weather) {
    var windowW = W * 0.55;
    var windowH = H * 0.32;
    var winX = (W - windowW) / 2;
    var winY = H * 0.16;
    
    // 窗户的透视调整（稍微梯形，增加立体感）
    var topOffset = windowW * 0.04;
    var bottomOffset = windowW * 0.06;
    
    // ---- 窗玻璃（窗外景色） ----
    var glassGrad = ctx.createLinearGradient(winX, winY, winX, winY + windowH);
    if (weather === 'sunny') {
        glassGrad.addColorStop(0, '#d4e8f5');
        glassGrad.addColorStop(0.3, '#e8f0f8');
        glassGrad.addColorStop(0.7, '#d4e0ec');
        glassGrad.addColorStop(1, '#b8c8d8');
    } else if (weather === 'cloudy') {
        glassGrad.addColorStop(0, '#c8c8c8');
        glassGrad.addColorStop(0.3, '#d8d8d8');
        glassGrad.addColorStop(0.7, '#c8c8c8');
        glassGrad.addColorStop(1, '#b8b8b8');
    } else if (weather === 'rainy') {
        glassGrad.addColorStop(0, '#a8b8c8');
        glassGrad.addColorStop(0.3, '#c0ccd8');
        glassGrad.addColorStop(0.7, '#a8b8c8');
        glassGrad.addColorStop(1, '#90a0b0');
    } else if (weather === 'snowy') {
        glassGrad.addColorStop(0, '#d8dce0');
        glassGrad.addColorStop(0.3, '#e8ecf0');
        glassGrad.addColorStop(0.7, '#d8dce0');
        glassGrad.addColorStop(1, '#c8ccd0');
    } else if (weather === 'night') {
        glassGrad.addColorStop(0, '#1a1a3a');
        glassGrad.addColorStop(0.3, '#2a2a50');
        glassGrad.addColorStop(0.7, '#1a1a3a');
        glassGrad.addColorStop(1, '#0d0d25');
    } else if (weather === 'sunset') {
        glassGrad.addColorStop(0, '#f0c8b0');
        glassGrad.addColorStop(0.3, '#f0d8c0');
        glassGrad.addColorStop(0.7, '#e8c0a8');
        glassGrad.addColorStop(1, '#d0a890');
    }
    
    // 窗户形状（根据样式）
    ctx.save();
    ctx.beginPath();
    
    if (windowStyle === 'round') {
        // 圆窗
        var cx = W/2, cy = winY + windowH/2, r = windowH/2 * 0.9;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = glassGrad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.restore();
        ctx.save();
        // 圆窗框
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#4a3728';
        ctx.lineWidth = 4;
        ctx.stroke();
        // 十字窗格
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx, cy + r);
        ctx.moveTo(cx - r, cy);
        ctx.lineTo(cx + r, cy);
        ctx.strokeStyle = '#4a3728';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
        return;
    }
    
    // 普通窗户 - 手绘梯形透视
    var topLeftX = winX + topOffset;
    var topRightX = winX + windowW - topOffset;
    var botLeftX = winX - bottomOffset;
    var botRightX = winX + windowW + bottomOffset;
    
    ctx.moveTo(topLeftX, winY);
    ctx.lineTo(topRightX, winY);
    ctx.lineTo(botRightX, winY + windowH);
    ctx.lineTo(botLeftX, winY + windowH);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = glassGrad;
    ctx.fillRect(winX - 20, winY - 20, windowW + 40, windowH + 40);
    ctx.restore();
    
    // ---- 窗框（手绘风格，粗细不均） ----
    ctx.save();
    ctx.strokeStyle = '#4a3728';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 外框 - 粗线（手绘感）
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(topLeftX, winY);
    ctx.lineTo(topRightX, winY);
    ctx.lineTo(botRightX, winY + windowH);
    ctx.lineTo(botLeftX, winY + windowH);
    ctx.closePath();
    ctx.stroke();
    
    // 内框 - 细线
    ctx.lineWidth = 2;
    var inset = 8;
    ctx.beginPath();
    ctx.moveTo(topLeftX + inset, winY + inset);
    ctx.lineTo(topRightX - inset, winY + inset);
    ctx.lineTo(botRightX - inset, winY + windowH - inset);
    ctx.lineTo(botLeftX + inset, winY + windowH - inset);
    ctx.closePath();
    ctx.stroke();
    
    // ---- 窗格 ----
    if (windowStyle === 'grid') {
        // 方格窗
        ctx.lineWidth = 2.5;
        // 竖
        var midX1 = (topLeftX + topRightX) / 3;
        var midX2 = (topLeftX + topRightX) * 2 / 3;
        var botMidX1 = (botLeftX + botRightX) / 3;
        var botMidX2 = (botLeftX + botRightX) * 2 / 3;
        ctx.beginPath();
        ctx.moveTo(midX1, winY + inset);
        ctx.lineTo(botMidX1, winY + windowH - inset);
        ctx.moveTo(midX2, winY + inset);
        ctx.lineTo(botMidX2, winY + windowH - inset);
        ctx.stroke();
        // 横
        var midY1 = winY + windowH * 0.33;
        var midY2 = winY + windowH * 0.66;
        var topMidX = (topLeftX + topRightX) / 2;
        var botMidX = (botLeftX + botRightX) / 2;
        ctx.beginPath();
        ctx.moveTo(topLeftX + inset * 1.5, midY1);
        ctx.lineTo(botRightX - inset * 1.5, midY1);
        ctx.moveTo(topLeftX + inset * 1.5, midY2);
        ctx.lineTo(botRightX - inset * 1.5, midY2);
        ctx.stroke();
    } else if (windowStyle === 'french') {
        // 法式窗 - 中间竖框
        ctx.lineWidth = 3;
        var topMidX = (topLeftX + topRightX) / 2;
        var botMidX = (botLeftX + botRightX) / 2;
        ctx.beginPath();
        ctx.moveTo(topMidX, winY + inset);
        ctx.lineTo(botMidX, winY + windowH - inset);
        ctx.stroke();
        // 横档
        ctx.lineWidth = 2;
        var midY = winY + windowH * 0.5;
        ctx.beginPath();
        ctx.moveTo(topLeftX + inset, midY);
        ctx.lineTo(botRightX - inset, midY);
        ctx.stroke();
        // 顶部装饰弧线
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        var archY = winY + 10;
        ctx.moveTo(topLeftX + 20, archY);
        ctx.quadraticCurveTo((topLeftX + topRightX) / 2, winY - 15, topRightX - 20, archY);
        ctx.stroke();
    } else if (windowStyle === 'bay') {
        // 飘窗 - 额外窗台
        ctx.lineWidth = 2;
        var bayY = winY + windowH + 6;
        ctx.beginPath();
        ctx.moveTo(winX - 15, bayY);
        ctx.lineTo(winX + windowW + 15, bayY);
        ctx.lineTo(winX + windowW + 20, bayY + 8);
        ctx.lineTo(winX - 20, bayY + 8);
        ctx.closePath();
        ctx.stroke();
        // 窗台填充
        ctx.fillStyle = 'rgba(245,237,228,0.4)';
        ctx.fill();
        // 正常窗格
        ctx.lineWidth = 2;
        var tMidX = (topLeftX + topRightX) / 2;
        var bMidX = (botLeftX + botRightX) / 2;
        ctx.beginPath();
        ctx.moveTo(tMidX, winY + inset);
        ctx.lineTo(bMidX, winY + windowH - inset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(topLeftX + inset * 1.5, winY + windowH * 0.5);
        ctx.lineTo(botRightX - inset * 1.5, winY + windowH * 0.5);
        ctx.stroke();
    } else if (windowStyle === 'gothic') {
        // 哥特窗 - 尖顶
        ctx.lineWidth = 3;
        var topMidX = (topLeftX + topRightX) / 2;
        // 尖顶弧线
        ctx.beginPath();
        ctx.moveTo(topLeftX, winY);
        ctx.quadraticCurveTo(topMidX, winY - 30, topRightX, winY);
        ctx.stroke();
        // 尖顶装饰
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(topMidX - 20, winY + 5);
        ctx.quadraticCurveTo(topMidX, winY - 20, topMidX + 20, winY + 5);
        ctx.stroke();
        // 竖窗格
        var gMidX1 = (topLeftX + topRightX) / 3;
        var gMidX2 = (topLeftX + topRightX) * 2 / 3;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gMidX1, winY + 10);
        ctx.lineTo(gMidX1, winY + windowH - inset);
        ctx.moveTo(gMidX2, winY + 10);
        ctx.lineTo(gMidX2, winY + windowH - inset);
        ctx.stroke();
        // 横档
        var gMidY1 = winY + windowH * 0.4;
        var gMidY2 = winY + windowH * 0.7;
        ctx.beginPath();
        ctx.moveTo(topLeftX + 10, gMidY1);
        ctx.lineTo(botRightX - 10, gMidY1);
        ctx.moveTo(topLeftX + 10, gMidY2);
        ctx.lineTo(botRightX - 10, gMidY2);
        ctx.stroke();
    } else {
        // arch 拱形窗（默认）
        ctx.lineWidth = 2.5;
        // 拱形顶部弧线
        ctx.beginPath();
        var archY2 = winY + 5;
        ctx.moveTo(topLeftX + 15, archY2);
        ctx.quadraticCurveTo((topLeftX + topRightX) / 2, winY - 20, topRightX - 15, archY2);
        ctx.stroke();
        // 竖窗格
        var aMidX1 = (topLeftX + topRightX) / 3;
        var aMidX2 = (topLeftX + topRightX) * 2 / 3;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(aMidX1, winY + 10);
        ctx.lineTo(aMidX1, winY + windowH - inset);
        ctx.moveTo(aMidX2, winY + 10);
        ctx.lineTo(aMidX2, winY + windowH - inset);
        ctx.stroke();
        // 横档
        var aMidY = winY + windowH * 0.5;
        ctx.beginPath();
        ctx.moveTo(topLeftX + 10, aMidY);
        ctx.lineTo(botRightX - 10, aMidY);
        ctx.stroke();
    }
    
    // ---- 玻璃反光 ----
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(winX + 20, winY + 15);
    ctx.lineTo(winX + 60, winY + 15);
    ctx.lineTo(winX + 35, winY + 50);
    ctx.lineTo(winX + 10, winY + 50);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.06;
    ctx.beginPath();
    ctx.moveTo(winX + windowW - 50, winY + 25);
    ctx.lineTo(winX + windowW - 20, winY + 25);
    ctx.lineTo(winX + windowW - 35, winY + 55);
    ctx.lineTo(winX + windowW - 55, winY + 55);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    
    ctx.restore();
}

// ==================== 4. 绘制天气 ====================

function drawWeather(ctx, W, H, weather) {
    if (weather === 'sunny') {
        drawSunny(ctx, W, H);
    } else if (weather === 'cloudy') {
        drawCloudy(ctx, W, H);
    } else if (weather === 'rainy') {
        drawRainy(ctx, W, H);
    } else if (weather === 'snowy') {
        drawSnowy(ctx, W, H);
    } else if (weather === 'night') {
        drawNight(ctx, W, H);
    } else if (weather === 'sunset') {
        drawSunset(ctx, W, H);
    }
}

// ---- 晴天 ----
function drawSunny(ctx, W, H) {
    var cx = W * 0.82;
    var cy = H * 0.18;
    var r = 28;
    
    // 光晕
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
    glow.addColorStop(0, 'rgba(245,215,66,0.10)');
    glow.addColorStop(0.5, 'rgba(245,215,66,0.04)');
    glow.addColorStop(1, 'rgba(245,215,66,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 光芒（手绘线条）
    ctx.save();
    ctx.strokeStyle = 'rgba(180,160,130,0.25)';
    ctx.lineCap = 'round';
    for (var i = 0; i < 12; i++) {
        var angle = i * Math.PI / 6 + Math.PI / 12;
        var len = r * (1.2 + Math.random() * 0.3);
        ctx.lineWidth = 1.5 + Math.random() * 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * r * 0.9, cy + Math.sin(angle) * r * 0.9);
        ctx.lineTo(cx + Math.cos(angle) * (r + len), cy + Math.sin(angle) * (r + len));
        ctx.stroke();
    }
    ctx.restore();
    
    // 太阳主体
    var sunGrad = ctx.createRadialGradient(cx - 6, cy - 6, 0, cx, cy, r);
    sunGrad.addColorStop(0, '#fff7e6');
    sunGrad.addColorStop(0.3, '#f5e8c8');
    sunGrad.addColorStop(0.7, '#f0d8a8');
    sunGrad.addColorStop(1, '#e0c088');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    
    // 太阳描边（手绘感）
    ctx.strokeStyle = 'rgba(160,140,100,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 8, 8, 0, Math.PI * 2);
    ctx.fill();
}

// ---- 多云 ----
function drawCloudy(ctx, W, H) {
    var clouds = [
        { x: W * 0.15, y: H * 0.12, s: 1.0 },
        { x: W * 0.45, y: H * 0.08, s: 0.8 },
        { x: W * 0.70, y: H * 0.15, s: 0.9 },
        { x: W * 0.30, y: H * 0.25, s: 0.6 },
        { x: W * 0.85, y: H * 0.22, s: 0.5 }
    ];
    
    for (var i = 0; i < clouds.length; i++) {
        var c = clouds[i];
        drawCloud(ctx, c.x, c.y, 50 * c.s, 20 * c.s, 0.25 + c.s * 0.1);
    }
}

function drawCloud(ctx, x, y, w, h, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // 云朵阴影
    ctx.fillStyle = 'rgba(180,175,165,0.2)';
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 4, w * 0.8, h * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 云朵主体 - 多个椭圆叠加
    ctx.fillStyle = 'rgba(220,215,208,0.35)';
    ctx.strokeStyle = 'rgba(180,175,165,0.15)';
    ctx.lineWidth = 1;
    
    var parts = [
        { dx: 0, dy: 0, rx: w * 0.5, ry: h * 0.7 },
        { dx: w * 0.3, dy: -h * 0.3, rx: w * 0.4, ry: h * 0.6 },
        { dx: -w * 0.3, dy: -h * 0.2, rx: w * 0.35, ry: h * 0.5 },
        { dx: w * 0.5, dy: h * 0.1, rx: w * 0.3, ry: h * 0.5 },
        { dx: -w * 0.5, dy: h * 0.1, rx: w * 0.3, ry: h * 0.5 }
    ];
    
    for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        ctx.beginPath();
        ctx.ellipse(x + p.dx, y + p.dy, p.rx, p.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    ctx.restore();
}

// ---- 下雨 ----
function drawRainy(ctx, W, H) {
    // 雨云
    drawCloud(ctx, W * 0.2, H * 0.10, 60, 22, 0.5);
    drawCloud(ctx, W * 0.65, H * 0.08, 55, 20, 0.45);
    drawCloud(ctx, W * 0.45, H * 0.15, 45, 18, 0.35);
    
    // 雨滴
    ctx.save();
    ctx.strokeStyle = 'rgba(140,180,210,0.25)';
    ctx.lineCap = 'round';
    for (var i = 0; i < 60; i++) {
        var x = Math.random() * W;
        var y = Math.random() * H * 0.6 + H * 0.1;
        var len = 8 + Math.random() * 14;
        var angle = Math.PI / 6 + Math.random() * 0.1;
        ctx.lineWidth = 1 + Math.random() * 1;
        ctx.globalAlpha = 0.15 + Math.random() * 0.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.sin(angle) * len, y + Math.cos(angle) * len);
        ctx.stroke();
    }
    ctx.restore();
}

// ---- 下雪 ----
function drawSnowy(ctx, W, H) {
    // 雪云
    drawCloud(ctx, W * 0.25, H * 0.08, 55, 20, 0.3);
    drawCloud(ctx, W * 0.70, H * 0.10, 50, 18, 0.25);
    
    // 雪花
    ctx.save();
    for (var i = 0; i < 50; i++) {
        var x = Math.random() * W;
        var y = Math.random() * H * 0.6 + H * 0.1;
        var r = 2 + Math.random() * 4;
        var alpha = 0.15 + Math.random() * 0.25;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(220,230,240,0.4)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        // 六角形细节
        ctx.strokeStyle = 'rgba(200,210,220,0.2)';
        ctx.lineWidth = 0.5;
        for (var j = 0; j < 6; j++) {
            var a = j * Math.PI / 3 + Math.random() * 0.1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8);
            ctx.stroke();
        }
    }
    ctx.restore();
}

// ---- 夜晚 ----
function drawNight(ctx, W, H) {
    // 月亮
    var mx = W * 0.78;
    var my = H * 0.16;
    var mr = 26;
    
    // 月光晕
    var glow2 = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 4);
    glow2.addColorStop(0, 'rgba(220,215,200,0.06)');
    glow2.addColorStop(0.5, 'rgba(220,215,200,0.03)');
    glow2.addColorStop(1, 'rgba(220,215,200,0)');
    ctx.fillStyle = glow2;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 月亮主体
    var moonGrad = ctx.createRadialGradient(mx - 5, my - 5, 0, mx, my, mr);
    moonGrad.addColorStop(0, '#f5f0e8');
    moonGrad.addColorStop(0.5, '#e8e0d8');
    moonGrad.addColorStop(0.8, '#d8d0c8');
    moonGrad.addColorStop(1, '#c8c0b8');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,170,160,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 月面纹理
    ctx.fillStyle = 'rgba(200,190,180,0.10)';
    ctx.beginPath();
    ctx.arc(mx - 8, my - 5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx + 6, my + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx - 3, my + 10, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 星星
    for (var i = 0; i < 30; i++) {
        var sx = Math.random() * W * 0.85 + W * 0.05;
        var sy = Math.random() * H * 0.35 + H * 0.02;
        var sr = 0.5 + Math.random() * 1.5;
        var alpha = 0.1 + Math.random() * 0.3;
        ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
        // 十字光芒
        if (Math.random() > 0.7) {
            ctx.strokeStyle = 'rgba(255,255,255,' + (alpha * 0.5) + ')';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(sx - sr * 2.5, sy);
            ctx.lineTo(sx + sr * 2.5, sy);
            ctx.moveTo(sx, sy - sr * 2.5);
            ctx.lineTo(sx, sy + sr * 2.5);
            ctx.stroke();
        }
    }
}

// ---- 晚霞 ----
function drawSunset(ctx, W, H) {
    // 夕阳
    var sx = W * 0.80;
    var sy = H * 0.20;
    var sr = 30;
    
    // 霞光
    var sunsetGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 5);
    sunsetGlow.addColorStop(0, 'rgba(232,160,112,0.12)');
    sunsetGlow.addColorStop(0.3, 'rgba(232,160,112,0.06)');
    sunsetGlow.addColorStop(0.6, 'rgba(200,150,130,0.03)');
    sunsetGlow.addColorStop(1, 'rgba(200,150,130,0)');
    ctx.fillStyle = sunsetGlow;
    ctx.beginPath();
    ctx.arc(sx, sy, sr * 5, 0, Math.PI * 2);
    ctx.fill();
    
    // 夕阳主体
    var sunsetGrad = ctx.createRadialGradient(sx - 5, sy - 5, 0, sx, sy, sr);
    sunsetGrad.addColorStop(0, '#f5d8b8');
    sunsetGrad.addColorStop(0.4, '#f0c8a0');
    sunsetGrad.addColorStop(0.7, '#e8a878');
    sunsetGrad.addColorStop(1, '#d48860');
    ctx.fillStyle = sunsetGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,130,100,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 晚霞云
    for (var i = 0; i < 5; i++) {
        var cx = W * (0.1 + i * 0.2);
        var cy = H * (0.08 + Math.random() * 0.15);
        var cw = 40 + Math.random() * 30;
        var ch = 12 + Math.random() * 8;
        ctx.fillStyle = 'rgba(210,160,140,0.12)';
        ctx.strokeStyle = 'rgba(200,150,130,0.06)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 云内部亮色
        ctx.fillStyle = 'rgba(240,200,170,0.05)';
        ctx.beginPath();
        ctx.ellipse(cx + 10, cy - 5, cw * 0.5, ch * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 飞鸟剪影（手绘）
    ctx.strokeStyle = 'rgba(140,120,100,0.15)';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    for (var b = 0; b < 3; b++) {
        var bx = W * (0.15 + b * 0.2);
        var by = H * (0.08 + b * 0.04);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + 8, by - 10, bx + 16, by - 2);
        ctx.moveTo(bx + 16, by - 2);
        ctx.quadraticCurveTo(bx + 24, by - 10, bx + 32, by);
        ctx.stroke();
    }
}

// ==================== 5. 氛围光影 ====================

function drawAtmosphere(ctx, W, H, weather) {
    // 室内暖光（从窗户方向来的光）
    var lightGrad = ctx.createRadialGradient(W/2, H*0.2, 0, W/2, H*0.2, W*0.5);
    lightGrad.addColorStop(0, 'rgba(255,248,240,0.04)');
    lightGrad.addColorStop(0.5, 'rgba(255,248,240,0.02)');
    lightGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, W, H);
    
    // 顶部微暗
    var topShadow = ctx.createLinearGradient(0, 0, 0, H * 0.3);
    topShadow.addColorStop(0, 'rgba(0,0,0,0.03)');
    topShadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topShadow;
    ctx.fillRect(0, 0, W, H * 0.3);
    
    // 底部阴影
    var botShadow = ctx.createLinearGradient(0, H * 0.7, 0, H);
    botShadow.addColorStop(0, 'rgba(0,0,0,0)');
    botShadow.addColorStop(1, 'rgba(0,0,0,0.04)');
    ctx.fillStyle = botShadow;
    ctx.fillRect(0, H * 0.7, W, H * 0.3);
}

// ==================== 自动调整大小 ====================

function resizeCozyCanvas() {
    var container = document.getElementById('cozyCanvasContainer');
    if (!container) return;
    var rect = container.getBoundingClientRect();
    if (rect.width > 10 && rect.height > 10) {
        renderCozyCanvas();
    }
}

// ==================== 暴露接口 ====================

window.renderCozyCanvas = renderCozyCanvas;
window.resizeCozyCanvas = resizeCozyCanvas;

console.log('暖屋 Canvas 手绘版已加载');
