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
    
    // 随机直线涂鸦
    drawRandomLines: function(ctx, width, height, color, lineWidth) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        var linesCount = this.randomInt(10, 20);
        for (var i = 0; i < linesCount; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.lineTo(Math.random() * width, Math.random() * height);
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
        ctx.fillStyle = '#FFF9F0';
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
