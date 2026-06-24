// ==================== 随机画图模块（支持组合绘制，图形随机位置） ====================
var RandomDrawing = {
    // 规则图形库
    shapes: ['circle', 'square', 'triangle', 'star', 'heart'],
    
    // 生成随机整数
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // 生成随机颜色
    randomColor: function() {
        var hue = Math.random();
        return 'hsl(' + (hue * 360) + ', 70%, 60%)';
    },
    
    // 绘制波浪线
    drawWave: function(ctx, width, height, color, lineWidth) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        var amplitude = height * 0.25;
        var frequency = 0.05;
        var startY = height / 2;
        
        for (var x = 20; x <= width - 20; x += 5) {
            var y = startY + amplitude * Math.sin(x * frequency);
            if (x === 20) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    },
    
    // 绘制螺旋线
    drawSpiral: function(ctx, width, height, color, lineWidth) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        var centerX = width / 2;
        var centerY = height / 2;
        var turns = 3;
        var maxRadius = Math.min(width, height) * 0.35;
        
        for (var angle = 0; angle <= turns * 2 * Math.PI; angle += 0.1) {
            var r = (angle / (turns * 2 * Math.PI)) * maxRadius;
            var x = centerX + r * Math.cos(angle);
            var y = centerY + r * Math.sin(angle);
            if (angle === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    },
    
    // 随机不规则线条（直线、斜线、弯线、曲线、折线等）
    drawRandomLines: function(ctx, width, height, color, lineWidth) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        var linesCount = this.randomInt(8, 18);  // 8-18条线
    
        for (var i = 0; i < linesCount; i++) {
            var lineType = this.randomInt(1, 6);  // 1-6 种线条类型
            ctx.beginPath();
        
            // 随机起点
            var startX = Math.random() * width;
            var startY = Math.random() * height;
            ctx.moveTo(startX, startY);
        
            if (lineType === 1) {
                // 直线/斜线：直接连接到随机终点
                var endX = Math.random() * width;
                var endY = Math.random() * height;
                ctx.lineTo(endX, endY);
            } 
            else if (lineType === 2) {
                // 折线（2-3个转折点）
                var points = this.randomInt(2, 4);
                var currentX = startX;
                var currentY = startY;
                for (var p = 0; p < points; p++) {
                    currentX += this.randomInt(-40, 40);
                    currentY += this.randomInt(-40, 40);
                    currentX = Math.min(width - 10, Math.max(10, currentX));
                    currentY = Math.min(height - 10, Math.max(10, currentY));
                    ctx.lineTo(currentX, currentY);
                }
            }
            else if (lineType === 3) {
                // 贝塞尔曲线（光滑曲线）
                var cp1x = startX + this.randomInt(-50, 50);
                var cp1y = startY + this.randomInt(-50, 50);
                var cp2x = startX + this.randomInt(-30, 80);
                var cp2y = startY + this.randomInt(-80, 30);
                var endX = startX + this.randomInt(-60, 60);
                var endY = startY + this.randomInt(-60, 60);
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
            }
            else if (lineType === 4) {
                // 二次贝塞尔曲线（抛物线形）
                var cpX = startX + this.randomInt(-60, 60);
                var cpY = startY + this.randomInt(-80, 80);
                var endX = startX + this.randomInt(-50, 50);
                var endY = startY + this.randomInt(-50, 50);
                ctx.quadraticCurveTo(cpX, cpY, endX, endY);
            }
            else if (lineType === 5) {
                // 波浪曲线（小幅度摆动）
                var steps = this.randomInt(5, 12);
                var stepX = this.randomInt(10, 25);
                var stepY = this.randomInt(-15, 15);
                var currentX = startX;
                var currentY = startY;
                for (var s = 0; s < steps; s++) {
                    currentX += stepX;
                    currentY += stepY;
                    if (s % 2 === 0) currentY += this.randomInt(-20, 20);
                    else currentY -= this.randomInt(-10, 30);
                    currentX = Math.min(width - 10, Math.min(width - 10, Math.max(10, currentX)));
                    currentY = Math.min(height - 10, Math.min(height - 10, Math.max(10, currentY)));
                    ctx.lineTo(currentX, currentY);
                    stepY = this.randomInt(-20, 20);
                }
            }
            else {
                // 环形/螺旋片段
                var centerX = startX;
                var centerY = startY;
                var radius = this.randomInt(10, 40);
                var startAngle = Math.random() * 2 * Math.PI;
                var endAngle = startAngle + Math.PI * (0.5 + Math.random() * 1.5);
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            }
        
            ctx.stroke();
        }
    },
    
    // 绘制规则图形
    drawShape: function(ctx, width, height, shape, color, lineWidth, xOffset, yOffset) {
        ctx.fillStyle = color;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = lineWidth;
        var centerX = width / 2 + (xOffset || 0);
        var centerY = height / 2 + (yOffset || 0);
        var size = Math.min(width, height) * 0.2;
        
        switch(shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(centerX, centerY, size, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                break;
            case 'square':
                ctx.fillRect(centerX - size/2, centerY - size/2, size, size);
                ctx.strokeRect(centerX - size/2, centerY - size/2, size, size);
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - size/1.2);
                ctx.lineTo(centerX + size/1.2, centerY + size/2);
                ctx.lineTo(centerX - size/1.2, centerY + size/2);
                ctx.fill();
                ctx.stroke();
                break;
            case 'star':
                this.drawStar(ctx, centerX, centerY, 5, size, size/2.5);
                ctx.fill();
                ctx.stroke();
                break;
            case 'heart':
                this.drawHeart(ctx, centerX, centerY, size);
                ctx.fill();
                ctx.stroke();
                break;
        }
    },
    
    // 星形
    drawStar: function(ctx, cx, cy, spikes, outerR, innerR) {
        var rot = Math.PI / 2 * 3;
        var step = Math.PI / spikes;
        ctx.beginPath();
        for(var i = 0; i < spikes; i++) {
            var x = cx + Math.cos(rot) * outerR;
            var y = cy + Math.sin(rot) * outerR;
            ctx.lineTo(x, y);
            rot += step;
            x = cx + Math.cos(rot) * innerR;
            y = cy + Math.sin(rot) * innerR;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.closePath();
    },
    
    // 心形
    drawHeart: function(ctx, x, y, size) {
        ctx.beginPath();
        var topCurveHeight = size * 0.3;
        ctx.moveTo(x, y - topCurveHeight);
        ctx.bezierCurveTo(x, y - size, x - size/2, y - size, x - size/2, y - topCurveHeight);
        ctx.bezierCurveTo(x - size/2, y, x, y + size/1.5, x, y + size);
        ctx.bezierCurveTo(x, y + size/1.5, x + size/2, y, x + size/2, y - topCurveHeight);
        ctx.bezierCurveTo(x + size/2, y - size, x, y - size, x, y - topCurveHeight);
        ctx.closePath();
    },
    
    // 主生成函数：随机组合2-3种元素，图形完全随机位置
    generateCanvas: function() {
        var canvas = document.createElement('canvas');
        canvas.width = 250;
        canvas.height = 250;
        var ctx = canvas.getContext('2d');
        
        // 背景色
        // 从 CSS 变量读取当前背景色
        var bgColor = getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#f5f0eb';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 250, 250);
        
        // 随机决定组合数量（2或3种元素）
        var elementCount = this.randomInt(2, 3);
        var usedTypes = [];
        var lineWidth = this.randomInt(2, 6);
        
        for (var i = 0; i < elementCount; i++) {
            // 随机选择类型，避免重复
            var availableTypes = ['shape', 'wave', 'spiral', 'randomLines'];
            if (usedTypes.length > 0) {
                availableTypes = availableTypes.filter(function(t) { return usedTypes.indexOf(t) === -1; });
            }
            var type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            usedTypes.push(type);
            
            var mainColor = this.randomColor();
            
            if (type === 'shape') {
                var shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
                // 完全随机位置：-80 到 80 之间随机偏移
                var xOffset = this.randomInt(-80, 80);
                var yOffset = this.randomInt(-80, 80);
                this.drawShape(ctx, 250, 250, shape, mainColor, lineWidth, xOffset, yOffset);
            } else if (type === 'wave') {
                this.drawWave(ctx, 250, 250, mainColor, lineWidth);
            } else if (type === 'spiral') {
                this.drawSpiral(ctx, 250, 250, mainColor, lineWidth);
            } else if (type === 'randomLines') {
                this.drawRandomLines(ctx, 250, 250, mainColor, lineWidth);
            }
        }
        
        // 底部标注
        ctx.font = '12px "Segoe UI"';
        ctx.fillStyle = '#555555';
        ctx.fillText('画笔粗细: ' + lineWidth + 'px', 10, 235);
        ctx.fillText('组合: ' + elementCount + '种', 10, 220);
        
        // 强制完成绘制
        ctx.getImageData(0, 0, 250, 250);
        
        return canvas.toDataURL('image/png');
    },
    
    // 对外接口
    getRandomDrawing: function() {
        return RandomDrawing.generateCanvas();
    }
};

// ==================== 预加载并发送画图 ====================
function sendDrawingAsOther() {
    var imgData = RandomDrawing.getRandomDrawing();
    var img = new Image();
    img.onload = function() {
        var imgHtml = '<img src="' + imgData + '" style="max-width:200px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">';
        if (typeof addMessage === 'function') {
            addMessage(imgHtml, 'other', true, false);
            if (typeof appData !== 'undefined' && appData.chatHistory) {
                appData.chatHistory.push({
                    type: 'other',
                    content: imgHtml,
                    time: Date.now(),
                    isDrawing: true
                });
                if (typeof saveData === 'function') saveData();
            }
        }
    };
    img.src = imgData;
}

// 导出到全局
window.RandomDrawing = RandomDrawing;
window.sendDrawingAsOther = sendDrawingAsOther;

console.log('随机画图模块已加载（支持组合绘制，图形随机位置）');
