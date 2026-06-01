// ==================== 随机画图模块（图形+波浪线+螺旋线+随机粗细） ====================
var RandomDrawing = {
    // 规则图形库
    shapes: ['circle', 'square', 'triangle', 'star', 'heart'],
    
    // 生成随机整数 [min,max]
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // 生成随机颜色
    randomColor: function() {
        var hue = Math.random();
        return 'hsl(' + (hue * 360) + ', 70%, 60%)';
    },
    
    // 绘制波浪线（正弦曲线）
    drawWave: function(ctx, width, height, color, lineWidth) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        var amplitude = height * 0.3;
        var frequency = 0.05;
        var startY = height / 2;
        
        for (var x = 20; x <= width - 20; x += 5) {
            var y = startY + amplitude * Math.sin(x * frequency);
            if (x === 20) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    },
    
    // 绘制螺旋线（阿基米德螺旋）
    drawSpiral: function(ctx, width, height, color, lineWidth) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        var centerX = width / 2;
        var centerY = height / 2;
        var turns = 3;
        var maxRadius = Math.min(width, height) * 0.4;
        
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
        var linesCount = this.randomInt(15, 30);
        for (var i = 0; i < linesCount; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.lineTo(Math.random() * width, Math.random() * height);
            ctx.stroke();
        }
    },
    
    // 绘制规则图形
    drawShape: function(ctx, width, height, shape, color, lineWidth) {
        ctx.fillStyle = color;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = lineWidth;
        var centerX = width / 2;
        var centerY = height / 2;
        var size = Math.min(width, height) * 0.4;
        
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
                ctx.moveTo(centerX, centerY - size/1.5);
                ctx.lineTo(centerX + size/1.2, centerY + size/2);
                ctx.lineTo(centerX - size/1.2, centerY + size/2);
                ctx.fill();
                ctx.stroke();
                break;
            case 'star':
                this.drawStar(ctx, centerX, centerY, 5, size, size/2);
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
    
    // 星形辅助函数
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
    
    // 心形辅助函数
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
    
    // 主生成函数：随机类型 + 随机粗细
    generateCanvas: function() {
        var canvas = document.createElement('canvas');
        canvas.width = 250;
        canvas.height = 250;
        var ctx = canvas.getContext('2d');
        
        // 背景色
        ctx.fillStyle = '#FFF9F0';
        ctx.fillRect(0, 0, 250, 250);
        
        // 随机决定类型
        var typeRand = Math.random();
        var type;
        if (typeRand < 0.4) {
            type = 'shape';
        } else if (typeRand < 0.6) {
            type = 'wave';
        } else if (typeRand < 0.8) {
            type = 'spiral';
        } else {
            type = 'randomLines';
        }
        
        // 随机画笔粗细（1-6px）
        var lineWidth = this.randomInt(1, 6);
        var mainColor = this.randomColor();
        
        // 根据类型绘制
        if (type === 'shape') {
            var shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
            this.drawShape(ctx, 250, 250, shape, mainColor, lineWidth);
        } else if (type === 'wave') {
            this.drawWave(ctx, 250, 250, mainColor, lineWidth);
        } else if (type === 'spiral') {
            this.drawSpiral(ctx, 250, 250, mainColor, lineWidth);
        } else {
            this.drawRandomLines(ctx, 250, 250, mainColor, lineWidth);
        }
        
        // 底部标注画笔粗细
        ctx.font = '12px "Segoe UI"';
        ctx.fillStyle = '#555555';
        ctx.fillText('画笔粗细: ' + lineWidth + 'px', 10, 235);
        
        return canvas.toDataURL();
    },
    
    // 对外接口：随机画一张图
    getRandomDrawing: function() {
        return RandomDrawing.generateCanvas();
    }
};

// ==================== 绑定按钮事件 ====================
document.addEventListener('DOMContentLoaded', function() {
    var drawBtn = document.getElementById('randomDrawBtn');
    if (drawBtn) {
        drawBtn.addEventListener('click', function() {
            var imgData = RandomDrawing.getRandomDrawing();
            var imgHtml = '<img src="' + imgData + '" style="max-width:200px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">';
            
            // 调用 core.js 中的 addMessage 函数
            if (typeof addMessage === 'function') {
                addMessage(imgHtml, 'me', true, false);
                
                // 保存到聊天历史
                if (typeof appData !== 'undefined' && appData.chatHistory) {
                    appData.chatHistory.push({
                        type: 'me',
                        content: imgHtml,
                        time: Date.now(),
                        isDrawing: true
                    });
                    if (typeof saveData === 'function') {
                        saveData();
                    }
                }
                
                // 触发对方自动回复
                setTimeout(function() {
                    if (typeof triggerAutoReply === 'function') {
                        triggerAutoReply();
                    }
                }, 400);
                
            } else {
                console.log('[随机画图] addMessage 函数未找到');
                // 降级方案：直接在聊天区域追加
                var chatArea = document.getElementById('chat');
                if (chatArea) {
                    var msgDiv = document.createElement('div');
                    msgDiv.className = 'msg me';
                    msgDiv.innerHTML = '<div class="avatar-wrap" onclick="onMyAvatarClick()">' + 
                        (typeof getAvatarHTMLSync === 'function' ? getAvatarHTMLSync(true) : '<div class="avatar-placeholder">我</div>') + 
                        '</div><div class="bubble">' + imgHtml + '<span class="msg-time">' + 
                        (typeof formatTimeShort === 'function' ? formatTimeShort(Date.now()) : '') + '</span></div>';
                    chatArea.appendChild(msgDiv);
                    chatArea.scrollTop = chatArea.scrollHeight;
                }
            }
        });
    }
});
